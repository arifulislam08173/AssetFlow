import { Request } from "express";

export function getPagination(req: Request) {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function getPagingMeta(count: number, page: number, limit: number) {
  return { page, limit, total: count, totalPages: Math.ceil(count / limit) || 1 };
}
