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
import uploadRouter from "./routes/upload.js";
import { ensureAuthenticated, handleError } from "./middlewares.js";
import { errorHandler } from "./errorHandler.js";
import AppError from "./utils/AppError.js";
import { HttpStatusCode } from "./utils/HttpStatusCode.js";

export const app = express();
dotenv.config();

// For cloud front private key
fs.writeFileSync("/tmp/private_key.pem", process.env["CDN_PRIVATE_KEY"] || "");
const port = process.env["PORT"];
const sessionSecret = process.env["SESSION_SECRET"] as string;
const userSessionsTable = process.env["SESSION_TABLE"] || "user_sessions";
const env = process.env["NODE_ENV"] || "development";
const origin = process.env["ALLOWED_ORIGIN"] || "http://localhost:5173";

app.use(
  session({
    secret: sessionSecret,
    store: new (connectPgSimple(session))({
      pool,
      tableName: userSessionsTable,
      createTableIfMissing: true,
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env === "production",
      sameSite: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(
  cors({
    origin,
    credentials: true,
  })
);
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/videos", ensureAuthenticated, videosRouter);
app.use("/comments", ensureAuthenticated, commentsRouter);
app.use("/upload", ensureAuthenticated, uploadRouter);
app.use(handleError);

process.on("uncaughtException", (error) => {
  errorHandler.handle(
    new AppError(error.message, HttpStatusCode.SERVER_ERROR, false)
  );
});

process.on("unhandledRejection", (reason) => {
  errorHandler.handle(
    new AppError(reason as string, HttpStatusCode.SERVER_ERROR, false)
  );
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
