import { Router } from "express";
import { Op } from "sequelize";
import { z } from "zod";
import { AssetCategory } from "../models";
import { created, ok } from "../utils/api-response";
import { ApiError } from "../utils/errors";
import { getPagination, getPagingMeta } from "../utils/pagination";
import { writeAudit } from "../services/audit.service";

export const categoryRoutes = Router();
const schema = z.object({
  name: z.string().min(2),
});

categoryRoutes.get("/", async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const search = String(req.query.search || "").trim();
    const where: any = {};
    if (search)
      where.name = { [Op.iLike]: `%${search}%` };
    const { rows, count } = await AssetCategory.findAndCountAll({
      where,
      order: [["name", "ASC"]],
      limit,
      offset,
    });
    ok(res, "Categories fetched successfully", rows, getPagingMeta(count, page, limit));
  }
  catch (e) {
    next(e);
  }
});

categoryRoutes.post("/", async (req, res, next) => {
  try {
    const body = schema.parse(req.body);
    const item = await AssetCategory.create({
      name: body.name,
      usefulLifeYears: 5,
      depreciationMethod: "Straight Line",
    } as any);
    await writeAudit(req, {
      action: "Created",
      module: "Categories",
      recordId: item.id,
      afterSnapshot: item.toJSON(),
    });
    created(res, "Category created successfully", item);
  }
  catch (e) {
    next(e);
  }
});

categoryRoutes.get("/template", (_req, res) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=assetflow-categories-template.csv");
  res.send("name\nLaptop\nMonitor\nMouse\nKeyboard\n");
});

categoryRoutes.get("/:id", async (req, res, next) => {
  try {
    const item = await AssetCategory.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Category not found");
    ok(res, "Category fetched successfully", item);
  }
  catch (e) {
    next(e);
  }
});

categoryRoutes.patch("/:id", async (req, res, next) => {
  try {
    const item = await AssetCategory.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Category not found");
    const before = item.toJSON();
    await item.update(schema.partial().parse(req.body));
    await writeAudit(req, {
      action: "Updated",
      module: "Categories",
      recordId: item.id,
      beforeSnapshot: before,
      afterSnapshot: item.toJSON(),
    });
    ok(res, "Category updated successfully", item);
  }
  catch (e) {
    next(e);
  }
});

categoryRoutes.delete("/:id", async (req, res, next) => {
  try {
    const item = await AssetCategory.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Category not found");
    const before = item.toJSON();
    await item.destroy();
    await writeAudit(req, {
      action: "Deleted",
      module: "Categories",
      recordId: item.id,
      beforeSnapshot: before,
    });
    ok(res, "Category deleted successfully");
  }
  catch (e) {
    next(e);
  }
});
