import { Router } from "express";
import { AuditLog, Role, User } from "../../models";
import { getPagination, getPagingMeta } from "../../utils/pagination";
import { ok } from "../../utils/api-response";
import { ApiError } from "../../utils/errors";

export const auditRoutes = Router();

type JsonRecord = Record<string, any>;

function changedFields(beforeSnapshot: unknown, afterSnapshot: unknown) {
  const before = (beforeSnapshot || {}) as JsonRecord;
  const after = (afterSnapshot || {}) as JsonRecord;
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  return keys
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map((field) => ({ field, before: before[field] ?? null, after: after[field] ?? null }));
}

auditRoutes.get("/", async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const { rows, count } = await AuditLog.findAndCountAll({ order: [["createdAt", "DESC"]], limit, offset });
    ok(res, "Audit logs fetched successfully", rows, getPagingMeta(count, page, limit));
  } catch (error) { next(error); }
});

auditRoutes.get("/:id", async (req, res, next) => {
  try {
    const log = await AuditLog.findByPk(req.params.id);
    if (!log) throw new ApiError(404, "Audit log not found");
    const item = log.toJSON() as any;
    let roleName: string | null = null;
    if (item.userId) {
      const user = await User.findByPk(item.userId, { include: [Role] });
      roleName = ((user as any)?.Role as Role | undefined)?.name || null;
    }
    ok(res, "Audit log fetched successfully", {
      ...item,
      roleName,
      changedFields: changedFields(item.beforeSnapshot, item.afterSnapshot),
    });
  } catch (error) { next(error); }
});
