import express from "express";
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { bucketName, s3Client, cdnBaseUrl, trustedKeyGroupId } from "../services/AwsClient.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSignedUrl as createSignedUrl } from "@aws-sdk/cloudfront-signer";
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
import fs from "node:fs/promises";

const router = express.Router();

const mediaConvertClient = new MediaConvertClient();

router.put("/:publicKey", async (req, res) => {
  try {
    const { publicKey } = req.params;
    const { title, desc } = req.body;

    const video = await db
      .select()
      .from(videos)
      .where(eq(videos.publicKey, publicKey));

    if (!video || video.length === 0) {
      res.status(404).send({ err: "video not found" });
      return;
    }

    if (video[0]!.author !== req.user!.id) {
      res
        .status(403)
        .send({ err: "You are not authorized to update this video." });
      return;
    }

    await db
      .update(videos)
      .set({ title, desc })
      .where(eq(videos.publicKey, publicKey));

    res.status(200).send({ msg: "video updated successfully." });
  } catch (err) {
    res.status(500).send({ err: "Failed to update video." });
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
      res.status(404).send({ err: "video not found" });
      return;
    }

    if (video[0]!.author !== req.user!.id) {
      res
        .status(403)
        .send({ err: "You are not authorized to delete this video." });
      return;
    }

    await db.delete(videos).where(eq(videos.publicKey, publicKey));

    res.status(200).send({ msg: "video deleted successfully." });
  } catch (err) {
    res.status(500).send({ err: "Failed to delete video." });
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
    const { title, desc, videoId, thumbnailId } = req.body;

    await db.insert(videos).values({
      author: req.user!.id,
      desc,
      publicKey: nanoid(),
      storageKey: videoId,
      thumbnailStorageKey: thumbnailId,
      title,
    });

    res.status(200).send({ err: "The video has created!" });
  } catch (err) {
    res
      .status(400)
      .send({ err: "Something went wrong while creating the new video!" });
  }
});

router.get("/:publicKey/comments", async (req, res) => {
  try {
    const { publicKey } = req.params;
    const offset = req.query["offset"] as string;
    const limit = req.query["limit"] as string;

    if (!limit) {
      res.status(400).send({
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
      res.status(404).send({ err: "video not found" });
      return;
    }

    const comments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.video, video[0]!.id))
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

    const thumbnailId = nanoid();
    const key = `uploads/${req.user!.username}/thumbnails/${thumbnailId}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command);

    res.status(200).send({
      msg: "Success!",
      url,
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

    const videoId = nanoid();
    const key = `uploads/${req.user!.username}/videos/${videoId}`;

    const command = new PutObjectCommand({
      Key: key,
      Bucket: bucketName,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    res.status(200).send({
      msg: "Success!",
      url,
      videoId,
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

    const videoId = nanoid();
    const key = `uploads/${req.user!.username}/videos/${videoId}`;

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
      videoId,
      uploadId: UploadId,
      urls,
    });
  } catch (err) {
    res.status(400).send({ err: "Unable to create multipart upload!" });
  }
});

router.post("/complete-multipart-upload", async (req, res) => {
  const { uploadId, videoId, contentType, parts } = req.body;

  try {
    const key = `uploads/${req.user!.username}/videos/${videoId}`;
    
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
  const { videoId, contentType } = req.body

  const key = `uploads/${req.user!.username}/videos/${videoId}.${contentType}`;
  const job = Object.create(mediaConvertJobDesc);
  
  job.Settings.Inputs[0].FileInput = `s3://${bucketName}/${key}`;
  job.Settings.OutputGroups[0].OutputGroupSettings.HlsGroupSettings.Destination = `s3://${bucketName}/outputs/${req.user!.username}/${videoId}/output`;

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

router.get("/:publicKey/url", async (req, res, next) => {
  try {
    const { publicKey } = req.params;
    const video = await db.select().from(videos).where(eq(videos.publicKey, publicKey));

    if (video.length === 0) {
      res.status(404).send({
        err: `Video not found with key ${publicKey}`,
      });
      return;
    }

    const privateKey = await fs.readFile('@/../private_key.pem');

    const { storageKey } = video[0]!;

    const url = createSignedUrl({
      url: `${cdnBaseUrl}/outputs/${req.user!.username}/${storageKey}/output.m3u8`,
      keyPairId: trustedKeyGroupId as string,
      privateKey,
      dateLessThan: Date.now() + 3600, // Video will be available for the next hour
    });

    res.status(201).send({
      url,
      msg: "Signed URL has successfully generated!",
    });
  } catch (err) {
    res.status(400).send({
      err: "Something was off while signing the resource url."
    });
  }
})

export default router;
