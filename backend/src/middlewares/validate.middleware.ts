import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/errors";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new ApiError(400, result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")));
    }
    req[source] = result.data;
    next();
  };
}
