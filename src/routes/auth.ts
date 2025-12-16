import express from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import crypto from "node:crypto";
import { HttpStatusCode } from "../utils/HttpStatusCode.js";
import { ensureAuthenticated } from "../middlewares.js";
import {
  findUserByUsername,
  findUserById,
  createUser,
} from "../db/queries.js";

const router = express.Router();

const ITERATIONS = 310000;

passport.use(
  new LocalStrategy(async (username, password, cb) => {
    try {
      const user = await findUserByUsername(username);
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
    cb(null, user.username);
  });
});

passport.deserializeUser((username: string, cb) => {
  process.nextTick(async () => {
    try {
      const user = await findUserByUsername(username);
      cb(null, user);
    } catch (err) {
      cb(err, null);
    }
  });
});

router.post("/signin", (req, res, next) => {
  passport.authenticate(
    "local",
    (err: any, user: Express.User, info: any, status: number) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.json({ err: info });
      }
      req.login(user, (err) => {
        if (err) {
          throw err;
        }
        res.status(HttpStatusCode.OK).json({ msg: "Login successful!" });
      });
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
        const user = await createUser({
          firstName,
          lastName,
          email,
          password: hashedPassword,
          username,
          salt,
        });
        req.login(user as Express.User, (err) => {
          if (err) {
            throw err;
          }
          console.log("session saved!");
          res.status(HttpStatusCode.OK).json({ user, msg: "User created!" });
        });
      } catch (err) {
        next(err);
      }
    }
  );
});

router.get("/me", ensureAuthenticated, async (req, res) => {
  try {
    const user = await findUserById(req.user!.id);

    if (!user) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "Unauthorized" });
      return;
    }

    res.status(HttpStatusCode.OK).json({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(HttpStatusCode.SERVER_ERROR).json({ error: "Server error" });
  }
});

export default router;
