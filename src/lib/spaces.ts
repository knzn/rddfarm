import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: process.env.DO_SPACES_REGION ?? "sgp1",
  endpoint: process.env.DO_SPACES_ENDPOINT,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
  forcePathStyle: false,
});

const BUCKET = process.env.DO_SPACES_BUCKET!;
const CDN_URL = process.env.DO_SPACES_CDN_URL!;

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<{ presignedUrl: string; finalCdnUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ACL: "public-read",
  });

  const presignedUrl = await getSignedUrl(client, command, { expiresIn });
  const finalCdnUrl = `${CDN_URL}/${key}`;

  return { presignedUrl, finalCdnUrl };
}

export async function deleteObject(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export function cdnUrlToKey(cdnUrl: string): string {
  return cdnUrl.replace(`${CDN_URL}/`, "");
}
