import express from "express";
import { HttpStatusCode } from "../utils/HttpStatusCode.js";
import {
  findVideoByPublicKey,
  createComment,
  updateComment,
} from "../db/queries.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { videoPublicKey, text, parentId } = req.body;

  const video = await findVideoByPublicKey(videoPublicKey);

  await createComment({
    author: req.user!.id,
    video: video.id,
    content: text,
    parentComment: parentId,
  });

  res.status(HttpStatusCode.CREATED).send({
    msg: "Comment has been added to the video.",
  });
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text) {
    res.status(HttpStatusCode.BAD_REQUEST).send({
      err: "New comment text is not valid!",
    });
    return;
  }

  await updateComment(parseInt(id), text);

  res.status(HttpStatusCode.OK).send({
    msg: "Comment has been updated",
  });
});

export default router;
