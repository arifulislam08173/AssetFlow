import { Request } from "express";
import { ApiError } from "./errors";

/** UI offers 10/20/50/100, while lookup forms may fetch up to 500 records. */
export function getPagination(req: Request) {
  const rawPage = req.query.page === undefined ? 1 : Number(req.query.page);
  const rawLimit = req.query.limit === undefined ? 10 : Number(req.query.limit);
  if (!Number.isSafeInteger(rawPage) || rawPage < 1 || rawPage > 1_000_000) {
    throw new ApiError(400, "page must be a positive integer");
  }
  if (!Number.isSafeInteger(rawLimit) || rawLimit < 1 || rawLimit > 500) {
    throw new ApiError(400, "limit must be an integer between 1 and 500");
  }
  const page = rawPage;
  const limit = rawLimit;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function getPagingMeta(count: number, page: number, limit: number) {
  return { page, limit, total: count, totalPages: Math.ceil(count / limit) || 1 };
}
