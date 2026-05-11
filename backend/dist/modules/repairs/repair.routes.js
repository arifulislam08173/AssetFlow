"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repairRoutes = void 0;
const express_1 = require("express");
const models_1 = require("../../models");
const api_response_1 = require("../../utils/api-response");
const pagination_1 = require("../../utils/pagination");
const audit_service_1 = require("../audit-logs/audit.service");
exports.repairRoutes = (0, express_1.Router)();
exports.repairRoutes.get("/", async (req, res, next) => { try {
    const { page, limit, offset } = (0, pagination_1.getPagination)(req);
    const { rows, count } = await models_1.RepairTicket.findAndCountAll({ include: [models_1.Asset, models_1.Vendor], order: [["createdAt", "DESC"]], limit, offset });
    (0, api_response_1.ok)(res, "Repair tickets fetched successfully", rows, (0, pagination_1.getPagingMeta)(count, page, limit));
}
catch (e) {
    next(e);
} });
exports.repairRoutes.post("/", async (req, res, next) => { try {
    const ticket = await models_1.RepairTicket.create(req.body);
    await models_1.Asset.update({ status: "In Repair" }, { where: { id: ticket.assetId } });
    await (0, audit_service_1.writeAudit)(req, { action: "Created", module: "Repairs", recordId: ticket.id, afterSnapshot: ticket.toJSON() });
    (0, api_response_1.created)(res, "Repair ticket created successfully", ticket);
}
catch (e) {
    next(e);
} });
