"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRoutes = void 0;
const express_1 = require("express");
const models_1 = require("../../models");
const pagination_1 = require("../../utils/pagination");
const api_response_1 = require("../../utils/api-response");
exports.auditRoutes = (0, express_1.Router)();
exports.auditRoutes.get("/", async (req, res, next) => {
    try {
        const { page, limit, offset } = (0, pagination_1.getPagination)(req);
        const { rows, count } = await models_1.AuditLog.findAndCountAll({ order: [["createdAt", "DESC"]], limit, offset });
        (0, api_response_1.ok)(res, "Audit logs fetched successfully", rows, (0, pagination_1.getPagingMeta)(count, page, limit));
    }
    catch (error) {
        next(error);
    }
});
