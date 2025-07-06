import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import passport from "passport";
import indexRouter from "./routes";
import authRouter from "./routes/auth";
// Dynamically import the ESM videosRouter
let videosRouter: any;
(async () => {
  const module = await import("./routes/videos.mjs");
  videosRouter = module.default;
})();
import commentsRouter from "./routes/comments";

export const app = express();

app.use(
  session({
    secret: "some secret",
    store: new (connectPgSimple(session))({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.authenticate("session"));
app.use(express.json());

app.use("/", indexRouter);
app.use("/auth", authRouter);
// Use videosRouter after it's loaded
app.use("/videos", (req, res, next) => {
  if (videosRouter) {
    return videosRouter(req, res, next);
  }
  res.status(503).send("Videos router is not loaded yet.");
});
app.use("/comments", commentsRouter);

dotenv.config();
const port = process.env["PORT"];

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
