import express from "express";
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { bucketName, s3Client } from "../services/AwsClient.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "../db/index.js";
import { videos } from "../db/models/videos.sql.js";
import { nanoid } from "nanoid";
import {
  MediaConvertClient,
  CreateJobCommand,
} from "@aws-sdk/client-mediaconvert";
import mediaConvertJobDesc from "../aws-mediaconvert-job-desc.json" with { type: "json" };
import { eq } from "drizzle-orm";
import { comments as commentsTable } from "../db/models/comments.sql.js";

const router = express.Router();

const mediaConvertClient = new MediaConvertClient();

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, desc } = req.body;

    if (!req.user) {
      res
        .status(401)
        .send({ err: "Unauthenticated users cannot update videos." });
      return;
    }

    const video = await db
      .select()
      .from(videos)
      .where(eq(videos.id, parseInt(id)));

    if (!video || video.length === 0) {
      res.status(404).send({ err: "video not found" });
      return;
    }

    if (video[0]!.author !== req.user.id) {
      res
        .status(403)
        .send({ err: "You are not authorized to update this video." });
      return;
    }

    await db
      .update(videos)
      .set({ title, desc })
      .where(eq(videos.id, parseInt(id)));

    res.status(200).send({ msg: "video updated successfully." });
  } catch (err) {
    res.status(500).send({ err: "Failed to update video." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res
        .status(401)
        .send({ err: "Unauthenticated users cannot delete videos." });
      return;
    }

    const video = await db
      .select()
      .from(videos)
      .where(eq(videos.id, parseInt(id)));

    if (!video || video.length === 0) {
      res.status(404).send({ err: "video not found" });
      return;
    }

    if (video[0]!.author !== req.user.id) {
      res
        .status(403)
        .send({ err: "You are not authorized to delete this video." });
      return;
    }

    await db.delete(videos).where(eq(videos.id, parseInt(id)));

    res.status(200).send({ msg: "video deleted successfully." });
  } catch (err) {
    res.status(500).send({ err: "Failed to delete video." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const video = await db
      .select()
      .from(videos)
      .where(eq(videos.id, parseInt(id)));

    if (!video || video.length === 0) {
      res.status(404).send({ err: "video not found" });
      return;
    }

    res.status(200).send({ video: video[0] });
  } catch (err) {
    res.status(500).send({ err: "Failed to fetch video" });
  }
});

router.post("/create", async (req, res) => {
  try {
    const { title, desc, key, thumbnailKey } = req.body;

    if (!req.user) {
      res.status(401).send({
        err: "Unauthenticated users can not create a new video! In order to upload a video, sign in to your account or create a new one.",
      });
      return;
    }

    await db.insert(videos).values({
      author: req.user.id,
      desc,
      publicKey: nanoid(),
      storageKey: key,
      thumbnailStorageKey: thumbnailKey,
      title,
    });

    res.status(200).send({ err: "The video has created!" });
  } catch (err) {
    res
      .status(400)
      .send({ err: "Something went wrong while creating the new video!" });
  }
});

router.get("/:id/comments", async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).send({
        err: "Unauthenticated!\nYou cannot execute this operation.",
      });
      return;
    }

    const { id } = req.params;
    const offset = req.query["offset"] as string;
    const limit = req.query["limit"] as string;

    if (!limit) {
      res.status(400).send({
        err: "You must set limit query param. It is required!",
      });
      return;
    }

    const comments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.video, parseInt(id)))
      .limit(parseInt(limit))
      .offset(parseInt(offset || "0"));

    res.status(200).send({
      msg: "Comments retrieved!",
      comments,
    });
  } catch (err) {
    res.status(400).send({
      err: "Error!",
    });
  }
});

router.post("/upload-thumbnail", async (req, res) => {
  try {
    const { contentType } = req.body;

    if (!req.user) {
      res
        .status(401)
        .send({ err: "Unauthenticated!\nYou cannot execute this operation." });
      return;
    }

    const thumbnailId = nanoid();
    const key = `uploads/${req.user.username}/thumbnails/${thumbnailId}.${contentType}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command);

    res.status(200).send({
      msg: "Success!",
      url,
      key,
      thumbnailId,
    });
  } catch (err) {
    res.status(400).send({
      msg: "Error!",
    });
  }
});

router.post("/simple-upload", async (req, res) => {
  try {
    const { contentType } = req.body;

    if (!req.user) {
      res
        .status(401)
        .send({ err: "Unauthenticated!\nYou cannot execute this operation." });
      return;
    }

    const videoId = nanoid();
    const key = `uploads/${req.user.username}/videos/${videoId}.${contentType}`;

    const command = new PutObjectCommand({
      Key: key,
      Bucket: bucketName,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    res.status(200).send({
      msg: "Success!",
      url,
      videoId,
      key,
    });
  } catch (err) {
    res.status(404).send({
      err: "Error!",
    });
  }
});

router.post("/start-multipart-upload", async (req, res) => {
  try {
    const { contentType, fileSize } = req.body;

    if (!req.user) {
      res
        .status(401)
        .send({ err: "Unauthenticated!\nYou cannot execute this operation." });
      return;
    }

    const videoId = nanoid();
    const key = `uploads/${req.user.username}/videos/${videoId}.${contentType}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const partCount = Math.ceil(fileSize / 20_000_000);
    const { UploadId } = await s3Client.send(command);

    const urls = await Promise.all(
      Array.from({ length: partCount }, async (_, i) => {
        const partNumber = i + 1;
        const command = new UploadPartCommand({
          Bucket: bucketName,
          Key: key,
          UploadId,
          PartNumber: partNumber,
        });

        const url = await getSignedUrl(s3Client, command, {
          expiresIn: 3600,
        });

        return { partNumber, url };
      })
    );

    res.status(200).send({
      msg: "Multipart upload has successfully created!",
      key,
      videoId,
      uploadId: UploadId,
      urls,
    });
  } catch (err) {
    res.status(400).send({ err: "Unable to create multipart upload!" });
  }
});

router.post("/complete-multipart-upload", async (req, res) => {
  const { uploadId, key, parts } = req.body;

  try {
    const command = new CompleteMultipartUploadCommand({
      UploadId: uploadId,
      Bucket: bucketName,
      Key: key,
      MultipartUpload: {
        Parts: parts, // The parts list each element of which contains ETag and part number of each part uploaded
      },
    });

    await s3Client.send(command);

    res
      .status(200)
      .send({ msg: `Multipart upload with id ${uploadId} has completed!` });
  } catch (err) {
    res.status(400).send({
      err: `Error occured while trying to complete multipart upload with id ${uploadId}`,
    });
  }
});

router.post("/start-job", async (req, res) => {
  const { key, ContentType } = req.body;

  if (!req.user) {
    res.status(401).send({
      err: "Unauthenticated!\nYou cannot execute this operation.",
    });
    return;
  }

  const job = Object.create(mediaConvertJobDesc);
  job.Settings.Inputs[0].FileInput = `s3://${bucketName}/uploads/${req.user.username}/videos/${key}.${ContentType}`;
  job.Settings.OutputGroups[0].OutputGroupSettings.HlsGroupSettings.Destination = `s3://${bucketName}/outputs/${req.user.username}/${key}/output`;

  try {
    const command = new CreateJobCommand(job);

    await mediaConvertClient.send(command);

    res.status(200).send({
      msg: "The transcoding job has started!",
    });
  } catch (err) {
    res.status(404).send({
      err: "Error occurred during transcoding your video file!",
    });
  }
});

export default router;
