"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorRoutes = void 0;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const zod_1 = require("zod");
const models_1 = require("../../models");
const api_response_1 = require("../../utils/api-response");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
const audit_service_1 = require("../audit-logs/audit.service");
exports.vendorRoutes = (0, express_1.Router)();
const schema = zod_1.z.object({ name: zod_1.z.string().min(2), contactPerson: zod_1.z.string().optional().nullable(), phone: zod_1.z.string().optional().nullable(), email: zod_1.z.string().email().optional().nullable().or(zod_1.z.literal("")), address: zod_1.z.string().optional().nullable(), status: zod_1.z.string().optional() });
exports.vendorRoutes.get("/", async (req, res, next) => { try {
    const { page, limit, offset } = (0, pagination_1.getPagination)(req);
    const search = String(req.query.search || "").trim();
    const where = {};
    if (search)
        where[sequelize_1.Op.or] = [{ name: { [sequelize_1.Op.iLike]: `%${search}%` } }, { contactPerson: { [sequelize_1.Op.iLike]: `%${search}%` } }, { phone: { [sequelize_1.Op.iLike]: `%${search}%` } }, { email: { [sequelize_1.Op.iLike]: `%${search}%` } }];
    const { rows, count } = await models_1.Vendor.findAndCountAll({ where, order: [[String(req.query.sortBy || "createdAt"), String(req.query.sortOrder || "DESC")]], limit, offset });
    (0, api_response_1.ok)(res, "Vendors fetched successfully", rows, (0, pagination_1.getPagingMeta)(count, page, limit));
}
catch (e) {
    next(e);
} });
exports.vendorRoutes.post("/", async (req, res, next) => { try {
    const body = schema.parse(req.body);
    const item = await models_1.Vendor.create({ ...body, email: body.email || null });
    await (0, audit_service_1.writeAudit)(req, { action: "Created", module: "Vendors", recordId: item.id, afterSnapshot: item.toJSON() });
    (0, api_response_1.created)(res, "Vendor created successfully", item);
}
catch (e) {
    next(e);
} });
exports.vendorRoutes.get("/:id", async (req, res, next) => { try {
    const item = await models_1.Vendor.findByPk(req.params.id);
    if (!item)
        throw new errors_1.ApiError(404, "Vendor not found");
    (0, api_response_1.ok)(res, "Vendor fetched successfully", item);
}
catch (e) {
    next(e);
} });
exports.vendorRoutes.patch("/:id", async (req, res, next) => { try {
    const item = await models_1.Vendor.findByPk(req.params.id);
    if (!item)
        throw new errors_1.ApiError(404, "Vendor not found");
    const before = item.toJSON();
    const body = schema.partial().parse(req.body);
    await item.update({ ...body, email: body.email === "" ? null : body.email });
    await (0, audit_service_1.writeAudit)(req, { action: "Updated", module: "Vendors", recordId: item.id, beforeSnapshot: before, afterSnapshot: item.toJSON() });
    (0, api_response_1.ok)(res, "Vendor updated successfully", item);
}
catch (e) {
    next(e);
} });
exports.vendorRoutes.delete("/:id", async (req, res, next) => { try {
    const item = await models_1.Vendor.findByPk(req.params.id);
    if (!item)
        throw new errors_1.ApiError(404, "Vendor not found");
    const before = item.toJSON();
    await item.destroy();
    await (0, audit_service_1.writeAudit)(req, { action: "Deleted", module: "Vendors", recordId: req.params.id, beforeSnapshot: before });
    (0, api_response_1.ok)(res, "Vendor deleted successfully");
}
catch (e) {
    next(e);
} });
