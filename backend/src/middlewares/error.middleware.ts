import { ErrorRequestHandler } from "express";
import { ApiError } from "../utils/errors";

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : "Internal server error";
  if (statusCode >= 500)
    console.error(err);
  res.status(statusCode).json({ success: false, message });
};
