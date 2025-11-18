import type { NextFunction, Request, Response } from "express";
import { HttpStatusCode } from "./utils/HttpStatusCode.js";

export const ensureAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(HttpStatusCode.UNAUTHORIZED).json({ msg: "Unauthorized" });
};
