import express from "express";
import { nanoid } from "nanoid";
import { CloudFrontService } from "../services/aws/CloudFrontService.js";
import AppError from "../utils/AppError.js";
import { HttpStatusCode } from "../utils/HttpStatusCode.js";
import {
  findVideoByPublicKey,
  updateVideo,
  deleteVideo,
  getCommentsByVideoId,
  createVideoTx,
  getUploadedVideos,
} from "../db/queries.js";

const router = express.Router();

const cloudFrontService = new CloudFrontService();

router.get("", async (req, res) => {
  const videos = await getUploadedVideos();
  res.status(HttpStatusCode.OK).send({ videos });
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

  await deleteVideo(publicKey);

  res.status(HttpStatusCode.OK).send({ msg: "video deleted successfully." });
});

router.get("/:publicKey", async (req, res) => {
  const { publicKey } = req.params;

  const user = req.user as Express.User;

  const video = await findVideoByPublicKey(publicKey);
  const { storageKey, thumbnailStorageKey, tags, ...rest } = video;

  const videoUrlPromise = cloudFrontService.generateSignedUrl(
    user.username,
    storageKey,
    Date.now() + 3600
  );
  const thumbnailUrlPromise = cloudFrontService.generateSignedUrl(
    user.username,
    thumbnailStorageKey,
    Date.now() + 3600
  );

  const [videoUrl, thumbnailUrl] = await Promise.all([
    videoUrlPromise,
    thumbnailUrlPromise,
  ]);

  // flattening tag objects
  const data: Omit<
    typeof video,
    "tags" | "storageKey" | "thumbnailStorageKey"
  > & {
    tags: { id: number; name: string }[];
    videoUrl: string;
    thumbnailUrl: string;
  } = {
    ...rest,
    videoUrl,
    thumbnailUrl,
    tags: tags.map(({ tag }) => tag),
  };

  res.status(HttpStatusCode.OK).send({ data });
});

export default router;
