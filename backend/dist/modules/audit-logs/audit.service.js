"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAudit = writeAudit;
const models_1 = require("../../models");
async function writeAudit(req, input) {
    await models_1.AuditLog.create({
        userId: req.user?.id || null,
        userName: req.user?.name || "System",
        action: input.action,
        module: input.module,
        recordId: input.recordId || null,
        ipAddress: req.ip,
        device: req.headers["user-agent"] || null,
        beforeSnapshot: input.beforeSnapshot || null,
        afterSnapshot: input.afterSnapshot || null,
    });
}
