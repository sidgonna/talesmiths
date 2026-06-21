import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Client = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Generates a presigned PUT URL for Cloudflare R2 direct client-side uploads.
 * @param key File storage key (path inside bucket)
 * @param contentType File MIME type (e.g. 'image/webp')
 */
export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const bucketName = process.env.R2_BUCKET_NAME || 'talesmiths-manga';
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  // URL valid for 15 minutes (900 seconds)
  const url = await getSignedUrl(r2Client, command, { expiresIn: 900 });
  return url;
}
