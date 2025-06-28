import * as express from "express";
import { db } from "../db";
import { comments as commentsTable } from "../db/models/comments.sql";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get("/posts/:postId/comments", async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).send({
        err: "Unauthenticated!\nYou cannot execute this operation.",
      });
      return;
    }

    const { postId } = req.params;
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
      .where(eq(commentsTable.post, parseInt(postId)))
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

router.post("comments", async (req, res) => {
  try {
    const { postId, text, parentId } = req.body;

    if (!req.user) {
      res.status(401).send({
        err: "Unauthenticated!\nYou cannot execute this operation.",
      });
      return;
    }

    await db.insert(commentsTable).values({
      author: req.user.id,
      post: postId,
      content: text,
      parentComment: parentId,
    });

    res.send(201).send({
      msg: "Comment has been added to the post.",
    });
  } catch (err) {
    res.status(400).send({
      err: "Error!",
    });
  }
});

router.put("comments/:id", async (req, res) => {
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
