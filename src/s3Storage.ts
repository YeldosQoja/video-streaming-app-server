import { Request } from "express";
import { StorageEngine } from "multer";
import { multipartUpload } from "./services/AwsClient.js";

class S3Storage implements StorageEngine {
  async _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void
  ) {
    try {
      await multipartUpload(file.stream, file.originalname);
      cb(null);
    } catch (err) {
      cb("Error: Multipart upload to s3 has failed! More: \n" + err);
    }
  }

  _removeFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null) => void
  ) {

  }
}

export const s3Storage = new S3Storage();
