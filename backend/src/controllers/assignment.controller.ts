import { addListQuery } from "../utils/list-query";
import { Op } from "sequelize";
import { Router } from "express";
import { pdfMoney, sendPdfReport } from "../utils/pdf-report";
import { z } from "zod";
import { Asset, AssetAssignment, Company, Employee } from "../models";
import { created, ok } from "../utils/api-response";
import { ApiError } from "../utils/errors";
import { getPagination, getPagingMeta } from "../utils/pagination";
import { writeAudit } from "../services/audit.service";

export const assignmentRoutes = Router();
const createSchema = z.object({
  companyId: z.string().uuid().optional().nullable(),
  employeeId: z.string().uuid(),
  assetIds: z.array(z.string().uuid()).min(1),
  conditionAtAssign: z.string().default("Good"),
  notes: z.string().optional().nullable(),
});
const updateSchema = z.object({
  conditionAtAssign: z.string().optional(),
  notes: z.string().optional().nullable(),
});

async function assignmentWithDetails(id: string) {
  return AssetAssignment.findByPk(id, {
    include: [
      { model: Asset, include: [{ model: Company, as: "company" }] },
      Employee,
    ],
  });
}

assignmentRoutes.get("/", async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const where: any = {};
    if (req.query.returnState === "open") where.returnedAt = null;
    if (req.query.returnState === "returned") where.returnedAt = { [Op.not]: null };
    addListQuery(where, req, { search: ["$Asset.assetCode$", "$Asset.name$", "$Employee.employeeCode$", "$Employee.name$"], exact: ["conditionAtAssign"], date: "assignedAt", dateOnly: false });
    const include: any[] = [{ model: Asset, include: [{ model: Company, as: "company" }] }, Employee];
    if (req.query.companyId) {
      include[0].where = { companyId: req.query.companyId };
      include[0].required = true;
    }
    const { rows, count } = await AssetAssignment.findAndCountAll({
      where,
      subQuery: false,
      include,
      distinct: true,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    ok(res, "Assignments fetched successfully", rows, getPagingMeta(count, page, limit));
  }
  catch (e) {
    next(e);
  }
});

assignmentRoutes.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const employee = await Employee.findByPk(body.employeeId);
    if (!employee)
      throw new ApiError(404, "Employee not found");
    const result = [];
    for (const assetId of body.assetIds) {
      const asset = await Asset.findByPk(assetId);
      if (!asset)
        throw new ApiError(404, `Asset not found: ${assetId}`);
      if (body.companyId && asset.companyId !== body.companyId)
        throw new ApiError(400, `${asset.assetCode} does not belong to selected company`);
      if (asset.status === "Assigned")
        throw new ApiError(409, `${asset.assetCode} is already assigned`);
      const assignment = await AssetAssignment.create({
        assetId,
        employeeId: body.employeeId,
        assignedById: req.user!.id,
        conditionAtAssign: body.conditionAtAssign,
        notes: body.notes,
      } as any);
      await asset.update({
        status: "Assigned",
        assignedEmployeeId: body.employeeId,
        condition: body.conditionAtAssign,
      });
      result.push(assignment);
    }
    await writeAudit(req, {
      action: "Assigned",
      module: "Assignments",
      recordId: body.employeeId,
      afterSnapshot: { employeeId: body.employeeId, assetIds: body.assetIds },
    });
    created(res, "Assets assigned successfully", result);
  }
  catch (e) {
    next(e);
  }
});

assignmentRoutes.get("/:id", async (req, res, next) => {
  try {
    const item = await assignmentWithDetails(req.params.id);
    if (!item)
      throw new ApiError(404, "Assignment not found");
    ok(res, "Assignment fetched successfully", item);
  }
  catch (e) {
    next(e);
  }
});

assignmentRoutes.patch("/:id", async (req, res, next) => {
  try {
    const item = await AssetAssignment.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Assignment not found");
    const before = item.toJSON();
    await item.update(updateSchema.parse(req.body));
    await writeAudit(req, {
      action: "Updated",
      module: "Assignments",
      recordId: item.id,
      beforeSnapshot: before,
      afterSnapshot: item.toJSON(),
    });
    ok(res, "Assignment updated successfully", item);
  }
  catch (e) {
    next(e);
  }
});

assignmentRoutes.delete("/:id", async (req, res, next) => {
  try {
    const item = await AssetAssignment.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Assignment not found");
    const before = item.toJSON();
    if (!item.returnedAt) {
      await Asset.update({ status: "Available", assignedEmployeeId: null }, { where: { id: item.assetId } });
    }
    await item.destroy();
    await writeAudit(req, {
      action: "Deleted",
      module: "Assignments",
      recordId: req.params.id,
      beforeSnapshot: before,
    });
    ok(res, "Assignment deleted successfully");
  }
  catch (e) {
    next(e);
  }
});

assignmentRoutes.get("/:id/pdf", async (req, res, next) => {
  try {
    const item: any = await assignmentWithDetails(req.params.id);
    if (!item) throw new ApiError(404, "Assignment not found");
    const asset = item.Asset || {};
    const employee = item.Employee || {};
    sendPdfReport(res, {
      title: "Asset Handover Certificate", filename: `assignment-${item.id}.pdf`,
      subtitle: "Asset custody / employee handover record",
      details: [
        ["Assignment Reference", item.id], ["Company", asset.company?.name],
        ["Assigned At", item.assignedAt], ["Returned At", item.returnedAt],
        ["Employee", `${employee.employeeCode || ""} - ${employee.name || ""}`], ["Condition At Handover", item.conditionAtAssign],
        ["Asset Code", asset.assetCode], ["Asset Name", asset.name],
        ["Serial Number", asset.serialNumber], ["Notes", item.notes],
      ],
      sections: [],
    });
  } catch (error) { next(error); }
});
