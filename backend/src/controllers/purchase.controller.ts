import { Router } from "express";
import { Op } from "sequelize";
import { z } from "zod";
import { Company, Purchase, PurchaseItem, Vendor } from "../models";
import { created, ok } from "../utils/api-response";
import { ApiError } from "../utils/errors";
import { getPagination, getPagingMeta } from "../utils/pagination";
import { writeAudit } from "../services/audit.service";

export const purchaseRoutes = Router();
const schema = z.object({
  companyId: z.string().uuid().optional().nullable(),
  invoiceNumber: z.string().min(2),
  vendorId: z.string().uuid(),
  purchaseDate: z.string(),
  totalAmount: z.number().nonnegative().default(0),
  paymentStatus: z.string().default("Paid"),
});

function safe(v: unknown) { return String(v ?? "-").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch] || ch)); }

function reportHtml(title: string, body: string) { return `<!doctype html><html><head><title>${safe(title)}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#0f172a}.brand{display:flex;justify-content:space-between;border-bottom:3px solid #0f766e;padding-bottom:14px;margin-bottom:22px}h1{margin:0;color:#0f766e}.meta{font-size:12px;color:#64748b}.card{border:1px solid #cbd5e1;border-radius:14px;background:#f8fafc;padding:16px;margin:14px 0}table{width:100%;border-collapse:collapse}td,th{border:1px solid #cbd5e1;padding:8px;font-size:12px;text-align:left}th{background:#f0fdfa}@media print{body{padding:0}}</style></head><body><div class="brand"><div><h1>AssetFlow</h1><div class="meta">Purchase Report</div></div><div class="meta">Generated ${new Date().toLocaleString()}</div></div><h2>${safe(title)}</h2>${body}<script>window.print()</script></body></html>`; }

function includeDetails() { return [{ model: Company, as: "company" }, Vendor, PurchaseItem]; }

purchaseRoutes.get("/", async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const search = String(req.query.search || "").trim();
    const where: any = {};
    if (req.query.companyId)
      where.companyId = req.query.companyId;
    if (search)
      where[Op.or] = [{ invoiceNumber: { [Op.iLike]: `%${search}%` } }, { paymentStatus: { [Op.iLike]: `%${search}%` } }];
    const { rows, count } = await Purchase.findAndCountAll({ where, include: includeDetails(), order: [[String(req.query.sortBy || "createdAt"), String(req.query.sortOrder || "DESC")]], limit, offset });
    ok(res, "Purchases fetched successfully", rows, getPagingMeta(count, page, limit));
  }
  catch (e) {
    next(e);
  }
});

purchaseRoutes.post("/", async (req, res, next) => {
  try {
    const body = schema.parse(req.body);
    const item = await Purchase.create(body as any);
    await writeAudit(req, { action: "Created", module: "Purchases", recordId: item.id, afterSnapshot: item.toJSON() });
    created(res, "Purchase created successfully", item);
  }
  catch (e) {
    next(e);
  }
});

purchaseRoutes.get("/:id", async (req, res, next) => {
  try {
    const item = await Purchase.findByPk(req.params.id, { include: includeDetails() });
    if (!item)
      throw new ApiError(404, "Purchase not found");
    ok(res, "Purchase fetched successfully", item);
  }
  catch (e) {
    next(e);
  }
});

purchaseRoutes.patch("/:id", async (req, res, next) => {
  try {
    const item = await Purchase.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Purchase not found");
    const before = item.toJSON();
    await item.update(schema.partial().parse(req.body));
    await writeAudit(req, { action: "Updated", module: "Purchases", recordId: item.id, beforeSnapshot: before, afterSnapshot: item.toJSON() });
    ok(res, "Purchase updated successfully", item);
  }
  catch (e) {
    next(e);
  }
});

purchaseRoutes.delete("/:id", async (req, res, next) => {
  try {
    const item = await Purchase.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Purchase not found");
    const before = item.toJSON();
    await item.destroy();
    await writeAudit(req, { action: "Deleted", module: "Purchases", recordId: item.id, beforeSnapshot: before });
    ok(res, "Purchase deleted successfully");
  }
  catch (e) {
    next(e);
  }
});

purchaseRoutes.get("/:id/pdf", async (req, res, next) => {
  try {
    const item: any = await Purchase.findByPk(req.params.id, { include: includeDetails() });
    if (!item)
      throw new ApiError(404, "Purchase not found");
    const body = `<div class="card"><strong>Company:</strong> ${safe(item.company?.name)}<br/><strong>Invoice:</strong> ${safe(item.invoiceNumber)}<br/><strong>Vendor:</strong> ${safe(item.Vendor?.name)}<br/><strong>Purchase Date:</strong> ${safe(item.purchaseDate)}<br/><strong>Total Amount:</strong> ${safe(item.totalAmount)}<br/><strong>Payment Status:</strong> ${safe(item.paymentStatus)}</div><table><tr><th>Product</th><th>Quantity</th><th>Unit Price</th></tr>${(item.PurchaseItems || []).map((x: any) => `<tr><td>${safe(x.productName)}</td><td>${safe(x.quantity)}</td><td>${safe(x.unitPrice)}</td></tr>`).join("") || `<tr><td colspan="3">No line items recorded yet.</td></tr>`}</table>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename=purchase-${item.invoiceNumber}.html`);
    res.send(reportHtml("Purchase Details", body));
  }
  catch (e) {
    next(e);
  }
});
