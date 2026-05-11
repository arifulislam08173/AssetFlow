import { Router } from "express";
import { AuditLog } from "../../models";
import { getPagination, getPagingMeta } from "../../utils/pagination";
import { ok } from "../../utils/api-response";

export const auditRoutes = Router();

auditRoutes.get("/", async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const { rows, count } = await AuditLog.findAndCountAll({ order: [["createdAt", "DESC"]], limit, offset });
    ok(res, "Audit logs fetched successfully", rows, getPagingMeta(count, page, limit));
  } catch (error) { next(error); }
});
