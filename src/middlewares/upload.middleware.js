const multer = require("multer");
const { FileUploadError } = require("../errors/app-errors");


// ✅ memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
  const allowedDocTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

  if (file.fieldname === "profilePicture") {
    return allowedImageTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new FileUploadError("Only JPEG, JPG, and PNG images allowed for profile picture"), false);
  }

  if (file.fieldname === "certifications") {
    return allowedDocTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new FileUploadError("Only PDF, JPEG, JPG, and PNG files allowed for certifications"), false);
  }

  return cb(new FileUploadError("Unexpected field"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  },
});

const uploadArchitectFiles = upload.fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "certifications", maxCount: 10 },
]);

module.exports = { uploadArchitectFiles, upload };
