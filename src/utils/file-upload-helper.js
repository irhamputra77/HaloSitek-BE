/**
 * File Upload Utility
 * - Serverless-safe: pakai memoryStorage (tidak tulis ke disk)
 * - persistFile(): upload ke storage eksternal (contoh: Cloudinary)
 * - safeDeleteFile(): hapus file eksternal (best effort)
 */

const multer = require("multer");
const path = require("path");
const { FileUploadError } = require("../errors/app-errors");

// ✅ OPTIONAL (RECOMMENDED) Cloudinary
// npm i cloudinary streamifier
let cloudinary = null;
let streamifier = null;
try {
  cloudinary = require("cloudinary").v2;
  streamifier = require("streamifier");
} catch (_) {
  // kalau belum install, tetap jalan untuk local (tapi di vercel akan butuh provider)
}

class FileUploadHelper {
  // =========================
  // Multer config (SERVERLESS)
  // =========================

  static isReadOnlyFs() {
    return (
      process.env.VERCEL === "1" ||
      process.env.VERCEL === "true" ||
      process.env.SERVERLESS === "true" ||
      process.env.READ_ONLY_FS === "true" ||
      process.env.NODE_ENV === "production"
    );
  }
  static getStorage(destination = "uploads/temp") {
    // ✅ di Vercel: jangan diskStorage
    if (this.isReadOnlyFs()) {
      return multer.memoryStorage();
    }

    const normalizedDestination =
      destination.startsWith("uploads/")
        ? destination
        : path.join("uploads", destination);

    // ✅ perbaiki: ensureDirectoryExists harus pakai normalizedDestination
    this.ensureDirectoryExists(normalizedDestination);

    return multer.diskStorage({
      destination: (req, file, cb) => cb(null, normalizedDestination),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "-");
        cb(null, `${safeName}-${uniqueSuffix}${ext}`);
      },
    });
  }

  static imageFilter(req, file, cb) {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new FileUploadError("Only JPEG, JPG, and PNG images are allowed"), false);
  }

  static documentFilter(req, file, cb) {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new FileUploadError("Only PDF, JPEG, JPG, and PNG files are allowed"), false);
  }

  static getMaxFileSize() {
    return parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB
  }

  // =========================
  // URL helper
  // =========================
  static getFileUrl(filePathOrUrl) {
    if (!filePathOrUrl) return null;

    // ✅ kalau sudah URL penuh, balikin apa adanya
    const s = String(filePathOrUrl);
    if (/^https?:\/\//i.test(s)) return s;

    // local dev: serve static dari BACKEND_URL
    const baseUrl = process.env.BACKEND_URL || "http://localhost:3000";
    const normalized = s.replace(/\\/g, "/").replace(/^\/+/, "");
    return `${baseUrl}/${normalized}`;
  }

  // =========================
  // Persist to external storage
  // =========================
  static initCloudinaryIfNeeded() {
    if (!cloudinary) return false;
    if (!process.env.CLOUDINARY_CLOUD_NAME) return false;

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return true;
  }

  static async persistFile(file, folder) {
    if (!file) return null;

    // ✅ jika file sudah berupa URL (misal dari client), balikin
    if (typeof file === "string" && /^https?:\/\//i.test(file)) return file;

    // file dari multer.memoryStorage -> ada buffer
    if (!file.buffer) {
      throw new Error(
        "Uploaded file has no buffer. Pastikan multer pakai memoryStorage(), bukan diskStorage()."
      );
    }

    // ✅ Cloudinary upload (recommended untuk Vercel)
    const canUseCloudinary = this.initCloudinaryIfNeeded();
    if (!canUseCloudinary || !streamifier) {
      throw new Error(
        "Storage eksternal belum dikonfigurasi. Install cloudinary + streamifier dan set env CLOUDINARY_*."
      );
    }

    const ext = path.extname(file.originalname || "");
    const isPdf = file.mimetype === "application/pdf" || ext.toLowerCase() === ".pdf";

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder || "uploads",
          resource_type: isPdf ? "raw" : "image",
        },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });

    return uploadResult.secure_url; // ✅ simpan URL ini ke DB
  }

  static async persistFiles(files, folder) {
    const arr = Array.isArray(files) ? files : [];
    const urls = [];
    for (const f of arr) {
      const url = await this.persistFile(f, folder);
      if (url) urls.push(url);
    }
    return urls;
  }

  // =========================
  // Safe delete (best effort)
  // =========================
  static extractCloudinaryPublicId(url) {
    // contoh: https://res.cloudinary.com/<cloud>/<type>/upload/v123/folder/name.jpg
    const s = String(url || "");
    const m = s.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    return m ? m[1] : null;
  }

  static async safeDeleteFile(fileUrl) {
    if (!fileUrl) return;

    if (!cloudinary || !process.env.CLOUDINARY_CLOUD_NAME) return;

    const publicId = this.extractCloudinaryPublicId(fileUrl);
    if (!publicId) return;

    // best-effort: coba image dulu, kalau gagal coba raw
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    } catch (_) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
      } catch (_) { }
    }
  }

  // backward compat (kalau masih ada pemanggilan lama)
  static deleteFile(fileUrl) {
    // jangan crash, jalankan best-effort async
    this.safeDeleteFile(fileUrl).catch(() => { });
    return true;
  }
}

module.exports = FileUploadHelper;
