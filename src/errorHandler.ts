import type { Response } from "express";
import AppError from "./utils/AppError.js";

class ErrorHandler {
  async handle(error: AppError, res?: Response) {
    if (res) {
      res.status(error.statusCode).send({
        err: error.message,
      });
    }
  }
}

export const errorHandler = new ErrorHandler();
