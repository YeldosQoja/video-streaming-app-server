import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db/index.js";
import passport from "passport";
import indexRouter from "./routes/index.js";
import authRouter from "./routes/auth.js";
import videosRouter from "./routes/videos.js";
import commentsRouter from "./routes/comments.js";

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
app.use("/videos", videosRouter);
app.use("/comments", commentsRouter);

dotenv.config();
const port = process.env["PORT"];

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
