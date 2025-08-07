import express from "express";
import { db } from "../db/index.js";
import { videos } from "../db/models/videos.sql.js";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { comments as commentsTable } from "../db/models/comments.sql.js";
import { S3Service } from "../services/aws/S3Service.js";
import { MediaConvertService } from "../services/aws/MediaConvertService.js";
import { CloudFrontService } from "../services/aws/CloudFrontService.js";
import AppError from "../utils/AppError.js";
import { HttpStatusCode } from "../utils/HttpStatusCode.js";

const router = express.Router();

const s3Service = new S3Service();
const mediaConvertService = new MediaConvertService();
const cloudFrontService = new CloudFrontService();

router.put("/:publicKey", async (req, res) => {
  try {
    const { publicKey } = req.params;
    const { title, desc } = req.body;

    const video = await db
      .select()
      .from(videos)
      .where(eq(videos.publicKey, publicKey));

    if (!video || video.length === 0) {
      res.status(HttpStatusCode.NOT_FOUND).send({ err: "video not found" });
      return;
    }

    if (video[0]!.author !== req.user!.id) {
      res
        .status(HttpStatusCode.FORBIDDEN)
        .send({ err: "You are not authorized to update this video." });
      return;
    }

    await db
      .update(videos)
      .set({ title, desc })
      .where(eq(videos.publicKey, publicKey));

    res.status(HttpStatusCode.OK).send({ msg: "video updated successfully." });
  } catch (err) {
    res.status(HttpStatusCode.SERVER_ERROR).send({ err: "Failed to update video." });
  }
});

router.delete("/:publicKey", async (req, res) => {
  try {
    const { publicKey } = req.params;

    const video = await db
      .select()
      .from(videos)
      .where(eq(videos.publicKey, publicKey));

    if (!video || video.length === 0) {
      res.status(HttpStatusCode.NOT_FOUND).send({ err: "video not found" });
      return;
    }

    if (video[0]!.author !== req.user!.id) {
      res
        .status(HttpStatusCode.FORBIDDEN)
        .send({ err: "You are not authorized to delete this video." });
      return;
    }

    await db.delete(videos).where(eq(videos.publicKey, publicKey));

    res.status(HttpStatusCode.OK).send({ msg: "video deleted successfully." });
  } catch (err) {
    res.status(HttpStatusCode.SERVER_ERROR).send({ err: "Failed to delete video." });
  }
});

router.get("/:publicKey", async (req, res) => {
  try {
    const { publicKey } = req.params;
    const video = await db
      .select()
      .from(videos)
      .where(eq(videos.publicKey, publicKey));

    if (!video || video.length === 0) {
      res.status(HttpStatusCode.NOT_FOUND).send({ err: "video not found" });
      return;
    }

    res.status(HttpStatusCode.OK).send({ video: video[0] });
  } catch (err) {
    res.status(HttpStatusCode.SERVER_ERROR).send({ err: "Failed to fetch video" });
  }
});

router.post("/create", async (req, res) => {
  try {
    const { title, desc, videoId, thumbnailId } = req.body;

    await db.insert(videos).values({
      author: req.user!.id,
      desc,
      publicKey: nanoid(),
      storageKey: videoId,
      thumbnailStorageKey: thumbnailId,
      title,
    });

    res.status(HttpStatusCode.OK).send({ err: "The video has created!" });
  } catch (err) {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send({ err: "Something went wrong while creating the new video!" });
  }
});

router.get("/:publicKey/comments", async (req, res) => {
  try {
    const { publicKey } = req.params;
    const offset = req.query["offset"] as string;
    const limit = req.query["limit"] as string;

    if (!limit) {
      res.status(HttpStatusCode.BAD_REQUEST).send({
        err: "You must set limit query param. It is required!",
      });
      return;
    }

    // First get the video to find its id
    const video = await db
      .select()
      .from(videos)
      .where(eq(videos.publicKey, publicKey));

    if (!video || video.length === 0) {
      res.status(HttpStatusCode.NOT_FOUND).send({ err: "video not found" });
      return;
    }

    const comments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.video, video[0]!.id))
      .limit(parseInt(limit))
      .offset(parseInt(offset || "0"));

    res.status(HttpStatusCode.OK).send({
      msg: "Comments retrieved!",
      comments,
    });
  } catch (err) {
    res.status(HttpStatusCode.BAD_REQUEST).send({
      err: "Error!",
    });
  }
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
      res.status(HttpStatusCode.BAD_REQUEST).send({ err: "Failed to create multipart upload - no UploadId returned" });
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
  } catch (err) {
    res.status(HttpStatusCode.BAD_REQUEST).send({ err: "Unable to create multipart upload!" });
  }
});

router.post("/complete-multipart-upload", async (req, res) => {
  const { uploadId, videoId, contentType, parts } = req.body;

  try {
    const key = `uploads/${req.user!.username}/videos/${videoId}`;
    
    await s3Service.completeMultipartUpload(key, uploadId, parts);

    res
      .status(HttpStatusCode.OK)
      .send({ msg: `Multipart upload with id ${uploadId} has completed!` });
  } catch (err) {
    res.status(HttpStatusCode.BAD_REQUEST).send({
      err: `Error occured while trying to complete multipart upload with id ${uploadId}`,
    });
  }
});

router.post("/start-job", async (req, res) => {
  const { videoId, contentType } = req.body;

  const input = `uploads/${req.user!.username}/videos/${videoId}.${contentType}`;
  const destination = `outputs/${req.user!.username}/${videoId}/output`;
  
  try {
    await mediaConvertService.startTranscodingJob(input, destination);

    res.status(HttpStatusCode.OK).send({
      msg: "The transcoding job has started!",
    });
  } catch (err) {
    res.status(HttpStatusCode.NOT_FOUND).send({
      err: "Error occurred during transcoding your video file!",
    });
  }
});

router.get("/:publicKey/url", async (req, res, next) => {
  try {
    const { publicKey } = req.params;
    const video = await db.select().from(videos).where(eq(videos.publicKey, publicKey));

    if (video.length === 0) {
      res.status(HttpStatusCode.NOT_FOUND).send({
        err: `Video not found with key ${publicKey}`,
      });
      return;
    }

    const { storageKey } = video[0]!;
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
    res.status(HttpStatusCode.BAD_REQUEST).send({
      err: "Something was off while signing the resource url."
    });
  }
})

export default router;
