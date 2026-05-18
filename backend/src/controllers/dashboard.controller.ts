import { Router } from "express";
import { Op } from "sequelize";
import { Asset, Employee, RepairTicket, AuditLog } from "../models";
import { ok } from "../utils/api-response";

export const dashboardRoutes = Router();

dashboardRoutes.get("/stats", async (_req, res, next) => {
  try {
    const [totalAssets, assignedAssets, availableAssets, inRepair, damaged, lost, employees, pendingRepairs, recentActivities] = await Promise.all([
      Asset.count(), Asset.count({ where: { status: "Assigned" } }), Asset.count({ where: { status: "Available" } }), Asset.count({ where: { status: "In Repair" } }), Asset.count({ where: { status: "Damaged" } }), Asset.count({ where: { status: "Lost" } }), Employee.count({ where: { status: "Active" } }), RepairTicket.count({ where: { status: { [Op.notIn]: ["Returned", "Cancelled"] } } }), AuditLog.findAll({ order: [["createdAt", "DESC"]], limit: 10 })
    ]);
    const sums = await Asset.findAll({ attributes: [[Asset.sequelize!.fn("sum", Asset.sequelize!.col("purchase_price")), "purchaseValue"], [Asset.sequelize!.fn("sum", Asset.sequelize!.col("current_value")), "currentValue"]], raw: true }) as any[];
    ok(res, "Dashboard stats fetched", { totalAssets, assignedAssets, availableAssets, inRepair, damaged, lost, employees, pendingRepairs, purchaseValue: Number(sums[0]?.purchaseValue || 0), currentValue: Number(sums[0]?.currentValue || 0), recentActivities });
  }
  catch (error) {
    next(error);
  }
});
