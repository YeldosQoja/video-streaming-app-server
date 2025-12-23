import {
  AbortMultipartUploadCommand,
  CompletedPart,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
  S3ClientResolvedConfig,
  S3ServiceException,
  ServiceInputTypes,
  ServiceOutputTypes,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getAwsConfig } from "../../config/aws.js";
import { AwsService } from "./AWSService.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Command, RequestPresigningArguments } from "@aws-sdk/types";
import AppError from "../../utils/AppError.js";
import { HttpStatusCode } from "../../utils/HttpStatusCode.js";

export class S3Service extends AwsService<
  S3Client,
  ServiceInputTypes,
  ServiceOutputTypes
> {
  override client: S3Client;
  bucketName: string;

  constructor(config?: S3ClientConfig) {
    super();
    this.client = new S3Client(config ?? {});
    const awsConfig = getAwsConfig();
    this.bucketName = awsConfig.s3.bucketName;
  }

  createSimpleUpload(key: string, contentType: string) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      return command;
    } catch (err) {
      throw new AppError(
        `AWS Error: Create PubObjectCommand failed. ${
          (err as S3ServiceException).message
        }`,
        HttpStatusCode.SERVER_ERROR,
        false
      );
    }
  }

  createMultipartUpload(key: string, contentType: string) {
    try {
      const command = new CreateMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      return command;
    } catch (err) {
      throw new AppError(
        `AWS Error: Create CreateMultipartUploadCommand failed. ${
          (err as S3ServiceException).message
        }`,
        HttpStatusCode.SERVER_ERROR,
        false
      );
    }
  }

  createPartUpload(key: string, uploadId: string, partNumber: number) {
    try {
      const command = new UploadPartCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });

      return command;
    } catch (err) {
      throw new AppError(
        `AWS Error: Create UploadPartCommand failed. ${
          (err as S3ServiceException).message
        }`,
        HttpStatusCode.SERVER_ERROR,
        false
      );
    }
  }

  completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: CompletedPart[]
  ) {
    try {
      const command = new CompleteMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      });

      return command;
    } catch (err) {
      throw new AppError(
        `AWS Error: Create CompleteMultipartUploadCommand failed. ${
          (err as S3ServiceException).message
        }`,
        HttpStatusCode.SERVER_ERROR,
        false
      );
    }
  }

  abortMultipartUpload(key: string, uploadId: string) {
    try {
      const command = new AbortMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
      });

      return command;
    } catch (err) {
      throw new AppError(
        `AWS Error: Create CompleteMultipartUploadCommand failed. ${
          (err as S3ServiceException).message
        }`,
        HttpStatusCode.SERVER_ERROR,
        false
      );
    }
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
    try {
      // @ts-ignore
      return await getSignedUrl(this.client, command, options);
    } catch (err) {
      throw new AppError(
        `AWS Error: generating signed url for s3 service commands failed. ${
          (err as S3ServiceException).message
        }`,
        HttpStatusCode.SERVER_ERROR,
        false
      );
    }
  }
}
