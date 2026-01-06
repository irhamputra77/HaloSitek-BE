const multer = require("multer");
const FileUploadHelper = require("../utils/file-upload-helper");

const uploadArsipediaImage = multer({
  storage: FileUploadHelper.getStorage(), // ✅ memory storage
  fileFilter: FileUploadHelper.imageFilter,
  limits: { fileSize: FileUploadHelper.getMaxFileSize() },
}).single("image");

module.exports = { uploadArsipediaImage };
