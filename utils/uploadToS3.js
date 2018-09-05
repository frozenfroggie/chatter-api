const aws = require('aws-sdk');

const generateRandomFileName = originalFileName => {
  const fileNameSplitted = originalFileName.split('.');
  const fileExt = fileNameSplitted[fileNameSplitted.length - 1];
  return Date.now().toString() + '.' + fileExt;
}

const uploadToS3 = file => {
  return new Promise((resolve, reject) => {
    const s3bucket = new aws.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      Bucket: process.env.AWS_BUCKET_NAME
    });
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: generateRandomFileName(file.name),
      Body: file.data
    };
    s3bucket.upload(params, function (err, data) {
      if(err) {
        reject(err);
      }
      resolve(data);
    });
  });
}

module.exports = uploadToS3;
