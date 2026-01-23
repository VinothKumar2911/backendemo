// const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
// const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const BUCKET = process.env.S3_BUCKET;

// exports.uploadToS3 = async (file, folder) => {
//   const key = `${folder}/${Date.now()}-${file.originalname}`;

//   await s3.send(
//     new PutObjectCommand({
//       Bucket: BUCKET,
//       Key: key,
//       Body: file.buffer,
//       ContentType: file.mimetype,
//     })
//   );

//   return key; // store THIS in DB
// };

// exports.getSignedUrl = async (key) => {
//   if (!key) return null;

//   const command = new GetObjectCommand({
//     Bucket: BUCKET,
//     Key: key,
//   });

//   return await getSignedUrl(s3, command, { expiresIn: 3600 });
// };


  // const { Upload } = require("@aws-sdk/lib-storage");
  // const {
  //   S3Client,
  //   PutObjectCommand,
  //   GetObjectCommand,
  //   DeleteObjectCommand,
  // } = require('@aws-sdk/client-s3');

  // // 👇 RENAME AWS helper to avoid collision
  // const {
  //   getSignedUrl: getAwsSignedUrl,
  // } = require('@aws-sdk/s3-request-presigner');

  // const s3 = new S3Client({
  //   region: process.env.AWS_REGION,
  //   credentials: {
  //     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  //   },
  // });

  // const BUCKET = process.env.S3_BUCKET;

  // /* =========================
  //   UPLOAD FILE
  // ========================= */
  // exports.uploadToS3 = async (file, folder) => {
  //   const key = `${folder}/${Date.now()}-${file.originalname}`;

  //   await s3.send(
  //     new PutObjectCommand({
  //       Bucket: BUCKET,
  //       Key: key,
  //       Body: file.buffer,
  //       ContentType: file.mimetype,
  //     })
  //   );

  //   return key; // store ONLY key in DB
  // };

  // /* =========================
  //   GET SIGNED URL
  // ========================= */
  // exports.getSignedUrl = async (key) => {
  //   if (!key) return null;

  //   const command = new GetObjectCommand({
  //     Bucket: BUCKET,
  //     Key: key,
  //   });

  //   return await getAwsSignedUrl(s3, command, {
  //     expiresIn: 60 * 60, // 1 hour
  //   });
  // };

  // /* =========================
  //   DELETE FILE (OPTIONAL BUT SAFE)
  // ========================= */
  // exports.deleteFromS3 = async (key) => {
  //   if (!key) return;

  //   await s3.send(
  //     new DeleteObjectCommand({
  //       Bucket: BUCKET,
  //       Key: key,
  //     })
  //   );
  // };




  const { S3Client, GetObjectCommand, DeleteObjectCommand } =
  require('@aws-sdk/client-s3');

const { Upload } = require('@aws-sdk/lib-storage');

// 👇 rename to avoid name collision
const {
  getSignedUrl: getAwsSignedUrl,
} = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET;

/* =========================
   UPLOAD FILE (BEST PRACTICE)
   ✅ Uses Upload from lib-storage
   ✅ No AWS warning
========================= */
exports.uploadToS3 = async (file, folder) => {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new Error('Invalid or empty file buffer');
  }

  const key = `${folder}/${Date.now()}-${file.originalname}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.buffer.length, // 🔥 IMPORTANT
    })
  );

  return key;
};


/* =========================
   GET SIGNED URL
   ✅ Used by dashboard + profile
========================= */
exports.getSignedUrl = async (key) => {
  if (!key) return null;

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return await getAwsSignedUrl(s3, command, {
    expiresIn: 60 * 60, // 1 hour
  });
};

/* =========================
   DELETE FILE
   ✅ Use when replacing photo
========================= */
exports.deleteFromS3 = async (key) => {
  if (!key) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
};
