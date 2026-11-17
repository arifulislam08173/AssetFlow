import { addListQuery } from "../utils/list-query";
import { Router } from "express";
import { z } from "zod";
import { Company, Vendor } from "../models";
import { created, ok } from "../utils/api-response";
import { ApiError } from "../utils/errors";
import { getPagination, getPagingMeta } from "../utils/pagination";
import { writeAudit } from "../services/audit.service";

export const vendorRoutes = Router();
const schema = z.object({ companyId: z.string().uuid().optional().nullable(), name: z.string().min(2), contactPerson: z.string().optional().nullable(), phone: z.string().optional().nullable(), email: z.string().email().optional().nullable().or(z.literal("")), address: z.string().optional().nullable(), status: z.string().optional() });

vendorRoutes.get("/", async (req, res, next) => { try {
  const { page, limit, offset } = getPagination(req);
  const where: any = {};
    addListQuery(where, req, { search: ["name", "contactPerson", "phone", "email"], exact: ["companyId", "status"], date: "createdAt", dateOnly: false });
  const { rows, count } = await Vendor.findAndCountAll({ where, include: [{ model: Company, as: "company" }], order: [[(String(req.query.sortBy || "createdAt").match(/^(createdAt|name|purchaseDate|assetCode|invoiceNumber)$/) ? String(req.query.sortBy || "createdAt") : "createdAt"), (String(req.query.sortOrder || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC")]], limit, offset });
  ok(res, "Vendors fetched successfully", rows, getPagingMeta(count, page, limit));
}
catch (e) {
  next(e);
} });

vendorRoutes.post("/", async (req, res, next) => { try {
  const body = schema.parse(req.body);
  const item = await Vendor.create({ ...body, email: body.email || null } as any);
  await writeAudit(req, { action: "Created", module: "Vendors", recordId: item.id, afterSnapshot: item.toJSON() });
  created(res, "Vendor created successfully", item);
}
catch (e) {
  next(e);
} });

vendorRoutes.get("/:id", async (req, res, next) => { try {
  const item = await Vendor.findByPk(req.params.id, { include: [{ model: Company, as: "company" }] });
  if (!item)
    throw new ApiError(404, "Vendor not found");
  ok(res, "Vendor fetched successfully", item);
}
catch (e) {
  next(e);
} });

vendorRoutes.patch("/:id", async (req, res, next) => { try {
  const item = await Vendor.findByPk(req.params.id);
  if (!item)
    throw new ApiError(404, "Vendor not found");
  const before = item.toJSON();
  const body = schema.partial().parse(req.body);
  await item.update({ ...body, email: body.email === "" ? null : body.email });
  await writeAudit(req, { action: "Updated", module: "Vendors", recordId: item.id, beforeSnapshot: before, afterSnapshot: item.toJSON() });
  ok(res, "Vendor updated successfully", item);
}
catch (e) {
  next(e);
} });

vendorRoutes.delete("/:id", async (req, res, next) => { try {
  const item = await Vendor.findByPk(req.params.id);
  if (!item)
    throw new ApiError(404, "Vendor not found");
  const before = item.toJSON();
  await item.destroy();
  await writeAudit(req, { action: "Deleted", module: "Vendors", recordId: req.params.id, beforeSnapshot: before });
  ok(res, "Vendor deleted successfully");
}
catch (e) {
  next(e);
} });
