"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
const api_response_1 = require("../../utils/api-response");
exports.dashboardRoutes = (0, express_1.Router)();
exports.dashboardRoutes.get("/stats", async (_req, res, next) => {
    try {
        const [totalAssets, assignedAssets, availableAssets, inRepair, damaged, lost, employees, pendingRepairs, recentActivities] = await Promise.all([
            models_1.Asset.count(), models_1.Asset.count({ where: { status: "Assigned" } }), models_1.Asset.count({ where: { status: "Available" } }), models_1.Asset.count({ where: { status: "In Repair" } }), models_1.Asset.count({ where: { status: "Damaged" } }), models_1.Asset.count({ where: { status: "Lost" } }), models_1.Employee.count({ where: { status: "Active" } }), models_1.RepairTicket.count({ where: { status: { [sequelize_1.Op.notIn]: ["Returned", "Cancelled"] } } }), models_1.AuditLog.findAll({ order: [["createdAt", "DESC"]], limit: 10 })
        ]);
        const sums = await models_1.Asset.findAll({ attributes: [[models_1.Asset.sequelize.fn("sum", models_1.Asset.sequelize.col("purchase_price")), "purchaseValue"], [models_1.Asset.sequelize.fn("sum", models_1.Asset.sequelize.col("current_value")), "currentValue"]], raw: true });
        (0, api_response_1.ok)(res, "Dashboard stats fetched", { totalAssets, assignedAssets, availableAssets, inRepair, damaged, lost, employees, pendingRepairs, purchaseValue: Number(sums[0]?.purchaseValue || 0), currentValue: Number(sums[0]?.currentValue || 0), recentActivities });
    }
    catch (error) {
        next(error);
    }
});
