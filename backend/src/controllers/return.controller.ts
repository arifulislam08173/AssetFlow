import { Router } from "express";
import { z } from "zod";
import { Asset, AssetAssignment, AssetReturn, Company, Employee } from "../models";
import { created, ok } from "../utils/api-response";
import { ApiError } from "../utils/errors";
import { getPagination, getPagingMeta } from "../utils/pagination";
import { writeAudit } from "../services/audit.service";

export const returnRoutes = Router();
const schema = z.object({
  companyId: z.string().uuid().optional().nullable(),
  employeeId: z.string().uuid(),
  items: z.array(z.object({
    assetId: z.string().uuid(),
    assignmentId: z.string().uuid().optional(),
    returnStatus: z.string().default("Returned"),
    returnCondition: z.string().default("Good"),
    penaltyAmount: z.number().default(0),
    notes: z.string().optional().nullable(),
  })).min(1),
});
const updateSchema = z.object({
  returnStatus: z.string().optional(),
  returnCondition: z.string().optional(),
  penaltyAmount: z.number().optional(),
  notes: z.string().optional().nullable(),
});

function reportHtml(title: string, body: string) {
  return `<!doctype html><html><head><title>${title}</title><style>
  body{font-family:Arial,sans-serif;padding:32px;color:#0f172a;background:#fff}.brand{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #0f766e;padding-bottom:14px;margin-bottom:22px}h1{margin:0;color:#0f766e}.meta{color:#64748b;font-size:12px}.card{border:1px solid #cbd5e1;border-radius:14px;padding:18px;margin:16px 0}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border:1px solid #cbd5e1;padding:9px;font-size:12px;text-align:left}th{background:#f0fdfa}@media print{button{display:none}}
 </style></head><body><div class="brand"><div><h1>AssetFlow</h1><div class="meta">Enterprise Asset Management</div></div><div class="meta">Generated ${new Date().toLocaleString()}</div></div><h2>${title}</h2>${body}<script>window.print()</script></body></html>`;
}

async function returnWithDetails(id: string) {
  return AssetReturn.findByPk(id, {
    include: [
      { model: Asset, include: [{ model: Company, as: "company" }] },
      Employee,
      AssetAssignment,
    ],
  });
}

returnRoutes.get("/", async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const include: any[] = [{ model: Asset, include: [{ model: Company, as: "company" }] }, Employee];
    if (req.query.companyId)
      include[0].where = { companyId: req.query.companyId };
    const { rows, count } = await AssetReturn.findAndCountAll({
      include,
      distinct: true,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    ok(res, "Returns fetched successfully", rows, getPagingMeta(count, page, limit));
  }
  catch (e) {
    next(e);
  }
});

returnRoutes.get("/employee/:employeeId/open", async (req, res, next) => {
  try {
    const data = await AssetAssignment.findAll({
      where: { employeeId: req.params.employeeId, returnedAt: null },
      include: [{ model: Asset, where: req.query.companyId ? { companyId: req.query.companyId } : undefined }, Employee],
      order: [["createdAt", "DESC"]],
    });
    ok(res, "Open assigned assets fetched", data);
  }
  catch (e) {
    next(e);
  }
});

returnRoutes.post("/", async (req, res, next) => {
  try {
    const body = schema.parse(req.body);
    const employee = await Employee.findByPk(body.employeeId);
    if (!employee)
      throw new ApiError(404, "Employee not found");
    const createdItems = [];
    for (const item of body.items) {
      const assignment = item.assignmentId
        ? await AssetAssignment.findByPk(item.assignmentId)
        : await AssetAssignment.findOne({ where: { assetId: item.assetId, employeeId: body.employeeId, returnedAt: null } });
      if (!assignment)
        throw new ApiError(404, "Active assignment not found for return");
      const asset = await Asset.findByPk(item.assetId);
      if (!asset)
        throw new ApiError(404, "Asset not found");
      const ret = await AssetReturn.create({
        assignmentId: assignment.id,
        assetId: item.assetId,
        employeeId: body.employeeId,
        receivedById: req.user!.id,
        returnStatus: item.returnStatus,
        returnCondition: item.returnCondition,
        penaltyAmount: item.penaltyAmount,
        notes: item.notes,
      } as any);
      await assignment.update({ returnedAt: new Date() });
      await asset.update({
        status: item.returnStatus === "Lost" ? "Lost" : item.returnCondition === "Damaged" ? "Damaged" : "Available",
        assignedEmployeeId: null,
        condition: item.returnCondition,
      });
      createdItems.push(ret);
    }
    const openCount = await AssetAssignment.count({ where: { employeeId: body.employeeId, returnedAt: null } });
    await employee.update({ clearanceStatus: openCount ? "Pending Items" : "Cleared" });
    await writeAudit(req, {
      action: "Returned",
      module: "Returns",
      recordId: body.employeeId,
      afterSnapshot: { items: body.items, clearanceStatus: openCount ? "Pending Items" : "Cleared" },
    });
    created(res, "Assets returned successfully", createdItems);
  }
  catch (e) {
    next(e);
  }
});

returnRoutes.get("/:id", async (req, res, next) => {
  try {
    const item = await returnWithDetails(req.params.id);
    if (!item)
      throw new ApiError(404, "Return record not found");
    ok(res, "Return fetched successfully", item);
  }
  catch (e) {
    next(e);
  }
});

returnRoutes.patch("/:id", async (req, res, next) => {
  try {
    const item = await AssetReturn.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Return record not found");
    const before = item.toJSON();
    await item.update(updateSchema.parse(req.body));
    const asset = await Asset.findByPk(item.assetId);
    if (asset) {
      await asset.update({
        status: item.returnStatus === "Lost" ? "Lost" : item.returnCondition === "Damaged" ? "Damaged" : "Available",
        condition: item.returnCondition,
      });
    }
    await writeAudit(req, {
      action: "Updated",
      module: "Returns",
      recordId: item.id,
      beforeSnapshot: before,
      afterSnapshot: item.toJSON(),
    });
    ok(res, "Return updated successfully", item);
  }
  catch (e) {
    next(e);
  }
});

returnRoutes.delete("/:id", async (req, res, next) => {
  try {
    const item = await AssetReturn.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Return record not found");
    const before = item.toJSON();
    await item.destroy();
    await writeAudit(req, {
      action: "Deleted",
      module: "Returns",
      recordId: req.params.id,
      beforeSnapshot: before,
    });
    ok(res, "Return deleted successfully");
  }
  catch (e) {
    next(e);
  }
});

returnRoutes.get("/:id/pdf", async (req, res, next) => {
  try {
    const item: any = await returnWithDetails(req.params.id);
    if (!item)
      throw new ApiError(404, "Return record not found");
    const asset = item.Asset || {};
    const employee = item.Employee || {};
    const body = `<div class="card"><strong>Return ID:</strong> ${item.id}<br/><strong>Company:</strong> ${asset.company?.name || "-"}<br/><strong>Status:</strong> ${item.returnStatus}<br/><strong>Penalty:</strong> ${item.penaltyAmount || 0}</div>
   <table><tr><th>Asset Code</th><th>Asset</th><th>Serial</th><th>Employee</th><th>Return Condition</th><th>Notes</th></tr>
   <tr><td>${asset.assetCode || ""}</td><td>${asset.name || ""}</td><td>${asset.serialNumber || ""}</td><td>${employee.employeeCode || ""} - ${employee.name || ""}</td><td>${item.returnCondition || ""}</td><td>${item.notes || ""}</td></tr></table>`;
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `inline; filename=return-${item.id}.html`);
    res.send(reportHtml("Asset Return / Clearance Report", body));
  }
  catch (e) {
    next(e);
  }
});
