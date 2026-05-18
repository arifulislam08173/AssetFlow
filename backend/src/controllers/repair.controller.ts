import { Router } from "express";
import { z } from "zod";
import { Asset, RepairTicket, Vendor } from "../models";
import { created, ok } from "../utils/api-response";
import { ApiError } from "../utils/errors";
import { getPagination, getPagingMeta } from "../utils/pagination";
import { writeAudit } from "../services/audit.service";

export const repairRoutes = Router();
const schema = z.object({
  ticketCode: z.string().min(2),
  assetId: z.string().uuid(),
  problem: z.string().min(2),
  repairVendorId: z.string().uuid().optional().nullable(),
  repairCost: z.number().nonnegative().default(0),
  status: z.string().default("Open"),
});

function reportHtml(title: string, body: string) {
  return `<!doctype html><html><head><title>${title}</title><style>
  body{font-family:Arial,sans-serif;padding:32px;color:#0f172a;background:#fff}.brand{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #0f766e;padding-bottom:14px;margin-bottom:22px}h1{margin:0;color:#0f766e}.meta{color:#64748b;font-size:12px}.card{border:1px solid #cbd5e1;border-radius:14px;padding:18px;margin:16px 0}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border:1px solid #cbd5e1;padding:9px;font-size:12px;text-align:left}th{background:#f0fdfa}@media print{button{display:none}}
 </style></head><body><div class="brand"><div><h1>AssetFlow</h1><div class="meta">Enterprise Asset Management</div></div><div class="meta">Generated ${new Date().toLocaleString()}</div></div><h2>${title}</h2>${body}<script>window.print()</script></body></html>`;
}

async function repairWithDetails(id: string) {
  return RepairTicket.findByPk(id, { include: [Asset, Vendor] });
}

repairRoutes.get("/", async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const include: any[] = [Asset, Vendor];
    if (req.query.companyId)
      include[0].where = { companyId: req.query.companyId };
    const { rows, count } = await RepairTicket.findAndCountAll({
      include,
      distinct: true,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    ok(res, "Repair tickets fetched successfully", rows, getPagingMeta(count, page, limit));
  }
  catch (e) {
    next(e);
  }
});

repairRoutes.post("/", async (req, res, next) => {
  try {
    const body = schema.parse(req.body);
    const ticket = await RepairTicket.create(body as any);
    await Asset.update({ status: "In Repair" }, { where: { id: ticket.assetId } });
    await writeAudit(req, {
      action: "Created",
      module: "Repairs",
      recordId: ticket.id,
      afterSnapshot: ticket.toJSON(),
    });
    created(res, "Repair ticket created successfully", ticket);
  }
  catch (e) {
    next(e);
  }
});

repairRoutes.get("/:id", async (req, res, next) => {
  try {
    const item = await repairWithDetails(req.params.id);
    if (!item)
      throw new ApiError(404, "Repair ticket not found");
    ok(res, "Repair ticket fetched successfully", item);
  }
  catch (e) {
    next(e);
  }
});

repairRoutes.patch("/:id", async (req, res, next) => {
  try {
    const item = await RepairTicket.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Repair ticket not found");
    const before = item.toJSON();
    const body = schema.partial().parse(req.body);
    await item.update(body);
    if (body.status && ["Completed", "Returned", "Cancelled"].includes(body.status)) {
      await Asset.update({ status: "Available" }, { where: { id: item.assetId } });
    }
    else if (body.status) {
      await Asset.update({ status: "In Repair" }, { where: { id: item.assetId } });
    }
    await writeAudit(req, {
      action: "Updated",
      module: "Repairs",
      recordId: item.id,
      beforeSnapshot: before,
      afterSnapshot: item.toJSON(),
    });
    ok(res, "Repair ticket updated successfully", item);
  }
  catch (e) {
    next(e);
  }
});

repairRoutes.delete("/:id", async (req, res, next) => {
  try {
    const item = await RepairTicket.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Repair ticket not found");
    const before = item.toJSON();
    await item.destroy();
    await writeAudit(req, {
      action: "Deleted",
      module: "Repairs",
      recordId: req.params.id,
      beforeSnapshot: before,
    });
    ok(res, "Repair ticket deleted successfully");
  }
  catch (e) {
    next(e);
  }
});

repairRoutes.get("/:id/pdf", async (req, res, next) => {
  try {
    const item: any = await repairWithDetails(req.params.id);
    if (!item)
      throw new ApiError(404, "Repair ticket not found");
    const asset = item.Asset || {};
    const vendor = item.Vendor || {};
    const body = `<div class="card"><strong>Ticket:</strong> ${item.ticketCode}<br/><strong>Status:</strong> ${item.status}<br/><strong>Cost:</strong> ${item.repairCost || 0}</div>
   <table><tr><th>Asset Code</th><th>Asset</th><th>Serial</th><th>Vendor</th><th>Problem / Upgrade</th></tr>
   <tr><td>${asset.assetCode || ""}</td><td>${asset.name || ""}</td><td>${asset.serialNumber || ""}</td><td>${vendor.name || ""}</td><td>${item.problem || ""}</td></tr></table>`;
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `inline; filename=repair-${item.id}.html`);
    res.send(reportHtml("Repair / Upgrade Report", body));
  }
  catch (e) {
    next(e);
  }
});
