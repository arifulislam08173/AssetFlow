import { Router } from "express";
import { Op } from "sequelize";
import { z } from "zod";
import { Company } from "../models";
import { created, ok } from "../utils/api-response";
import { ApiError } from "../utils/errors";
import { getPagination, getPagingMeta } from "../utils/pagination";
import { writeAudit } from "../services/audit.service";

export const companyRoutes = Router();
const schema = z.object({ name: z.string().min(2), code: z.string().min(2), contactPerson: z.string().optional().nullable(), email: z.string().email().optional().nullable().or(z.literal("")), phone: z.string().optional().nullable(), address: z.string().optional().nullable(), website: z.string().optional().nullable(), industry: z.string().optional().nullable(), status: z.string().optional() });

companyRoutes.get("/", async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const search = String(req.query.search || "").trim();
    const where: any = {};
    if (search)
      where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { code: { [Op.iLike]: `%${search}%` } }, { email: { [Op.iLike]: `%${search}%` } }];
    const { rows, count } = await Company.findAndCountAll({ where, order: [[String(req.query.sortBy || "createdAt"), String(req.query.sortOrder || "DESC")]], limit, offset });
    ok(res, "Companies fetched successfully", rows, getPagingMeta(count, page, limit));
  }
  catch (e) {
    next(e);
  }
});

companyRoutes.post("/", async (req, res, next) => {
  try {
    const body = schema.parse(req.body);
    const item = await Company.create({ ...body, email: body.email || null } as any);
    await writeAudit(req, { action: "Created", module: "Companies", recordId: item.id, afterSnapshot: item.toJSON() });
    created(res, "Company created successfully", item);
  }
  catch (e) {
    next(e);
  }
});

companyRoutes.get("/:id", async (req, res, next) => {
  try {
    const item = await Company.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Company not found");
    ok(res, "Company fetched successfully", item);
  }
  catch (e) {
    next(e);
  }
});

companyRoutes.patch("/:id", async (req, res, next) => {
  try {
    const item = await Company.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Company not found");
    const before = item.toJSON();
    const body = schema.partial().parse(req.body);
    await item.update({ ...body, email: body.email === "" ? null : body.email });
    await writeAudit(req, { action: "Updated", module: "Companies", recordId: item.id, beforeSnapshot: before, afterSnapshot: item.toJSON() });
    ok(res, "Company updated successfully", item);
  }
  catch (e) {
    next(e);
  }
});

companyRoutes.delete("/:id", async (req, res, next) => {
  try {
    const item = await Company.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Company not found");
    const before = item.toJSON();
    await item.destroy();
    await writeAudit(req, { action: "Deleted", module: "Companies", recordId: item.id, beforeSnapshot: before });
    ok(res, "Company deleted successfully");
  }
  catch (e) {
    next(e);
  }
});
