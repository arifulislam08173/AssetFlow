import { Router } from "express";
import { Op } from "sequelize";
import QRCode from "qrcode";
import { z } from "zod";
import { Asset, AssetAssignment, AssetCategory, AssetReturn, Company, Employee, Location, Vendor } from "../../models";
import { created, ok } from "../../utils/api-response";
import { ApiError } from "../../utils/errors";
import { getPagination, getPagingMeta } from "../../utils/pagination";
import { calculateStraightLineValue } from "../../utils/depreciation";
import { writeAudit } from "../audit-logs/audit.service";

export const assetRoutes = Router();

const assetSchema = z.object({
  companyId: z.string().uuid().optional().nullable(), assetCode: z.string().min(2), name: z.string().min(2), categoryId: z.string().uuid(), brand: z.string().optional(), model: z.string().optional(), serialNumber: z.string().min(2), assetTag: z.string().optional(), purchaseDate: z.string(), purchasePrice: z.number().nonnegative(), salvageValue: z.number().nonnegative().optional(), usefulLifeYears: z.number().int().positive().optional(), depreciationMethod: z.string().optional(), vendorId: z.string().uuid().optional().nullable(), locationId: z.string().uuid(), condition: z.string().optional(), status: z.string().optional(), warrantyExpiry: z.string().optional().nullable(), notes: z.string().optional().nullable()
});

assetRoutes.get("/", async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const search = String(req.query.search || "").trim();
    const where: any = {};
    if (search) where[Op.or] = [{ assetCode: { [Op.iLike]: `%${search}%` } }, { name: { [Op.iLike]: `%${search}%` } }, { serialNumber: { [Op.iLike]: `%${search}%` } }, { brand: { [Op.iLike]: `%${search}%` } }, { model: { [Op.iLike]: `%${search}%` } }];
    if (req.query.status) where.status = req.query.status;
    if (req.query.categoryId) where.categoryId = req.query.categoryId;
    if (req.query.companyId) where.companyId = req.query.companyId;
    const { rows, count } = await Asset.findAndCountAll({ where, include: [{ model: AssetCategory, as: "category" }, { model: Company, as: "company" }, { model: Vendor, as: "vendor" }, { model: Location, as: "location" }, { model: Employee, as: "assignedEmployee" }], order: [[String(req.query.sortBy || "createdAt"), String(req.query.sortOrder || "DESC")]], limit, offset });
    ok(res, "Assets fetched successfully", rows, getPagingMeta(count, page, limit));
  } catch (error) { next(error); }
});

assetRoutes.get("/template", (_req, res) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=assetflow-assets-template.csv");
  res.send("companyId,assetCode,name,categoryId,brand,model,serialNumber,assetTag,purchaseDate,purchasePrice,salvageValue,usefulLifeYears,depreciationMethod,vendorId,locationId,condition,status,warrantyExpiry,notes\n,LAP-0001,Dell Latitude 5420,,Dell,Latitude 5420,SN-001,LAP-0001,2026-01-01,80000,0,5,Straight Line,, ,New,Available,2029-01-01,Demo row\n");
});

assetRoutes.post("/bulk", async (req, res, next) => {
  try {
    const body = z.object({ assets: z.array(assetSchema).min(1) }).parse(req.body);
    const createdAssets = [];
    for (const data of body.assets) {
      const currentValue = calculateStraightLineValue({ purchasePrice: data.purchasePrice, salvageValue: data.salvageValue || 0, usefulLifeYears: data.usefulLifeYears || 5, purchaseDate: data.purchaseDate });
      createdAssets.push(await Asset.create({ ...data, currentValue } as any));
    }
    await writeAudit(req, { action: "Bulk Created", module: "Assets", recordId: "bulk", afterSnapshot: { count: createdAssets.length } });
    created(res, "Assets bulk created successfully", createdAssets);
  } catch (error) { next(error); }
});

assetRoutes.post("/", async (req, res, next) => {
  try {
    const data = assetSchema.parse(req.body);
    const currentValue = calculateStraightLineValue({ purchasePrice: data.purchasePrice, salvageValue: data.salvageValue || 0, usefulLifeYears: data.usefulLifeYears || 5, purchaseDate: data.purchaseDate });
    const asset = await Asset.create({ ...data, currentValue } as any);
    await writeAudit(req, { action: "Created", module: "Assets", recordId: asset.id, afterSnapshot: asset.toJSON() });
    created(res, "Asset created successfully", asset);
  } catch (error) { next(error); }
});

assetRoutes.get("/:id", async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id, { include: [{ model: AssetCategory, as: "category" }, { model: Company, as: "company" }, { model: Vendor, as: "vendor" }, { model: Location, as: "location" }, { model: Employee, as: "assignedEmployee" }, AssetAssignment, AssetReturn] });
    if (!asset) throw new ApiError(404, "Asset not found");
    ok(res, "Asset fetched successfully", asset);
  } catch (error) { next(error); }
});

assetRoutes.patch("/:id", async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) throw new ApiError(404, "Asset not found");
    const before = asset.toJSON();
    await asset.update(req.body);
    await writeAudit(req, { action: "Updated", module: "Assets", recordId: asset.id, beforeSnapshot: before, afterSnapshot: asset.toJSON() });
    ok(res, "Asset updated successfully", asset);
  } catch (error) { next(error); }
});

assetRoutes.delete("/:id", async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) throw new ApiError(404, "Asset not found");
    const before = asset.toJSON();
    await asset.destroy();
    await writeAudit(req, { action: "Deleted", module: "Assets", recordId: req.params.id, beforeSnapshot: before });
    ok(res, "Asset deleted successfully");
  } catch (error) { next(error); }
});

assetRoutes.post("/:id/assign", async (req, res, next) => {
  try {
    const body = z.object({ employeeId: z.string().uuid(), conditionAtAssign: z.string().default("Good"), notes: z.string().optional() }).parse(req.body);
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) throw new ApiError(404, "Asset not found");
    if (asset.status === "Assigned") throw new ApiError(409, "Asset is already assigned");
    const assignment = await AssetAssignment.create({ assetId: asset.id, employeeId: body.employeeId, assignedById: req.user!.id, conditionAtAssign: body.conditionAtAssign, notes: body.notes } as any);
    await asset.update({ status: "Assigned", assignedEmployeeId: body.employeeId, condition: body.conditionAtAssign });
    await writeAudit(req, { action: "Assigned", module: "Assets", recordId: asset.id, afterSnapshot: { assignment, asset } });
    created(res, "Asset assigned successfully", assignment);
  } catch (error) { next(error); }
});

assetRoutes.post("/:id/return", async (req, res, next) => {
  try {
    const body = z.object({ assignmentId: z.string().uuid(), returnStatus: z.string().default("Returned"), returnCondition: z.string().default("Good"), penaltyAmount: z.number().default(0), notes: z.string().optional() }).parse(req.body);
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) throw new ApiError(404, "Asset not found");
    const assignment = await AssetAssignment.findByPk(body.assignmentId);
    if (!assignment) throw new ApiError(404, "Assignment not found");
    const returnRecord = await AssetReturn.create({ assignmentId: assignment.id, assetId: asset.id, employeeId: assignment.employeeId, receivedById: req.user!.id, returnStatus: body.returnStatus, returnCondition: body.returnCondition, penaltyAmount: body.penaltyAmount, notes: body.notes } as any);
    await assignment.update({ returnedAt: new Date() });
    await asset.update({ status: body.returnStatus === "Lost" ? "Lost" : "Available", assignedEmployeeId: null, condition: body.returnCondition });
    await writeAudit(req, { action: "Returned", module: "Assets", recordId: asset.id, afterSnapshot: { returnRecord, asset } });
    created(res, "Asset returned successfully", returnRecord);
  } catch (error) { next(error); }
});

assetRoutes.get("/:id/qr", async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) throw new ApiError(404, "Asset not found");
    const qr = await QRCode.toDataURL(JSON.stringify({ assetId: asset.id, assetCode: asset.assetCode, serialNumber: asset.serialNumber }));
    ok(res, "QR code generated", { qr });
  } catch (error) { next(error); }
});
