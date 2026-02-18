import * as Minio from "minio";
import diskConfig from "#config/disk.js";
import logger from "#logger";

const endpoint = (diskConfig.s3Endpoint ?? "").replace(/^https?:\/\//, "");

logger.info({ endpoint, bucket: diskConfig.s3Bucket, region: diskConfig.s3Region }, "S3 config (minio)");

const minioClient = new Minio.Client({
  endPoint: endpoint,
  useSSL: diskConfig.s3Endpoint?.startsWith("http://") !== true,
  accessKey: diskConfig.s3AccessKeyId ?? "",
  secretKey: diskConfig.s3SecretAccessKey ?? "",
  region: diskConfig.s3Region ?? "us-east-1",
});

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const bucket = diskConfig.s3Bucket ?? "";
  logger.info({ bucket, key, contentType, size: body.length }, "Uploading to S3");

  await minioClient.putObject(bucket, key, body, body.length, {
    "Content-Type": contentType,
  });
}
