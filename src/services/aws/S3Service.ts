import {
  AbortMultipartUploadCommand,
  CompletedPart,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
  S3ClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { awsConfig } from "../../config/aws.js";
import { AwsService } from "./AWSService.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Command, RequestPresigningArguments } from "@aws-sdk/types";

export class S3Service extends AwsService<
  S3Client,
  ServiceInputTypes,
  ServiceOutputTypes
> {
  override client: S3Client;
  bucketName = awsConfig.s3.bucketName;

  constructor(config?: S3ClientConfig) {
    super();
    this.client = new S3Client(config ?? {});
  }

  createSimpleUpload(key: string, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return command;
  }

  createMultipartUpload(key: string, contentType: string) {
    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return command;
  }

  createPartUpload(key: string, uploadId: string, partNumber: number) {
    const command = new UploadPartCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    return command;
  }

  completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: CompletedPart[]
  ) {
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });

    return command;
  }

  abortMultipartUpload(key: string, uploadId: string) {
    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
    });

    return command;
  }

  async getSignedUrl<
    InputType extends ServiceInputTypes,
    OutputType extends ServiceOutputTypes
  >(
    command: Command<
      ServiceInputTypes,
      InputType,
      ServiceOutputTypes,
      OutputType,
      S3ClientResolvedConfig
    >,
    options?: RequestPresigningArguments
  ) {
    // @ts-ignore
    return await getSignedUrl(this.client, command, options);
  }
}
