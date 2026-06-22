import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
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

/**
 * Deletes a single object from Cloudflare R2.
 * @param key File storage key (path inside bucket)
 */
export async function deleteFromR2(key: string): Promise<void> {
  const bucketName = process.env.R2_BUCKET_NAME || 'talesmiths-manga';
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Deletes all objects with a specific prefix from Cloudflare R2.
 * @param prefix Prefix (e.g. 'stories/mahakala/')
 */
export async function deleteFolderFromR2(prefix: string): Promise<void> {
  const bucketName = process.env.R2_BUCKET_NAME || 'talesmiths-manga';
  
  // 1. List all objects with the prefix
  const listCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  });

  const listResponse = await r2Client.send(listCommand);
  
  if (!listResponse.Contents || listResponse.Contents.length === 0) {
    return;
  }

  // 2. Prepare objects list to delete
  const objectsToDelete = listResponse.Contents.map((obj) => ({
    Key: obj.Key!,
  }));

  // 3. Perform batch deletion
  const deleteCommand = new DeleteObjectsCommand({
    Bucket: bucketName,
    Delete: {
      Objects: objectsToDelete,
      Quiet: true,
    },
  });

  await r2Client.send(deleteCommand);
}
