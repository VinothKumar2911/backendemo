const multer = require('multer');

const storage = multer.memoryStorage(); // ✅ REQUIRED for S3

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = upload;
