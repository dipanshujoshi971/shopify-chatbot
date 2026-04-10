import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../env.js';

/**
 * Cloudflare R2 client singleton.
 * R2 is S3-compatible — we use the standard AWS SDK with R2's endpoint.
 */
export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload a file to R2.
 * Key format for knowledge files: {shopDomain}/{knowledgeSourceId}/{fileName}
 */
export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
}

/** Delete a file from R2. */
export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    }),
  );
}

/** Generate a temporary pre-signed download URL (default 1 hour). */
export async function getR2SignedUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    }),
    { expiresIn },
  );
}
