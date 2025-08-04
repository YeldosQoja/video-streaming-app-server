import express from "express";
import type { Request, Response, NextFunction } from "express";
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
dotenv.config();
const port = process.env["PORT"];

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

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

const ensureAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ msg: "Unauthorized" });
};

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/videos", ensureAuthenticated, videosRouter);
app.use("/comments", ensureAuthenticated, commentsRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
