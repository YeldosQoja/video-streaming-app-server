import * as express from "express";
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { bucketName, s3Client } from "../services/AwsClient";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const router = express.Router();

router.post("/create", (req, res) => {
    const { title, desc } = req.body;
});

router.post("/start-upload", async (req, res) => {
  try {
    const { fileName, contentType } = req.body;

    const command = new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: fileName,
      ContentType: contentType,
    });

    const { UploadId, Key } = await s3Client.send(command);

    res.status(200).send({
      msg: "Multipart upload has successfully created!",
      uploadId: UploadId,
      key: Key,
    });
  } catch (err) {
    res.status(400).send({ err: "Unable to create multipart upload!" });
  }
});

router.post("/get-upload-urls", async (req, res) => {
  try {
    const { key, uploadId, parts } = req.body;

    const urls = await Promise.all(
      Array.from({ length: parts }, async (_, i) => {
        const partNumber = i + 1;
        const command = new UploadPartCommand({
          Bucket: bucketName,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        });

        const url = await getSignedUrl(s3Client, command, {
          expiresIn: 3600,
        });

        return { partNumber, url };
      })
    );

    res.status(200).send({ urls });
  } catch (err) {
    res
      .status(400)
      .send({ err: "Unable to upload part or create presigned urls" });
  }
});

router.post("/complete-upload", async (req, res) => {
  const { uploadId, key } = req.body;

  try {
    const command = new CompleteMultipartUploadCommand({
      UploadId: uploadId,
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);

    res
      .status(200)
      .send({ msg: `Multipart upload with id ${uploadId} has completed!` });
  } catch (err) {
    res
      .status(400)
      .send({
        err: `Error occured while trying to complete multipart upload with id ${uploadId}`,
      });
  }
});
