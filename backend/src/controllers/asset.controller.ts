import { Router } from "express";
import { Op } from "sequelize";
import QRCode from "qrcode";
import { z } from "zod";
import { Asset, AssetAssignment, AssetCategory, AssetReturn, Company, Employee, Location, Vendor } from "../models";
import { created, ok } from "../utils/api-response";
import { ApiError } from "../utils/errors";
import { getPagination, getPagingMeta } from "../utils/pagination";
import { calculateStraightLineValue } from "../utils/depreciation";
import { writeAudit } from "../services/audit.service";
import { calculateAutoSalvageValue } from "../services/asset-calculation.service";

export const assetRoutes = Router();
const TEMPLATE_HEADERS = [
  "companyCode",
  "assetCode",
  "name",
  "categoryName",
  "brand",
  "model",
  "serialNumber",
  "assetTag",
  "purchaseDate",
  "purchasePrice",
  "usefulLifeYears",
  "depreciationMethod",
  "warrantyExpiry",
  "condition",
  "status",
  "vendorName",
  "locationName",
  "notes",
];
const toNumber = z.preprocess((value) => (value === "" || value === null || value === undefined ? undefined : Number(value)), z.number());
const requiredText = (label: string, min = 1) => z.string().trim().min(min, `${label} is required`);
const requiredDate = (label: string) => requiredText(label).refine((value) => !Number.isNaN(Date.parse(value)), `${label} must be a valid date`);
const requiredUuid = (label: string) => z.string().uuid(`${label} is required`);
const assetSchema = z.object({
  companyId: requiredUuid("Company"),
  assetCode: requiredText("Asset code", 2),
  name: requiredText("Asset name", 2),
  categoryId: requiredUuid("Category"),
  brand: requiredText("Brand"),
  model: requiredText("Model"),
  serialNumber: requiredText("Serial number", 2),
  assetTag: requiredText("Asset tag"),
  purchaseDate: requiredDate("Purchase date"),
  purchasePrice: toNumber.refine((value) => value >= 0, "Purchase price must be zero or greater"),
  salvageValue: toNumber.refine((value) => value >= 0, "Salvage value must be zero or greater").optional(),
  usefulLifeYears: toNumber.refine((value) => Number.isInteger(value) && value > 0, "Useful life years must be a positive whole number"),
  depreciationMethod: requiredText("Depreciation method"),
  vendorId: requiredUuid("Vendor"),
  locationId: requiredUuid("Location"),
  condition: requiredText("Condition"),
  status: requiredText("Status"),
  warrantyExpiry: requiredDate("Warranty expiry"),
  notes: z.string().optional().nullable(),
});
type ImportRow = Record<string, string>;

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsv(csv: string): ImportRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      }
      else if (char === '"')
        quoted = false;
      else
        cell += char;
      continue;
    }
    if (char === '"')
      quoted = true;
    else if (char === ",") {
      row.push(cell.trim());
      cell = "";
    }
    else if (char === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    }
    else if (char !== "\r")
      cell += char;
  }
  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  if (!rows.length)
    return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some(Boolean)).map((r) => Object.fromEntries(headers.map((h, idx) => [h, r[idx] || ""])));
}

function normalizeImportText(value: unknown) {
  return String(value ?? "").trim();
}

function parseImportDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()))
    return value;
  return parsed.toISOString().slice(0, 10);
}

async function findCompanyByCode(code: string) {
  return Company.findOne({ where: { code: { [Op.iLike]: normalizeImportText(code) } } as any });
}

async function findCategoryByName(name: string) {
  return AssetCategory.findOne({ where: { name: { [Op.iLike]: normalizeImportText(name) } } as any });
}

async function findOrCreateVendorByName(name: string, companyId: string) {
  const cleanName = normalizeImportText(name);
  const existing = await Vendor.findOne({ where: { name: { [Op.iLike]: cleanName } } as any });
  if (existing)
    return existing;
  return Vendor.create({ name: cleanName, companyId, status: "Active" } as any);
}

async function findOrCreateLocationByName(name: string) {
  const cleanName = normalizeImportText(name);
  const existing = await Location.findOne({ where: { name: { [Op.iLike]: cleanName } } as any });
  if (existing)
    return existing;
  return Location.create({ name: cleanName } as any);
}

function templateCsv() {
  const sample = [
    "H001",
    "AST-0001",
    "Dell Latitude 5420",
    "Laptop",
    "Dell",
    "Latitude 5420",
    "SN-0001",
    "TAG-0001",
    "2026-01-01",
    "80000",
    "5",
    "Straight Line",
    "2029-01-01",
    "New",
    "Available",
    "Demo Vendor",
    "Head Office",
    "Optional notes",
  ];
  return `${TEMPLATE_HEADERS.join(",")}\n${sample.map(csvEscape).join(",")}\n`;
}

assetRoutes.get("/", async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const search = String(req.query.search || "").trim();
    const where: any = {};
    if (search)
      where[Op.or] = [{ assetCode: { [Op.iLike]: `%${search}%` } }, { name: { [Op.iLike]: `%${search}%` } }, { serialNumber: { [Op.iLike]: `%${search}%` } }, { brand: { [Op.iLike]: `%${search}%` } }, { model: { [Op.iLike]: `%${search}%` } }];
    if (req.query.status)
      where.status = req.query.status;
    if (req.query.categoryId)
      where.categoryId = req.query.categoryId;
    if (req.query.companyId)
      where.companyId = req.query.companyId;
    const { rows, count } = await Asset.findAndCountAll({ where, include: [{ model: AssetCategory, as: "category" }, { model: Company, as: "company" }, { model: Vendor, as: "vendor" }, { model: Location, as: "location" }, { model: Employee, as: "assignedEmployee" }], order: [[String(req.query.sortBy || "createdAt"), String(req.query.sortOrder || "DESC")]], limit, offset });
    ok(res, "Assets fetched successfully", rows, getPagingMeta(count, page, limit));
  }
  catch (error) {
    next(error);
  }
});

assetRoutes.get("/template", (_req, res) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=assetflow-assets-template.csv");
  res.send(templateCsv());
});

assetRoutes.post("/import", async (req, res, next) => {
  try {
    const csv = z.object({ csv: z.string().min(1, "CSV file is required") }).parse(req.body).csv;
    const rows = parseCsv(csv);
    const missingHeaders = TEMPLATE_HEADERS.filter((h) => !Object.keys(rows[0] || {}).includes(h));
    if (!rows.length)
      throw new ApiError(400, "CSV has no data rows");
    if (missingHeaders.length)
      throw new ApiError(400, `CSV template is missing required headers: ${missingHeaders.join(", ")}`);
    const errors: Array<{
      row: number;
      field?: string;
      message: string;
    }> = [];
    const seenAssetCodes = new Set<string>();
    const seenSerialNumbers = new Set<string>();
    const createdAssets: Asset[] = [];
    for (let index = 0; index < rows.length; index += 1) {
      const rowNumber = index + 2;
      const row = rows[index];
      const addError = (field: string, message: string) => errors.push({ row: rowNumber, field, message });
      for (const header of TEMPLATE_HEADERS.filter((h) => h !== "notes")) {
        if (!row[header])
          addError(header, `${header} is required`);
      }
      const purchasePrice = Number(row.purchasePrice);
      const usefulLifeYears = Number(row.usefulLifeYears);
      if (Number.isNaN(purchasePrice) || purchasePrice < 0)
        addError("purchasePrice", "Invalid purchase price");
      if (!Number.isInteger(usefulLifeYears) || usefulLifeYears <= 0)
        addError("usefulLifeYears", "Useful life years must be a positive whole number");
      if (Number.isNaN(Date.parse(row.purchaseDate)))
        addError("purchaseDate", "Invalid purchase date");
      if (Number.isNaN(Date.parse(row.warrantyExpiry)))
        addError("warrantyExpiry", "Invalid warranty expiry date");
      if (seenAssetCodes.has(row.assetCode))
        addError("assetCode", "Duplicate asset code inside CSV");
      if (seenSerialNumbers.has(row.serialNumber))
        addError("serialNumber", "Duplicate serial number inside CSV");
      seenAssetCodes.add(row.assetCode);
      seenSerialNumbers.add(row.serialNumber);
      const company = row.companyCode ? await findCompanyByCode(row.companyCode) : null;
      const category = row.categoryName ? await findCategoryByName(row.categoryName) : null;
      if (!company)
        addError("companyCode", "Company not found by code");
      if (!category)
        addError("categoryName", "Category not found by name");
      let vendor: Vendor | null = null;
      let location: Location | null = null;
      if (company && row.vendorName)
        vendor = await findOrCreateVendorByName(row.vendorName, company.id);
      if (row.locationName)
        location = await findOrCreateLocationByName(row.locationName);
      const duplicate = await Asset.findOne({ where: { [Op.or]: [{ assetCode: row.assetCode }, { serialNumber: row.serialNumber }] } });
      if (duplicate?.assetCode === row.assetCode)
        addError("assetCode", "Asset code already exists");
      if (duplicate?.serialNumber === row.serialNumber)
        addError("serialNumber", "Serial number already exists");
      const rowHasErrors = errors.some((e) => e.row === rowNumber);
      if (rowHasErrors || !company || !category || !vendor || !location)
        continue;
      const salvageValue = calculateAutoSalvageValue(purchasePrice, row.condition);
      const currentValue = calculateStraightLineValue({ purchasePrice, salvageValue, usefulLifeYears, purchaseDate: row.purchaseDate });
      const asset = await Asset.create({
        companyId: company.id,
        assetCode: normalizeImportText(row.assetCode),
        name: normalizeImportText(row.name),
        categoryId: category.id,
        brand: normalizeImportText(row.brand),
        model: normalizeImportText(row.model),
        serialNumber: normalizeImportText(row.serialNumber),
        assetTag: normalizeImportText(row.assetTag),
        purchaseDate: parseImportDate(row.purchaseDate),
        purchasePrice,
        salvageValue,
        usefulLifeYears,
        depreciationMethod: normalizeImportText(row.depreciationMethod),
        vendorId: vendor.id,
        locationId: location.id,
        condition: normalizeImportText(row.condition),
        status: normalizeImportText(row.status),
        warrantyExpiry: parseImportDate(row.warrantyExpiry),
        notes: normalizeImportText(row.notes) || null,
        currentValue,
      } as any);
      createdAssets.push(asset);
    }
    await writeAudit(req, { action: "Created", module: "Assets", recordId: "csv-import", afterSnapshot: { totalRows: rows.length, successCount: createdAssets.length, failedCount: errors.length ? rows.length - createdAssets.length : 0, errors } });
    ok(res, "Asset CSV import completed", { totalRows: rows.length, successCount: createdAssets.length, failedCount: rows.length - createdAssets.length, errors });
  }
  catch (error) {
    next(error);
  }
});

assetRoutes.post("/bulk", async (req, res, next) => {
  try {
    const body = z.object({ assets: z.array(assetSchema).min(1) }).parse(req.body);
    const createdAssets = [];
    for (const data of body.assets) {
      const salvageValue = data.salvageValue ?? calculateAutoSalvageValue(data.purchasePrice, data.condition);
      const currentValue = calculateStraightLineValue({ purchasePrice: data.purchasePrice, salvageValue, usefulLifeYears: data.usefulLifeYears, purchaseDate: data.purchaseDate });
      createdAssets.push(await Asset.create({ ...data, salvageValue, currentValue } as any));
    }
    await writeAudit(req, { action: "Created", module: "Assets", recordId: "bulk", afterSnapshot: { count: createdAssets.length } });
    created(res, "Assets bulk created successfully", createdAssets);
  }
  catch (error) {
    next(error);
  }
});

assetRoutes.post("/", async (req, res, next) => {
  try {
    const data = assetSchema.parse(req.body);
    const salvageValue = data.salvageValue ?? calculateAutoSalvageValue(data.purchasePrice, data.condition);
    const currentValue = calculateStraightLineValue({ purchasePrice: data.purchasePrice, salvageValue, usefulLifeYears: data.usefulLifeYears, purchaseDate: data.purchaseDate });
    const asset = await Asset.create({ ...data, salvageValue, currentValue } as any);
    await writeAudit(req, { action: "Created", module: "Assets", recordId: asset.id, afterSnapshot: asset.toJSON() });
    created(res, "Asset created successfully", asset);
  }
  catch (error) {
    next(error);
  }
});

assetRoutes.get("/:id", async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id, { include: [{ model: AssetCategory, as: "category" }, { model: Company, as: "company" }, { model: Vendor, as: "vendor" }, { model: Location, as: "location" }, { model: Employee, as: "assignedEmployee" }, AssetAssignment, AssetReturn] });
    if (!asset)
      throw new ApiError(404, "Asset not found");
    ok(res, "Asset fetched successfully", asset);
  }
  catch (error) {
    next(error);
  }
});

assetRoutes.patch("/:id", async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset)
      throw new ApiError(404, "Asset not found");
    const data = assetSchema.parse(req.body);
    const before = asset.toJSON();
    const salvageValue = data.salvageValue ?? calculateAutoSalvageValue(data.purchasePrice, data.condition);
    const currentValue = calculateStraightLineValue({ purchasePrice: data.purchasePrice, salvageValue, usefulLifeYears: data.usefulLifeYears, purchaseDate: data.purchaseDate });
    await asset.update({ ...data, salvageValue, currentValue });
    await writeAudit(req, { action: "Updated", module: "Assets", recordId: asset.id, beforeSnapshot: before, afterSnapshot: asset.toJSON() });
    ok(res, "Asset updated successfully", asset);
  }
  catch (error) {
    next(error);
  }
});

assetRoutes.delete("/:id", async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset)
      throw new ApiError(404, "Asset not found");
    const before = asset.toJSON();
    await asset.destroy();
    await writeAudit(req, { action: "Deleted", module: "Assets", recordId: req.params.id, beforeSnapshot: before });
    ok(res, "Asset deleted successfully");
  }
  catch (error) {
    next(error);
  }
});

assetRoutes.post("/:id/assign", async (req, res, next) => {
  try {
    const body = z.object({ employeeId: z.string().uuid(), conditionAtAssign: z.string().default("Good"), notes: z.string().optional() }).parse(req.body);
    const asset = await Asset.findByPk(req.params.id);
    if (!asset)
      throw new ApiError(404, "Asset not found");
    if (asset.status === "Assigned")
      throw new ApiError(409, "Asset is already assigned");
    const before = asset.toJSON();
    const assignment = await AssetAssignment.create({ assetId: asset.id, employeeId: body.employeeId, assignedById: req.user!.id, conditionAtAssign: body.conditionAtAssign, notes: body.notes } as any);
    await asset.update({ status: "Assigned", assignedEmployeeId: body.employeeId, condition: body.conditionAtAssign });
    await writeAudit(req, { action: "Assigned", module: "Assets", recordId: asset.id, beforeSnapshot: before, afterSnapshot: { assignment: assignment.toJSON(), asset: asset.toJSON() } });
    created(res, "Asset assigned successfully", assignment);
  }
  catch (error) {
    next(error);
  }
});

assetRoutes.post("/:id/return", async (req, res, next) => {
  try {
    const body = z.object({ assignmentId: z.string().uuid(), returnStatus: z.string().default("Returned"), returnCondition: z.string().default("Good"), penaltyAmount: z.number().default(0), notes: z.string().optional() }).parse(req.body);
    const asset = await Asset.findByPk(req.params.id);
    if (!asset)
      throw new ApiError(404, "Asset not found");
    const assignment = await AssetAssignment.findByPk(body.assignmentId);
    if (!assignment)
      throw new ApiError(404, "Assignment not found");
    const before = asset.toJSON();
    const returnRecord = await AssetReturn.create({ assignmentId: assignment.id, assetId: asset.id, employeeId: assignment.employeeId, receivedById: req.user!.id, returnStatus: body.returnStatus, returnCondition: body.returnCondition, penaltyAmount: body.penaltyAmount, notes: body.notes } as any);
    await assignment.update({ returnedAt: new Date() });
    await asset.update({ status: body.returnStatus === "Lost" ? "Lost" : "Available", assignedEmployeeId: null, condition: body.returnCondition });
    await writeAudit(req, { action: "Returned", module: "Assets", recordId: asset.id, beforeSnapshot: before, afterSnapshot: { returnRecord: returnRecord.toJSON(), asset: asset.toJSON() } });
    created(res, "Asset returned successfully", returnRecord);
  }
  catch (error) {
    next(error);
  }
});

assetRoutes.get("/:id/qr", async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset)
      throw new ApiError(404, "Asset not found");
    const qr = await QRCode.toDataURL(JSON.stringify({ assetId: asset.id, assetCode: asset.assetCode, serialNumber: asset.serialNumber }));
    ok(res, "QR code generated", { qr });
  }
  catch (error) {
    next(error);
  }
});
