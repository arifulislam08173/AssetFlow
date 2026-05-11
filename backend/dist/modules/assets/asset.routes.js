"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetRoutes = void 0;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const qrcode_1 = __importDefault(require("qrcode"));
const zod_1 = require("zod");
const models_1 = require("../../models");
const api_response_1 = require("../../utils/api-response");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
const depreciation_1 = require("../../utils/depreciation");
const audit_service_1 = require("../audit-logs/audit.service");
exports.assetRoutes = (0, express_1.Router)();
const assetSchema = zod_1.z.object({
    assetCode: zod_1.z.string().min(2), name: zod_1.z.string().min(2), categoryId: zod_1.z.string().uuid(), brand: zod_1.z.string().optional(), model: zod_1.z.string().optional(), serialNumber: zod_1.z.string().min(2), assetTag: zod_1.z.string().optional(), purchaseDate: zod_1.z.string(), purchasePrice: zod_1.z.number().nonnegative(), salvageValue: zod_1.z.number().nonnegative().optional(), usefulLifeYears: zod_1.z.number().int().positive().optional(), depreciationMethod: zod_1.z.string().optional(), vendorId: zod_1.z.string().uuid().optional().nullable(), locationId: zod_1.z.string().uuid(), condition: zod_1.z.string().optional(), status: zod_1.z.string().optional(), warrantyExpiry: zod_1.z.string().optional().nullable(), notes: zod_1.z.string().optional().nullable()
});
exports.assetRoutes.get("/", async (req, res, next) => {
    try {
        const { page, limit, offset } = (0, pagination_1.getPagination)(req);
        const search = String(req.query.search || "").trim();
        const where = {};
        if (search)
            where[sequelize_1.Op.or] = [{ assetCode: { [sequelize_1.Op.iLike]: `%${search}%` } }, { name: { [sequelize_1.Op.iLike]: `%${search}%` } }, { serialNumber: { [sequelize_1.Op.iLike]: `%${search}%` } }, { brand: { [sequelize_1.Op.iLike]: `%${search}%` } }, { model: { [sequelize_1.Op.iLike]: `%${search}%` } }];
        if (req.query.status)
            where.status = req.query.status;
        if (req.query.categoryId)
            where.categoryId = req.query.categoryId;
        const { rows, count } = await models_1.Asset.findAndCountAll({ where, include: [{ model: models_1.AssetCategory, as: "category" }, { model: models_1.Vendor, as: "vendor" }, { model: models_1.Location, as: "location" }, { model: models_1.Employee, as: "assignedEmployee" }], order: [[String(req.query.sortBy || "createdAt"), String(req.query.sortOrder || "DESC")]], limit, offset });
        (0, api_response_1.ok)(res, "Assets fetched successfully", rows, (0, pagination_1.getPagingMeta)(count, page, limit));
    }
    catch (error) {
        next(error);
    }
});
exports.assetRoutes.post("/", async (req, res, next) => {
    try {
        const data = assetSchema.parse(req.body);
        const currentValue = (0, depreciation_1.calculateStraightLineValue)({ purchasePrice: data.purchasePrice, salvageValue: data.salvageValue || 0, usefulLifeYears: data.usefulLifeYears || 5, purchaseDate: data.purchaseDate });
        const asset = await models_1.Asset.create({ ...data, currentValue });
        await (0, audit_service_1.writeAudit)(req, { action: "Created", module: "Assets", recordId: asset.id, afterSnapshot: asset.toJSON() });
        (0, api_response_1.created)(res, "Asset created successfully", asset);
    }
    catch (error) {
        next(error);
    }
});
exports.assetRoutes.get("/:id", async (req, res, next) => {
    try {
        const asset = await models_1.Asset.findByPk(req.params.id, { include: [{ model: models_1.AssetCategory, as: "category" }, { model: models_1.Vendor, as: "vendor" }, { model: models_1.Location, as: "location" }, { model: models_1.Employee, as: "assignedEmployee" }, models_1.AssetAssignment, models_1.AssetReturn] });
        if (!asset)
            throw new errors_1.ApiError(404, "Asset not found");
        (0, api_response_1.ok)(res, "Asset fetched successfully", asset);
    }
    catch (error) {
        next(error);
    }
});
exports.assetRoutes.patch("/:id", async (req, res, next) => {
    try {
        const asset = await models_1.Asset.findByPk(req.params.id);
        if (!asset)
            throw new errors_1.ApiError(404, "Asset not found");
        const before = asset.toJSON();
        await asset.update(req.body);
        await (0, audit_service_1.writeAudit)(req, { action: "Updated", module: "Assets", recordId: asset.id, beforeSnapshot: before, afterSnapshot: asset.toJSON() });
        (0, api_response_1.ok)(res, "Asset updated successfully", asset);
    }
    catch (error) {
        next(error);
    }
});
exports.assetRoutes.delete("/:id", async (req, res, next) => {
    try {
        const asset = await models_1.Asset.findByPk(req.params.id);
        if (!asset)
            throw new errors_1.ApiError(404, "Asset not found");
        const before = asset.toJSON();
        await asset.destroy();
        await (0, audit_service_1.writeAudit)(req, { action: "Deleted", module: "Assets", recordId: req.params.id, beforeSnapshot: before });
        (0, api_response_1.ok)(res, "Asset deleted successfully");
    }
    catch (error) {
        next(error);
    }
});
exports.assetRoutes.post("/:id/assign", async (req, res, next) => {
    try {
        const body = zod_1.z.object({ employeeId: zod_1.z.string().uuid(), conditionAtAssign: zod_1.z.string().default("Good"), notes: zod_1.z.string().optional() }).parse(req.body);
        const asset = await models_1.Asset.findByPk(req.params.id);
        if (!asset)
            throw new errors_1.ApiError(404, "Asset not found");
        if (asset.status === "Assigned")
            throw new errors_1.ApiError(409, "Asset is already assigned");
        const assignment = await models_1.AssetAssignment.create({ assetId: asset.id, employeeId: body.employeeId, assignedById: req.user.id, conditionAtAssign: body.conditionAtAssign, notes: body.notes });
        await asset.update({ status: "Assigned", assignedEmployeeId: body.employeeId, condition: body.conditionAtAssign });
        await (0, audit_service_1.writeAudit)(req, { action: "Assigned", module: "Assets", recordId: asset.id, afterSnapshot: { assignment, asset } });
        (0, api_response_1.created)(res, "Asset assigned successfully", assignment);
    }
    catch (error) {
        next(error);
    }
});
exports.assetRoutes.post("/:id/return", async (req, res, next) => {
    try {
        const body = zod_1.z.object({ assignmentId: zod_1.z.string().uuid(), returnStatus: zod_1.z.string().default("Returned"), returnCondition: zod_1.z.string().default("Good"), penaltyAmount: zod_1.z.number().default(0), notes: zod_1.z.string().optional() }).parse(req.body);
        const asset = await models_1.Asset.findByPk(req.params.id);
        if (!asset)
            throw new errors_1.ApiError(404, "Asset not found");
        const assignment = await models_1.AssetAssignment.findByPk(body.assignmentId);
        if (!assignment)
            throw new errors_1.ApiError(404, "Assignment not found");
        const returnRecord = await models_1.AssetReturn.create({ assignmentId: assignment.id, assetId: asset.id, employeeId: assignment.employeeId, receivedById: req.user.id, returnStatus: body.returnStatus, returnCondition: body.returnCondition, penaltyAmount: body.penaltyAmount, notes: body.notes });
        await assignment.update({ returnedAt: new Date() });
        await asset.update({ status: body.returnStatus === "Lost" ? "Lost" : "Available", assignedEmployeeId: null, condition: body.returnCondition });
        await (0, audit_service_1.writeAudit)(req, { action: "Returned", module: "Assets", recordId: asset.id, afterSnapshot: { returnRecord, asset } });
        (0, api_response_1.created)(res, "Asset returned successfully", returnRecord);
    }
    catch (error) {
        next(error);
    }
});
exports.assetRoutes.get("/:id/qr", async (req, res, next) => {
    try {
        const asset = await models_1.Asset.findByPk(req.params.id);
        if (!asset)
            throw new errors_1.ApiError(404, "Asset not found");
        const qr = await qrcode_1.default.toDataURL(JSON.stringify({ assetId: asset.id, assetCode: asset.assetCode, serialNumber: asset.serialNumber }));
        (0, api_response_1.ok)(res, "QR code generated", { qr });
    }
    catch (error) {
        next(error);
    }
});
