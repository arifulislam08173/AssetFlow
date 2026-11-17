import { addListQuery } from "../utils/list-query";
import { Router } from "express";
import { pdfMoney, sendPdfReport } from "../utils/pdf-report";
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

function includeDetails() { return [{ model: Company, as: "company" }, Vendor, PurchaseItem]; }

purchaseRoutes.get("/", async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const where: any = {};
    addListQuery(where, req, { search: ["invoiceNumber", "paymentStatus"], exact: ["companyId", "vendorId", "paymentStatus"], date: "purchaseDate", dateOnly: true });
    const { rows, count } = await Purchase.findAndCountAll({ where, include: includeDetails(), order: [[(String(req.query.sortBy || "createdAt").match(/^(createdAt|name|purchaseDate|assetCode|invoiceNumber)$/) ? String(req.query.sortBy || "createdAt") : "createdAt"), (String(req.query.sortOrder || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC")]], limit, offset });
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
    if (!item) throw new ApiError(404, "Purchase not found");
    sendPdfReport(res, {
      title: "Purchase Record", filename: `purchase-${item.invoiceNumber}.pdf`,
      subtitle: "Purchase order / invoice registration overview",
      details: [
        ["Invoice Number", item.invoiceNumber], ["Company", item.company?.name],
        ["Vendor", item.Vendor?.name], ["Purchase Date", item.purchaseDate],
        ["Total Amount", pdfMoney(item.totalAmount)], ["Payment Status", item.paymentStatus],
      ],
      sections: [{ title: "PURCHASE LINE ITEMS", columns: [
        { title: "Product / Item", weight: 3 }, { title: "Quantity", weight: 1, align: "right" },
        { title: "Unit Price", weight: 1.2, align: "right" }, { title: "Line Total", weight: 1.3, align: "right" },
      ], rows: (item.PurchaseItems || []).map((x: any) => [x.productName, x.quantity, pdfMoney(x.unitPrice), pdfMoney(Number(x.quantity || 0) * Number(x.unitPrice || 0))]) }],
    });
  } catch (error) { next(error); }
});
