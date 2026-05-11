import { Request } from "express";
import { AuditLog } from "../../models";

export async function writeAudit(req: Request, input: { action: string; module: string; recordId?: string | null; beforeSnapshot?: unknown; afterSnapshot?: unknown }) {
  await AuditLog.create({
    userId: req.user?.id || null,
    userName: req.user?.name || "System",
    action: input.action,
    module: input.module,
    recordId: input.recordId || null,
    ipAddress: req.ip,
    device: req.headers["user-agent"] || null,
    beforeSnapshot: input.beforeSnapshot || null,
    afterSnapshot: input.afterSnapshot || null,
  } as any);
}
