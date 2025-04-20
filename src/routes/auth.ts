import * as express from "express";
import * as passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db } from "../db";
import { users } from "../db/models/users.sql";
import { eq } from "drizzle-orm";
import * as crypto from "node:crypto";
import { Buffer } from "node:buffer";

const router = express.Router();

const ITERATIONS = 310000;

passport.use(
  new LocalStrategy(async function verify(username, password, cb) {
    try {
      const userRow = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      if (!userRow || !userRow[0]) {
        return cb(null, false, { message: "Incorrect email or password!!!" });
      }
      const user = userRow[0];
      if (!user) {
        return cb(null, false, { message: "Incorrect email or password!!!" });
      }
      crypto.pbkdf2(
        password,
        "1234567890", // should figure out a way to generate unique salt strings for each user later
        ITERATIONS,
        32,
        "sha256",
        function (err, hashedPassword) {
          if (err) {
            return cb(err);
          }
          console.log("bytes per element", hashedPassword.BYTES_PER_ELEMENT);
          const buffer = new Buffer(user.password);
          if (!crypto.timingSafeEqual(buffer, hashedPassword)) {
            return cb(null, false, {
              message: "Incorrect username or password.",
            });
          }
          return cb(null, user);
        }
      );
    } catch (err) {
      return cb(err);
    }
  })
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.email });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

router.post("/signup", (req, res, next) => {
  const { firstName, lastName, username, email, password } = req.body;
  const salt = crypto.randomBytes(16);
  crypto.pbkdf2(
    password,
    salt,
    ITERATIONS,
    32,
    "sha256",
    async (err, hashedPassword) => {
      if (err) {
        return next(err);
      }
      try {
        await db.insert(users).values({
          firstName,
          lastName,
          email,
          password: hashedPassword.toString("utf-8"),
          username,
          salt: String.fromCharCode(...salt),
        });
      } catch(err) {
        console.log(err);
        next(err);
      }
    }
  );
});

export default router;
