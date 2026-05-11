"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeRoutes = void 0;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const zod_1 = require("zod");
const models_1 = require("../../models");
const api_response_1 = require("../../utils/api-response");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
const audit_service_1 = require("../audit-logs/audit.service");
exports.employeeRoutes = (0, express_1.Router)();
const schema = zod_1.z.object({ employeeCode: zod_1.z.string().min(2), name: zod_1.z.string().min(2), email: zod_1.z.string().email(), phone: zod_1.z.string().optional().nullable(), designation: zod_1.z.string().min(2), departmentId: zod_1.z.string().uuid(), locationId: zod_1.z.string().uuid(), joiningDate: zod_1.z.string(), status: zod_1.z.string().optional(), clearanceStatus: zod_1.z.string().optional() });
exports.employeeRoutes.get("/", async (req, res, next) => {
    try {
        const { page, limit, offset } = (0, pagination_1.getPagination)(req);
        const search = String(req.query.search || "").trim();
        const where = {};
        if (search)
            where[sequelize_1.Op.or] = [{ employeeCode: { [sequelize_1.Op.iLike]: `%${search}%` } }, { name: { [sequelize_1.Op.iLike]: `%${search}%` } }, { email: { [sequelize_1.Op.iLike]: `%${search}%` } }];
        if (req.query.status)
            where.status = req.query.status;
        if (req.query.departmentId)
            where.departmentId = req.query.departmentId;
        const { rows, count } = await models_1.Employee.findAndCountAll({ where, include: [models_1.Department, models_1.Location], order: [["createdAt", "DESC"]], limit, offset });
        (0, api_response_1.ok)(res, "Employees fetched successfully", rows, (0, pagination_1.getPagingMeta)(count, page, limit));
    }
    catch (error) {
        next(error);
    }
});
exports.employeeRoutes.post("/", async (req, res, next) => {
    try {
        const body = schema.parse(req.body);
        const employee = await models_1.Employee.create(body);
        await (0, audit_service_1.writeAudit)(req, { action: "Created", module: "Employees", recordId: employee.id, afterSnapshot: employee.toJSON() });
        (0, api_response_1.created)(res, "Employee created successfully", employee);
    }
    catch (error) {
        next(error);
    }
});
exports.employeeRoutes.get("/:id", async (req, res, next) => {
    try {
        const employee = await models_1.Employee.findByPk(req.params.id, { include: [models_1.Department, models_1.Location, models_1.Asset] });
        if (!employee)
            throw new errors_1.ApiError(404, "Employee not found");
        (0, api_response_1.ok)(res, "Employee fetched successfully", employee);
    }
    catch (error) {
        next(error);
    }
});
exports.employeeRoutes.patch("/:id", async (req, res, next) => {
    try {
        const employee = await models_1.Employee.findByPk(req.params.id);
        if (!employee)
            throw new errors_1.ApiError(404, "Employee not found");
        const before = employee.toJSON();
        await employee.update(req.body);
        await (0, audit_service_1.writeAudit)(req, { action: "Updated", module: "Employees", recordId: employee.id, beforeSnapshot: before, afterSnapshot: employee.toJSON() });
        (0, api_response_1.ok)(res, "Employee updated successfully", employee);
    }
    catch (error) {
        next(error);
    }
});
exports.employeeRoutes.delete("/:id", async (req, res, next) => {
    try {
        const employee = await models_1.Employee.findByPk(req.params.id);
        if (!employee)
            throw new errors_1.ApiError(404, "Employee not found");
        const before = employee.toJSON();
        await employee.destroy();
        await (0, audit_service_1.writeAudit)(req, { action: "Deleted", module: "Employees", recordId: req.params.id, beforeSnapshot: before });
        (0, api_response_1.ok)(res, "Employee deleted successfully");
    }
    catch (error) {
        next(error);
    }
});
exports.employeeRoutes.get("/:id/assets", async (req, res, next) => {
    try {
        const assets = await models_1.Asset.findAll({ where: { assignedEmployeeId: req.params.id } });
        (0, api_response_1.ok)(res, "Employee assets fetched successfully", assets);
    }
    catch (error) {
        next(error);
    }
});
