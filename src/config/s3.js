const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
});

exports.getSignedUrl = (key) => {
  return s3.getSignedUrl('getObject', {
    Bucket: 'hospital-app-media',
    Key: key,
    Expires: 900, // 5 minutes
  });
};
