


const multer = require('multer');
<<<<<<< HEAD
const path = require('path');
const fs = require('fs');

/* ===============================
   COMMON HELPERS
================================ */

// Ensure upload directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function imageFilter(req, file, cb) {
  const allowedMime = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/octet-stream', // 🔥 ANDROID FIX
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];

  if (allowedMime.includes(file.mimetype) || allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(null, false); // ❗ DO NOT THROW ERROR
  }
}


/* ===============================
   PATIENT PHOTO UPLOAD
================================ */

const patientUploadPath = path.join(__dirname, '../../uploads/patients');
ensureDir(patientUploadPath);

const patientStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, patientUploadPath);
  },
  filename: (req, file, cb) => {
    const unique =
      Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const uploadPatientPhoto = multer({
  storage: patientStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: imageFilter,
});

/* ===============================
   DOCTOR PHOTO UPLOAD
================================ */

const doctorUploadPath = path.join(__dirname, '../../uploads/doctors');
ensureDir(doctorUploadPath);

const doctorStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, doctorUploadPath);
  },
  filename: (req, file, cb) => {
    const unique =
      Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const uploadDoctorPhoto = multer({
  storage: doctorStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: imageFilter,
});

/* ===============================
   EXPORTS
================================ */

module.exports = {
  uploadPatientPhoto,
  uploadDoctorPhoto,
};
=======

const storage = multer.memoryStorage(); // ✅ REQUIRED for S3

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = upload;
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
