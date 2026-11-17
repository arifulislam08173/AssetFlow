import { addListQuery } from "../utils/list-query";
import { getPagination, getPagingMeta } from "../utils/pagination";
import { Router } from "express";
import { pdfMoney, sendPdfReport } from "../utils/pdf-report";
import { Asset, AssetAssignment, AssetCategory, AssetReturn, Company, Employee, Location, RepairTicket, Vendor } from "../models";
import { ok } from "../utils/api-response";
import { ApiError } from "../utils/errors";
import { calculateStraightLineValue } from "../utils/depreciation";

export const reportRoutes = Router();

reportRoutes.get("/assets", async (req, res, next) => { try {
  const { page, limit, offset } = getPagination(req);
  const where: any = {};
  addListQuery(where, req, { search: ["name", "assetCode", "serialNumber", "brand", "model"], exact: ["companyId", "categoryId", "status", "condition"], date: "purchaseDate", dateOnly: true });
  const { rows, count } = await Asset.findAndCountAll({ where, limit, offset, include: [{ model: Company, as: "company" }, { model: AssetCategory, as: "category" }, { model: Vendor, as: "vendor" }, { model: Location, as: "location" }, { model: Employee, as: "assignedEmployee" }], order: [["assetCode", "ASC"]] });
  ok(res, "Asset inventory report generated", rows, getPagingMeta(count, page, limit));
}
catch (e) {
  next(e);
} });

reportRoutes.get("/depreciation", async (req, res, next) => { try {
  const { page, limit, offset } = getPagination(req);
  const where: any = {};
  addListQuery(where, req, { search: ["name", "assetCode"], exact: ["companyId", "categoryId", "status", "depreciationMethod"], date: "purchaseDate", dateOnly: true });
  const { rows, count } = await Asset.findAndCountAll({ where, limit, offset, attributes: ["id", "companyId", "assetCode", "name", "purchasePrice", "currentValue", "salvageValue", "usefulLifeYears", "depreciationMethod", "purchaseDate", "warrantyExpiry", "status", "condition", "assignedEmployeeId"], include: [{ model: Company, as: "company" }, { model: Employee, as: "assignedEmployee" }], order: [["purchaseDate", "ASC"]] });
  const [purchaseValue, currentValue] = await Promise.all([Asset.sum("purchasePrice", { where }), Asset.sum("currentValue", { where })]);
  ok(res, "Depreciation report generated", rows, { ...getPagingMeta(count, page, limit), purchaseValue: Number(purchaseValue || 0), currentValue: Number(currentValue || 0) });
}
catch (e) {
  next(e);
} });

reportRoutes.get("/assets/:id/history", async (req, res, next) => { try {
  const asset = await Asset.findByPk(req.params.id, { include: [{ model: Company, as: "company" }, { model: AssetCategory, as: "category" }, { model: Vendor, as: "vendor" }, { model: Location, as: "location" }, { model: Employee, as: "assignedEmployee" }] });
  if (!asset)
    throw new ApiError(404, "Asset not found");
  const [assignments, returns, repairs] = await Promise.all([AssetAssignment.findAll({ where: { assetId: asset.id }, include: [Employee], order: [["assignedAt", "DESC"]] }), AssetReturn.findAll({ where: { assetId: asset.id }, include: [Employee], order: [["createdAt", "DESC"]] }), RepairTicket.findAll({ where: { assetId: asset.id }, include: [Vendor], order: [["reportedAt", "DESC"]] })]);
  const purchasePrice = Number((asset as any).purchasePrice || 0);
  const salvageValue = Number((asset as any).salvageValue || 0);
  const usefulLifeYears = Number((asset as any).usefulLifeYears || 5);
  const purchaseDate = String((asset as any).purchaseDate);
  const currentValue = calculateStraightLineValue({ purchasePrice, salvageValue, usefulLifeYears, purchaseDate });
  const purchase = new Date(purchaseDate);
  const today = new Date();
  const ageDays = Math.max(0, Math.floor((today.getTime() - purchase.getTime()) / 86400000));
  const warrantyExpiry = (asset as any).warrantyExpiry ? new Date((asset as any).warrantyExpiry) : null;
  const warrantyDaysLeft = warrantyExpiry ? Math.ceil((warrantyExpiry.getTime() - today.getTime()) / 86400000) : null;
  const totalLifeDays = usefulLifeYears * 365;
  const remainingLifeDays = Math.max(0, totalLifeDays - ageDays);
  ok(res, "Asset finance and lifecycle history fetched", { asset, assignments, returns, repairs, finance: { purchasePrice, salvageValue, usefulLifeYears, purchaseDate, currentValue, accumulatedDepreciation: Math.max(0, purchasePrice - currentValue), ageDays, totalLifeDays, remainingLifeDays, warrantyDaysLeft, estimatedSalvageDate: new Date(purchase.getTime() + totalLifeDays * 86400000).toISOString().slice(0, 10) } });
}
catch (e) {
  next(e);
} });

reportRoutes.get("/assets/:id/history/pdf", async (req, res, next) => {
  try {
    const asset: any = await Asset.findByPk(req.params.id, { include: [
      { model: Company, as: "company" }, { model: AssetCategory, as: "category" },
      { model: Vendor, as: "vendor" }, { model: Location, as: "location" },
      { model: Employee, as: "assignedEmployee" },
    ] });
    if (!asset) throw new ApiError(404, "Asset not found");
    const [assignments, returns, repairs]: any[] = await Promise.all([
      AssetAssignment.findAll({ where: { assetId: asset.id }, include: [Employee], order: [["assignedAt", "DESC"]] }),
      AssetReturn.findAll({ where: { assetId: asset.id }, include: [Employee], order: [["createdAt", "DESC"]] }),
      RepairTicket.findAll({ where: { assetId: asset.id }, include: [Vendor], order: [["reportedAt", "DESC"]] }),
    ]);
    const purchasePrice = Number(asset.purchasePrice || 0);
    const currentValue = calculateStraightLineValue({
      purchasePrice, salvageValue: Number(asset.salvageValue || 0),
      usefulLifeYears: Number(asset.usefulLifeYears || 5), purchaseDate: String(asset.purchaseDate),
    });
    sendPdfReport(res, {
      title: `Asset Lifecycle History - ${asset.assetCode}`,
      filename: `finance-history-${asset.assetCode}.pdf`, landscape: true,
      subtitle: "Includes assignments, returns and repair tickets; finance values use the current straight-line estimate.",
      summary: [`Purchase price: ${pdfMoney(purchasePrice)}`, `Estimated value: ${pdfMoney(currentValue)}`, `Est. depreciation: ${pdfMoney(Math.max(0, purchasePrice - currentValue))}`],
      details: [
        ["Company", asset.company?.name], ["Asset", `${asset.assetCode} - ${asset.name}`],
        ["Serial", asset.serialNumber], ["Purchase Date", asset.purchaseDate],
        ["Category", asset.category?.name], ["Status", asset.status],
        ["Assigned Employee", asset.assignedEmployee?.name], ["Warranty Expiry", asset.warrantyExpiry],
        ["Useful Life", `${asset.usefulLifeYears} years`], ["Salvage Value", pdfMoney(asset.salvageValue)],
      ],
      sections: [
        { title: "ASSIGNMENT HISTORY", columns: [
          { title: "Employee", weight: 2 }, { title: "Assigned At" }, { title: "Condition" }, { title: "Returned At" },
        ], rows: assignments.map((x: any) => [x.Employee?.name, x.assignedAt, x.conditionAtAssign, x.returnedAt]) },
        { title: "RETURN HISTORY", columns: [
          { title: "Employee", weight: 2 }, { title: "Status" }, { title: "Condition" }, { title: "Penalty" },
        ], rows: returns.map((x: any) => [x.Employee?.name, x.returnStatus, x.returnCondition, pdfMoney(x.penaltyAmount)]) },
        { title: "REPAIR / UPGRADE HISTORY", columns: [
          { title: "Ticket" }, { title: "Problem", weight: 2.5 }, { title: "Vendor" }, { title: "Cost" }, { title: "Status" },
        ], rows: repairs.map((x: any) => [x.ticketCode, x.problem, x.Vendor?.name, pdfMoney(x.repairCost), x.status]) },
      ],
    });
  } catch (error) { next(error); }
});
