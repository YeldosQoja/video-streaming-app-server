import express from "express";
import { nanoid } from "nanoid";
import { S3Service } from "../services/aws/S3Service.js";
import { HttpStatusCode } from "../utils/HttpStatusCode.js";

const router = express.Router();
const s3Service = new S3Service();

router.post("/", async (req, res) => {
  const { contentType } = req.body;

  const videoId = nanoid();
  const key = `uploads/${req.user!.username}/videos/${videoId}`;

  const command = s3Service.createSimpleUpload(key, contentType);
  const url = await s3Service.getSignedUrl(command);

  res.status(HttpStatusCode.OK).send({
    msg: "Success!",
    url,
    videoId,
  });
});

router.post("/thumbnail", async (req, res) => {
  const { user } = req;
  const { contentType } = req.body;

  const thumbnailId = nanoid();
  const key = `uploads/${user!.username}/thumbnails/${thumbnailId}`;

  const command = s3Service.createSimpleUpload(key, contentType);
  const url = await s3Service.getSignedUrl(command);

  res.status(HttpStatusCode.OK).send({
    msg: "Success!",
    url,
    thumbnailId,
  });
});

router.post("/multipart/start", async (req, res) => {
  const { user } = req;
  const { contentType, fileSize } = req.body;

  const videoId = nanoid();
  const key = `uploads/${user!.username}/videos/${videoId}`;

  const partCount = Math.ceil(fileSize / 20_000_000);
  const command = s3Service.createMultipartUpload(key, contentType);

  const { UploadId } = await s3Service.sendCommand(command);

  if (!UploadId) {
    res.status(HttpStatusCode.BAD_REQUEST).send({
      err: "Failed to create multipart upload - no UploadId returned",
    });
    return;
  }

  const urls = await Promise.all(
    Array.from({ length: partCount }, async (_, i) => {
      const partNumber = i + 1;
      const partCommand = s3Service.createPartUpload(key, UploadId, partNumber);
      const url = await s3Service.getSignedUrl(partCommand);

      return { partNumber, url };
    })
  );

  res.status(HttpStatusCode.OK).send({
    msg: "Multipart upload has successfully created!",
    videoId,
    uploadId: UploadId,
    urls,
  });
});

router.post("/multipart/complete", async (req, res) => {
  const { user } = req;
  const { uploadId, videoId, contentType, parts } = req.body;

  const key = `uploads/${user!.username}/videos/${videoId}`;

  const command = s3Service.completeMultipartUpload(key, uploadId, parts);

  await s3Service.client.send(command);

  res
    .status(HttpStatusCode.OK)
    .send({ msg: `Multipart upload with id ${uploadId} has completed!` });
});

router.post("/multipart/abort", async (req, res) => {
  const { user } = req;
  const { uploadId, videoId } = req.body;

  if (!uploadId || !videoId) {
    res.status(HttpStatusCode.BAD_REQUEST).send({
      err: "uploadId and videoId are required",
    });
    return;
  }

  const key = `uploads/${user!.username}/videos/${videoId}`;
  const command = s3Service.abortMultipartUpload(key, uploadId);

  const response = await s3Service.client.send(command);

  res.status(HttpStatusCode.OK).send({
    msg: `Multipart upload with id ${uploadId} has been cancelled successfully!`,
    data: response,
  });
});

export default router;
