import express from "express";
import { nanoid } from "nanoid";
import { S3Service } from "../services/aws/S3Service.js";
import { CloudFrontService } from "../services/aws/CloudFrontService.js";
import AppError from "../utils/AppError.js";
import { HttpStatusCode } from "../utils/HttpStatusCode.js";
import {
  findVideoByPublicKey,
  updateVideo,
  deleteVideoByPublicKey,
  getCommentsByVideoId,
  createVideoTx,
} from "../db/queries.js";

const router = express.Router();

const s3Service = new S3Service();
const cloudFrontService = new CloudFrontService();

router.put("/:publicKey", async (req, res) => {
  const { publicKey } = req.params;
  const { title, desc } = req.body;

  const video = await findVideoByPublicKey(publicKey);

  if (video.author !== req.user!.id) {
    throw new AppError(
      "You are not authorized to update this video.",
      HttpStatusCode.FORBIDDEN,
      true
    );
  }

  await updateVideo(publicKey, {
    title,
    desc,
    lastUpdatedAt: new Date().toISOString(),
  });

  res.status(HttpStatusCode.OK).send({ msg: "video updated successfully." });
});

router.delete("/:publicKey", async (req, res) => {
  const { publicKey } = req.params;

  const video = await findVideoByPublicKey(publicKey);

  if (video.author !== req.user!.id) {
    res
      .status(HttpStatusCode.FORBIDDEN)
      .send({ err: "You are not authorized to delete this video." });
    return;
  }

  await deleteVideoByPublicKey(publicKey);

  res.status(HttpStatusCode.OK).send({ msg: "video deleted successfully." });
});

router.get("/:publicKey", async (req, res) => {
  const { publicKey } = req.params;
  const video = await findVideoByPublicKey(publicKey);
  res.status(HttpStatusCode.OK).send({ video });
});

router.post("/create", async (req, res) => {
  const {
    title,
    desc,
    videoId,
    thumbnailId,
    playlist,
    category,
    isForKids,
    isAgeRestricted,
    allowComments,
    allowDownloads,
    tags,
  } = req.body;

  await createVideoTx(
    {
      author: req.user!.id,
      desc,
      publicKey: nanoid(),
      storageKey: videoId,
      thumbnailStorageKey: thumbnailId,
      title,
      category,
      isForKids,
      isAgeRestricted,
      allowComments,
      allowDownloads,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    },
    playlist,
    tags.split(",")
  );

  res.status(HttpStatusCode.OK).send({ msg: "The video has been created!" });
});

router.get("/:publicKey/comments", async (req, res) => {
  const { publicKey } = req.params;
  const offset = req.query["offset"] as string;
  const limit = req.query["limit"] as string;

  if (!limit) {
    res.status(HttpStatusCode.BAD_REQUEST).send({
      err: "You must set limit query param. It is required.",
    });
    return;
  }

  const video = await findVideoByPublicKey(publicKey);
  const comments = await getCommentsByVideoId(
    video.id,
    parseInt(limit),
    parseInt(offset || "0")
  );

  res.status(HttpStatusCode.OK).send({
    msg: "Comments retrieved!",
    comments,
  });
});

router.post("/upload-thumbnail", async (req, res) => {
  try {
    const { contentType } = req.body;

    const thumbnailId = nanoid();
    const key = `uploads/${req.user!.username}/thumbnails/${thumbnailId}`;

    const command = s3Service.createSimpleUpload(key, contentType);
    const url = await s3Service.getSignedUrl(command);

    res.status(HttpStatusCode.OK).send({
      msg: "Success!",
      url,
      thumbnailId,
    });
  } catch (err) {
    res.status(HttpStatusCode.BAD_REQUEST).send({
      msg: "Error!",
    });
  }
});

router.post("/simple-upload", async (req, res) => {
  try {
    const { contentType } = req.body;

    const videoId = nanoid();
    const key = `uploads/${req.user!.username}/videos/${videoId}`;

    const command = await s3Service.createSimpleUpload(key, contentType);
    const url = await s3Service.getSignedUrl(command);

    res.status(HttpStatusCode.OK).send({
      msg: "Success!",
      url,
      videoId,
    });
  } catch (err) {
    res.status(HttpStatusCode.NOT_FOUND).send({
      err: "Error!",
    });
  }
});

router.post("/start-multipart-upload", async (req, res) => {
  try {
    const { contentType, fileSize } = req.body;

    const videoId = nanoid();
    const key = `uploads/${req.user!.username}/videos/${videoId}`;

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
        const partCommand = s3Service.createPartUpload(
          key,
          UploadId,
          partNumber
        );
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
  } catch (err) {
    console.log(err);
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send({ err: "Unable to create multipart upload!" });
  }
});

router.post("/complete-multipart-upload", async (req, res) => {
  const { uploadId, videoId, contentType, parts } = req.body;

  try {
    const key = `uploads/${req.user!.username}/videos/${videoId}`;

    const command = s3Service.completeMultipartUpload(key, uploadId, parts);

    await s3Service.client.send(command);

    res
      .status(HttpStatusCode.OK)
      .send({ msg: `Multipart upload with id ${uploadId} has completed!` });
  } catch (err) {
    res.status(HttpStatusCode.BAD_REQUEST).send({
      err: `Error occured while trying to complete multipart upload with id ${uploadId}`,
    });
  }
});

router.post("/abort-multipart-upload", async (req, res) => {
  try {
    const { uploadId, videoId } = req.body;

    if (!uploadId || !videoId) {
      res.status(HttpStatusCode.BAD_REQUEST).send({
        err: "uploadId and videoId are required",
      });
      return;
    }

    const key = `uploads/${req.user!.username}/videos/${videoId}`;
    const command = s3Service.abortMultipartUpload(key, uploadId);

    const response = await s3Service.client.send(command);

    res.status(HttpStatusCode.OK).send({
      msg: `Multipart upload with id ${uploadId} has been cancelled successfully!`,
      data: response,
    });
  } catch (err) {
    console.log(err);
    res.status(HttpStatusCode.BAD_REQUEST).send({
      err: `Error occurred while trying to cancel multipart upload`,
    });
  }
});

router.get("/:publicKey/url", async (req, res, next) => {
  try {
    const { publicKey } = req.params;
    const video = await findVideoByPublicKey(publicKey);

    const { storageKey } = video;
    const expirationDate = Date.now() + 3600; // Video will be available for the next hour

    const url = await cloudFrontService.generateSignedUrl(
      req.user!.username,
      storageKey,
      expirationDate
    );

    res.status(HttpStatusCode.CREATED).send({
      url,
      msg: "Signed URL has successfully generated!",
    });
  } catch (err) {
    if (err instanceof AppError && err.isOperational) {
      res.status(err.statusCode).send({ err: err.message });
      return;
    }
    res.status(HttpStatusCode.BAD_REQUEST).send({
      err: "Something was off while signing the resource url.",
    });
  }
});

export default router;
