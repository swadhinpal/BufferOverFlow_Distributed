const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: 'minio',
  port: 9000,
  useSSL: false,
  accessKey: 'minio',
  secretKey: 'minio123',
});

/*const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_HOST, // Hostname from the .env file (Docker service name)
  port: parseInt(process.env.MINIO_PORT, 10), // Port number for MinIO
  useSSL: process.env.MINIO_USE_SSL === 'true', // Convert string to boolean
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});*/

const bucketName = 'codestore';

// Create bucket if it doesn't exist
minioClient.bucketExists(bucketName, (err, exists) => {
  if (err) return console.error('Error checking MinIO bucket:', err);

  if (!exists) {
    minioClient.makeBucket(bucketName, 'us-east-1', (err) => {
      if (err) console.error('Error creating bucket:', err);
      else console.log(`Bucket "${bucketName}" created successfully`);
    });
  } else {
    console.log(`Bucket "${bucketName}" already exists`);
  }
});

module.exports = { minioClient, bucketName };