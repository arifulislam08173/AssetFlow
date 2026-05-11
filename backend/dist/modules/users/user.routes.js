"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const models_1 = require("../../models");
const api_response_1 = require("../../utils/api-response");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
const audit_service_1 = require("../audit-logs/audit.service");
exports.userRoutes = (0, express_1.Router)();
const createSchema = zod_1.z.object({ name: zod_1.z.string().min(2), email: zod_1.z.string().email(), password: zod_1.z.string().min(6), roleId: zod_1.z.string().uuid(), status: zod_1.z.string().default("Active") });
exports.userRoutes.get("/", async (req, res, next) => {
    try {
        const { page, limit, offset } = (0, pagination_1.getPagination)(req);
        const { rows, count } = await models_1.User.findAndCountAll({ include: [models_1.Role], order: [["createdAt", "DESC"]], limit, offset });
        (0, api_response_1.ok)(res, "Users fetched successfully", rows, (0, pagination_1.getPagingMeta)(count, page, limit));
    }
    catch (error) {
        next(error);
    }
});
exports.userRoutes.post("/", async (req, res, next) => {
    try {
        const body = createSchema.parse(req.body);
        const user = await models_1.User.create({ name: body.name, email: body.email, passwordHash: await (0, models_1.hashPassword)(body.password), roleId: body.roleId, status: body.status });
        await (0, audit_service_1.writeAudit)(req, { action: "Created", module: "Users", recordId: user.id, afterSnapshot: { id: user.id, email: user.email, roleId: user.roleId } });
        (0, api_response_1.created)(res, "User created successfully", user);
    }
    catch (error) {
        next(error);
    }
});
exports.userRoutes.patch("/:id", async (req, res, next) => {
    try {
        const user = await models_1.User.findByPk(req.params.id);
        if (!user)
            throw new errors_1.ApiError(404, "User not found");
        const before = user.toJSON();
        const payload = { ...req.body };
        if (payload.password) {
            payload.passwordHash = await (0, models_1.hashPassword)(payload.password);
            delete payload.password;
        }
        await user.update(payload);
        await (0, audit_service_1.writeAudit)(req, { action: "Updated", module: "Users", recordId: user.id, beforeSnapshot: before, afterSnapshot: user.toJSON() });
        (0, api_response_1.ok)(res, "User updated successfully", user);
    }
    catch (error) {
        next(error);
    }
});
exports.userRoutes.get("/roles", async (_req, res, next) => {
    try {
        (0, api_response_1.ok)(res, "Roles fetched successfully", await models_1.Role.findAll({ order: [["name", "ASC"]] }));
    }
    catch (e) {
        next(e);
    }
});
