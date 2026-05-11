"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseRoutes = void 0;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const zod_1 = require("zod");
const models_1 = require("../../models");
const api_response_1 = require("../../utils/api-response");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
const audit_service_1 = require("../audit-logs/audit.service");
exports.purchaseRoutes = (0, express_1.Router)();
const schema = zod_1.z.object({ invoiceNumber: zod_1.z.string().min(2), vendorId: zod_1.z.string().uuid(), purchaseDate: zod_1.z.string(), totalAmount: zod_1.z.number().nonnegative().default(0), paymentStatus: zod_1.z.string().default("Paid") });
exports.purchaseRoutes.get("/", async (req, res, next) => { try {
    const { page, limit, offset } = (0, pagination_1.getPagination)(req);
    const search = String(req.query.search || "").trim();
    const where = {};
    if (search)
        where[sequelize_1.Op.or] = [{ invoiceNumber: { [sequelize_1.Op.iLike]: `%${search}%` } }, { paymentStatus: { [sequelize_1.Op.iLike]: `%${search}%` } }];
    const { rows, count } = await models_1.Purchase.findAndCountAll({ where, include: [models_1.Vendor, models_1.PurchaseItem], order: [[String(req.query.sortBy || "createdAt"), String(req.query.sortOrder || "DESC")]], limit, offset });
    (0, api_response_1.ok)(res, "Purchases fetched successfully", rows, (0, pagination_1.getPagingMeta)(count, page, limit));
}
catch (e) {
    next(e);
} });
exports.purchaseRoutes.post("/", async (req, res, next) => { try {
    const body = schema.parse(req.body);
    const item = await models_1.Purchase.create(body);
    await (0, audit_service_1.writeAudit)(req, { action: "Created", module: "Purchases", recordId: item.id, afterSnapshot: item.toJSON() });
    (0, api_response_1.created)(res, "Purchase created successfully", item);
}
catch (e) {
    next(e);
} });
exports.purchaseRoutes.patch("/:id", async (req, res, next) => { try {
    const item = await models_1.Purchase.findByPk(req.params.id);
    if (!item)
        throw new errors_1.ApiError(404, "Purchase not found");
    const before = item.toJSON();
    await item.update(schema.partial().parse(req.body));
    await (0, audit_service_1.writeAudit)(req, { action: "Updated", module: "Purchases", recordId: item.id, beforeSnapshot: before, afterSnapshot: item.toJSON() });
    (0, api_response_1.ok)(res, "Purchase updated successfully", item);
}
catch (e) {
    next(e);
} });
exports.purchaseRoutes.delete("/:id", async (req, res, next) => { try {
    const item = await models_1.Purchase.findByPk(req.params.id);
    if (!item)
        throw new errors_1.ApiError(404, "Purchase not found");
    const before = item.toJSON();
    await item.destroy();
    await (0, audit_service_1.writeAudit)(req, { action: "Deleted", module: "Purchases", recordId: item.id, beforeSnapshot: before });
    (0, api_response_1.ok)(res, "Purchase deleted successfully");
}
catch (e) {
    next(e);
} });
