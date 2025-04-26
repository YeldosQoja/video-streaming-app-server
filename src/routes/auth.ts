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
  new LocalStrategy(async (username, password, cb) => {
    try {
      const userRow = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      const user = userRow[0];
      if (!user) {
        return cb(null, false, { message: "Incorrect email or password!!!" });
      }
      const { salt } = user;
      crypto.pbkdf2(
        password,
        salt,
        ITERATIONS,
        32,
        "sha256",
        (err, hashedPassword) => {
          if (err) {
            return cb(err);
          }
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

passport.serializeUser((user, cb) => {
  process.nextTick(() => {
    cb(null, user.id);
  });
});

passport.deserializeUser((id: number, cb) => {
  process.nextTick(() => {
    db.select()
      .from(users)
      .where(eq(users.id, id))
      .then((row) => {
        console.log(row);
        cb(null, row[0]);
      })
      .catch((err) => {
        cb(err, null);
      });
  });
});

router.post("/login", (req, res, next) => {
  passport.authenticate(
    "local",
    (err: any, user: Express.User, info: any, status: number) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.json({ err: info });
      }
      res.status(200).json({ msg: "Login successful!" });
    }
  )(req, res, next);
});

router.post("/signup", async (req, res, next) => {
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
        const insertedUser = await db
          .insert(users)
          .values({
            firstName,
            lastName,
            email,
            password: hashedPassword.toString("utf-8"),
            username,
            salt: String.fromCharCode(...salt),
          })
          .returning({ id: users.id, username: users.username });
        const user = insertedUser[0] as Express.User;
        req.login(user, (err) => {
          if (err) {
            throw err;
          }
          console.log("session saved!");
          res.status(200).json({ user, msg: "User created!" });
        });
      } catch (err) {
        next(err);
      }
    }
  );
});

export default router;
