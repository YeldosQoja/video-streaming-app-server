import * as express from "express";
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { bucketName, s3Client } from "../services/AwsClient";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "../db";
import { posts } from "../db/models/posts.sql";
import { nanoid } from "nanoid";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { title, desc, key, thumbnailKey } = req.body;

    if (!req.user) {
      res.status(401).send({
        err: "Unauthenticated users can not create a new post! In order to upload a video, sign in to your account or create a new one.",
      });
      return;
    }

    await db.insert(posts).values({
      author: req.user.id,
      desc,
      key,
      thumbnailKey,
      title,
    });

    res.status(200).send({ err: "The post has created!" });
  } catch (err) {
    res
      .status(400)
      .send({ err: "Something went wrong while creating the new post!" });
  }
});

router.post("/upload/thumbnail", async (req, res) => {
  const { contentType } = req.body;

  const thumbnailId = nanoid();
  const key = `thumbnails/${thumbnailId}.${contentType}`;

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
  });
});

router.post("/start-upload", async (req, res) => {
  try {
    const { contentType } = req.body;

    if (!req.user) {
      res
        .status(401)
        .send({ err: "Unauthenticated!\nYou cannot execute this operation." });
      return;
    }

    const videoId = nanoid();
    const key = `videos/${videoId}.${contentType}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const { UploadId } = await s3Client.send(command);

    res.status(200).send({
      msg: "Multipart upload has successfully created!",
      uploadId: UploadId,
      key,
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
    res.status(400).send({
      err: `Error occured while trying to complete multipart upload with id ${uploadId}`,
    });
  }
});

export default router;
