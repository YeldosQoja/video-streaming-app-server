import * as express from "express";
import * as passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db } from "../db";
import { users } from "../db/models/users.sql";
import { eq } from "drizzle-orm";
import * as crypto from "node:crypto";

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
        return cb(null, false, {
          message: "There is no such user with username " + username,
        });
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
          if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
            return cb(null, false, {
              message: "Incorrect password.",
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
            password: hashedPassword,
            username,
            salt,
          })
          .returning({ id: users.id, username: users.username });
        console.log({ insertedUser });
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
