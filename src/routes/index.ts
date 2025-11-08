import express from "express";
import fs from "node:fs";
import path from "node:path";
import { HttpStatusCode } from "../utils/HttpStatusCode.js";

const router = express.Router();

router.get("/home", (req, res) => {
  res.send("Hello World!");
});

router.get("/videos/local/:filename", (req, res) => {
  const filename = req.params.filename;
  const range = req.headers.range;

  const videoPath = path.join("assets", "videos", filename);

  fs.stat(videoPath, (err, stat) => {
    const fileSize = stat.size;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");

      const start = parts[0] ? parseInt(parts[0], 10) : 0;
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(HttpStatusCode.RANGE_NOT_SATISFIABLE).send("Requested range not satisfiable");
        return;
      }

      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(videoPath, { start, end });

      res.writeHead(HttpStatusCode.PARTIAL_CONTENT, {
        "Content-Range": `bytes ${start} - ${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      });

      stream.pipe(res);
    } else {
      res.writeHead(HttpStatusCode.OK, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      });
      fs.createReadStream(videoPath).pipe(res);
    }
  });
});

export default router;
