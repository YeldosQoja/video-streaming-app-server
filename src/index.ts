import * as express from "express";
import * as dotenv from "dotenv";
import * as session from "express-session";
import * as connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import * as passport from "passport";
import indexRouter from "./routes";
import authRouter from "./routes/auth";

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

app.use(passport.authenticate("session"));

app.use("/", indexRouter);
app.use("/auth", authRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
