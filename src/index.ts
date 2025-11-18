import express from "express";
import fs from "fs";
import dotenv from "dotenv";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db/index.js";
import passport from "passport";
import cors from "cors";
import indexRouter from "./routes/index.js";
import authRouter from "./routes/auth.js";
import videosRouter from "./routes/videos.js";
import commentsRouter from "./routes/comments.js";
import { ensureAuthenticated } from "./middlewares.js";

// For cloud front private key
fs.writeFileSync("/tmp/private_key.pem", process.env["CDN_PRIVATE_KEY"] || "");

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
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/videos", ensureAuthenticated, videosRouter);
app.use("/comments", ensureAuthenticated, commentsRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
