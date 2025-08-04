import express from "express";
import { db } from "../db/index.js";
import { comments as commentsTable } from "../db/models/comments.sql.js";
import { videos } from "../db/models/videos.sql.js";
import { eq } from "drizzle-orm";
import { HttpStatusCode } from "../utils/HttpStatusCode.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { videoPublicKey, text, parentId } = req.body;

    // First get the video to find its id
    const video = await db
      .select()
      .from(videos)
      .where(eq(videos.publicKey, videoPublicKey));

    if (!video || video.length === 0) {
      res.status(HttpStatusCode.NOT_FOUND).send({ err: "video not found" });
      return;
    }

    await db.insert(commentsTable).values({
      author: req.user!.id,
      video: video[0]!.id,
      content: text,
      parentComment: parentId,
    });

    res.status(HttpStatusCode.CREATED).send({
      msg: "Comment has been added to the video.",
    });
  } catch (err) {
    res.status(HttpStatusCode.BAD_REQUEST).send({
      err: "Error!",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {

    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      res.status(HttpStatusCode.BAD_REQUEST).send({
        err: "New comment text is not valid!",
      });
      return;
    }

    await db
      .update(commentsTable)
      .set({ content: text })
      .where(eq(commentsTable.id, parseInt(id)));

    res.status(HttpStatusCode.OK).send({
      msg: "Comment has been updated",
    });
  } catch (err) {
    res.status(HttpStatusCode.BAD_REQUEST).send({
      err: "Error!",
    });
  }
});

export default router;
