import { CompletedPart, CompleteMultipartUploadCommand, CreateMultipartUploadCommand, PutObjectCommand, S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { awsConfig } from "../../config/aws.js";

export class S3Service {
  public client: S3Client;
  private bucketName: string;

  constructor() {
    this.client = new S3Client();
    this.bucketName = awsConfig.s3.bucketName;
  }

  getBucketName(): string {
    return this.bucketName;
  }

  async createSimpleUpload(key: string, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return command;
  }

  async createMultipartUpload(key: string, contentType: string) {
    const command = new CreateMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
    });

    return command;
  }

  async createAndExecuteMultipartUpload(key: string, contentType: string) {
    const command = new CreateMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
    });

    const result = await this.client.send(command);
    return result;
  }

  async createPartUpload(key: string, uploadId: string, partNumber: number) {
    const command = new UploadPartCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
    });

    return command;
  }

  async completeMultipartUpload(key: string, uploadId: string, parts: CompletedPart[]) {
    const command = new CompleteMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
            Parts: parts,
        }
    });

    await this.client.send(command);

    return command;
  }
}
