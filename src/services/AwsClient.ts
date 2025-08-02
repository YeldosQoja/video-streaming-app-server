import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import * as Stream from "node:stream";

export const s3Client = new S3Client();

export const bucketName = process.env["AWS_S3_BUCKET_NAME"];

export const cdnBaseUrl = process.env["S3_CDN"];
export const trustedKeyGroupId = process.env["CDN_KEY_GROUP_ID"];

export async function putObject(key: string, body: string) {
  try {
    const res = await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
      })
    );
    return res;
  } catch (err) {
    console.log("Error while uploading an object into S3", err);
    return null;
  }
}

export async function getObject(key: string) {
  try {
    const { Body } = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    return Body;
  } catch (err) {
    console.log("Error while getting an object from s3", err);
    return null;
  }
}

export async function multipartUpload(fileStream: Stream.Readable, key: string) {  
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: key, // e.g., 'uploads/video.mp4'
        Body: fileStream,
      },
      queueSize: 4, // concurrency of part uploads
      partSize: 5 * 1024 * 1024, // 5MB minimum part size
      leavePartsOnError: false,
    });
  
    upload.on("httpUploadProgress", (progress) => {
      console.log(`Uploaded ${progress.loaded} / ${progress.total}`);
    });
  
    const output = await upload.done();
    console.log("Upload complete!");
  }
