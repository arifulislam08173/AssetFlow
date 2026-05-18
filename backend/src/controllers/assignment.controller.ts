import { Router } from "express";
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

function reportHtml(title: string, body: string) {
  return `<!doctype html><html><head><title>${title}</title><style>
  body{font-family:Arial,sans-serif;padding:32px;color:#0f172a;background:#fff}
  .brand{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #0f766e;padding-bottom:14px;margin-bottom:22px}
  h1{margin:0;color:#0f766e}.meta{color:#64748b;font-size:12px}.card{border:1px solid #cbd5e1;border-radius:14px;padding:18px;margin:16px 0}
  table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border:1px solid #cbd5e1;padding:9px;font-size:12px;text-align:left}th{background:#f0fdfa}
  @media print{button{display:none}}
 </style></head><body><div class="brand"><div><h1>AssetFlow</h1><div class="meta">Enterprise Asset Management</div></div><div class="meta">Generated ${new Date().toLocaleString()}</div></div><h2>${title}</h2>${body}<script>window.print()</script></body></html>`;
}

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
    const include: any[] = [{ model: Asset, include: [{ model: Company, as: "company" }] }, Employee];
    if (req.query.companyId)
      include[0].where = { companyId: req.query.companyId };
    const { rows, count } = await AssetAssignment.findAndCountAll({
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
    if (!item)
      throw new ApiError(404, "Assignment not found");
    const asset = item.Asset || {};
    const employee = item.Employee || {};
    const body = `<div class="card"><strong>Assignment ID:</strong> ${item.id}<br/><strong>Company:</strong> ${asset.company?.name || "-"}<br/><strong>Assigned At:</strong> ${item.assignedAt ? new Date(item.assignedAt).toLocaleString() : "-"}</div>
   <table><tr><th>Asset Code</th><th>Asset</th><th>Serial</th><th>Employee</th><th>Condition</th><th>Notes</th></tr>
   <tr><td>${asset.assetCode || ""}</td><td>${asset.name || ""}</td><td>${asset.serialNumber || ""}</td><td>${employee.employeeCode || ""} - ${employee.name || ""}</td><td>${item.conditionAtAssign || ""}</td><td>${item.notes || ""}</td></tr></table>`;
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `inline; filename=assignment-${item.id}.html`);
    res.send(reportHtml("Asset Handover / Assignment Report", body));
  }
  catch (e) {
    next(e);
  }
});
