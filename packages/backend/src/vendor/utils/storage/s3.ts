import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import diskConfig from "#config/disk.js";

const s3Client = new S3Client({
  region: diskConfig.s3Region ?? "us-east-1",
  endpoint: diskConfig.s3Endpoint,
  credentials: {
    accessKeyId: diskConfig.s3AccessKeyId ?? "",
    secretAccessKey: diskConfig.s3SecretAccessKey ?? "",
  },
  forcePathStyle: true,
});

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<PutObjectCommand> {
  return  await s3Client.send(
    new PutObjectCommand({
      Bucket: diskConfig.s3Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}
