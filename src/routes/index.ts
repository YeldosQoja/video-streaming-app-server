import * as express from "express";
import * as fs from "node:fs";
import * as path from "node:path";

const router = express.Router();

router.get("/index", (req, res) => {
  res.send("Hello World!");
});

router.get("/videos/:filename", (req, res) => {
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
        res.status(416).send("Requested range not satisfiable");
        return;
      }

      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(videoPath, { start, end });

      res.writeHead(206, {
        "Content-Range": `bytes ${start} - ${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      });

      stream.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      });
      fs.createReadStream(videoPath).pipe(res);
    }
  });
});

export default router;
