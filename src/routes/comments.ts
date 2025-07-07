import express from "express";
import { db } from "../db/index.js";
import { comments as commentsTable } from "../db/models/comments.sql.js";
import { eq } from "drizzle-orm";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { videoId, text, parentId } = req.body;

    if (!req.user) {
      res.status(401).send({
        err: "Unauthenticated!\nYou cannot execute this operation.",
      });
      return;
    }

    await db.insert(commentsTable).values({
      author: req.user.id,
      video: videoId,
      content: text,
      parentComment: parentId,
    });

    res.send(201).send({
      msg: "Comment has been added to the video.",
    });
  } catch (err) {
    res.status(400).send({
      err: "Error!",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).send({
        err: "Unauthenticated!\nYou cannot execute this operation.",
      });
      return;
    }

    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      res.status(400).send({
        err: "New comment text is not valid!",
      });
      return;
    }

    await db
      .update(commentsTable)
      .set({ content: text })
      .where(eq(commentsTable.id, parseInt(id)));

    res.status(200).send({
      msg: "Comment has been updated",
    });
  } catch (err) {
    res.status(400).send({
      err: "Error!",
    });
  }
});

export default router;
