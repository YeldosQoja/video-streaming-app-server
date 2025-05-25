import * as express from "express";
import * as dotenv from "dotenv";
import * as session from "express-session";
import * as connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import * as passport from "passport";
import indexRouter from "./routes";
import authRouter from "./routes/auth";
import postsRouter from "./routes/posts";

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
app.use("/posts", postsRouter);

dotenv.config();
const port = process.env["PORT"];

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
