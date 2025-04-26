import * as express from "express";

const router = express.Router();

router.get("/index", (req, res) => {
  res.send("Hello World!");
});

export default router;
