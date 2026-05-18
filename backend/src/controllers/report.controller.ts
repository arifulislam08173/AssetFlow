import { Router } from "express";
import { Asset, AssetAssignment, AssetCategory, AssetReturn, Company, Employee, Location, RepairTicket, Vendor } from "../models";
import { ok } from "../utils/api-response";
import { ApiError } from "../utils/errors";
import { calculateStraightLineValue } from "../utils/depreciation";

export const reportRoutes = Router();

reportRoutes.get("/assets", async (req, res, next) => { try {
  const where: any = {};
  if (req.query.companyId)
    where.companyId = req.query.companyId;
  const data = await Asset.findAll({ where, include: [{ model: Company, as: "company" }, { model: AssetCategory, as: "category" }, { model: Vendor, as: "vendor" }, { model: Location, as: "location" }, { model: Employee, as: "assignedEmployee" }], order: [["assetCode", "ASC"]] });
  ok(res, "Asset inventory report generated", data);
}
catch (e) {
  next(e);
} });

reportRoutes.get("/depreciation", async (req, res, next) => { try {
  const where: any = {};
  if (req.query.companyId)
    where.companyId = req.query.companyId;
  const data = await Asset.findAll({ where, attributes: ["id", "companyId", "assetCode", "name", "purchasePrice", "currentValue", "salvageValue", "usefulLifeYears", "depreciationMethod", "purchaseDate", "warrantyExpiry", "status", "condition", "assignedEmployeeId"], include: [{ model: Company, as: "company" }, { model: Employee, as: "assignedEmployee" }], order: [["purchaseDate", "ASC"]] });
  ok(res, "Depreciation report generated", data);
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

function safeHtml(v: unknown) { return String(v ?? "-").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch] || ch)); }

function detailReportHtml(title: string, body: string) {
  return `<!doctype html><html><head><title>${safeHtml(title)}</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:28px;color:#0f172a}.brand{display:flex;justify-content:space-between;border-bottom:3px solid #0f766e;padding-bottom:14px;margin-bottom:18px}h1{margin:0;color:#0f766e}.meta{color:#64748b;font-size:12px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.card{border:1px solid #cbd5e1;border-radius:14px;padding:14px;margin:12px 0;background:#f8fafc}.label{font-size:10px;color:#64748b;text-transform:uppercase}.value{font-weight:700;margin-top:3px}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border:1px solid #cbd5e1;padding:7px;font-size:11px;text-align:left}th{background:#f0fdfa;color:#115e59}@page{size:A4;margin:12mm}@media print{body{padding:0}}</style></head><body><div class="brand"><div><h1>AssetFlow</h1><div class="meta">Asset Finance & Lifecycle History</div></div><div class="meta">Generated ${new Date().toLocaleString()}</div></div><h2>${safeHtml(title)}</h2>${body}<script>window.print()</script></body></html>`;
}

function info(label: string, value: unknown) { return `<div class="card"><div class="label">${safeHtml(label)}</div><div class="value">${safeHtml(value)}</div></div>`; }

reportRoutes.get("/assets/:id/history/pdf", async (req, res, next) => {
  try {
    const asset: any = await Asset.findByPk(req.params.id, { include: [{ model: Company, as: "company" }, { model: AssetCategory, as: "category" }, { model: Vendor, as: "vendor" }, { model: Location, as: "location" }, { model: Employee, as: "assignedEmployee" }] });
    if (!asset)
      throw new ApiError(404, "Asset not found");
    const [assignments, returns, repairs] = await Promise.all([
      AssetAssignment.findAll({ where: { assetId: asset.id }, include: [Employee], order: [["assignedAt", "DESC"]] }),
      AssetReturn.findAll({ where: { assetId: asset.id }, include: [Employee], order: [["createdAt", "DESC"]] }),
      RepairTicket.findAll({ where: { assetId: asset.id }, include: [Vendor], order: [["reportedAt", "DESC"]] }),
    ]);
    const purchasePrice = Number(asset.purchasePrice || 0);
    const salvageValue = Number(asset.salvageValue || 0);
    const usefulLifeYears = Number(asset.usefulLifeYears || 5);
    const purchaseDate = String(asset.purchaseDate);
    const currentValue = calculateStraightLineValue({ purchasePrice, salvageValue, usefulLifeYears, purchaseDate });
    const depreciation = Math.max(0, purchasePrice - currentValue);
    const assignmentRows = (assignments as any[]).map((x: any) => `<tr><td>${safeHtml(x.Employee ? `${x.Employee.employeeCode} - ${x.Employee.name}` : x.employeeId)}</td><td>${safeHtml(x.assignedAt)}</td><td>${safeHtml(x.conditionAtAssign)}</td><td>${safeHtml(x.returnedAt || "No")}</td></tr>`).join("") || `<tr><td colspan="4">No assignment history</td></tr>`;
    const returnRows = (returns as any[]).map((x: any) => `<tr><td>${safeHtml(x.Employee ? `${x.Employee.employeeCode} - ${x.Employee.name}` : x.employeeId)}</td><td>${safeHtml(x.returnStatus)}</td><td>${safeHtml(x.returnCondition)}</td><td>${safeHtml(x.penaltyAmount)}</td></tr>`).join("") || `<tr><td colspan="4">No return history</td></tr>`;
    const repairRows = (repairs as any[]).map((x: any) => `<tr><td>${safeHtml(x.ticketCode)}</td><td>${safeHtml(x.problem)}</td><td>${safeHtml(x.Vendor?.name)}</td><td>${safeHtml(x.repairCost)}</td><td>${safeHtml(x.status)}</td></tr>`).join("") || `<tr><td colspan="5">No repair/upgrade history</td></tr>`;
    const body = `<div class="grid">${info("Company", asset.company?.name)}${info("Asset", `${asset.assetCode} - ${asset.name}`)}${info("Serial", asset.serialNumber)}${info("Purchase Date", asset.purchaseDate)}${info("Purchase Price", purchasePrice)}${info("Current Value", currentValue)}${info("Accumulated Depreciation", depreciation)}${info("Useful Life", `${usefulLifeYears} years`)}${info("Salvage Value", salvageValue)}${info("Warranty Expiry", asset.warrantyExpiry)}${info("Current Employee", asset.assignedEmployee ? `${asset.assignedEmployee.employeeCode} - ${asset.assignedEmployee.name}` : "Not assigned")} ${info("Status", asset.status)}</div><h3>Assignment History</h3><table><tr><th>Employee</th><th>Assigned At</th><th>Condition</th><th>Returned At</th></tr>${assignmentRows}</table><h3>Return History</h3><table><tr><th>Employee</th><th>Status</th><th>Condition</th><th>Penalty</th></tr>${returnRows}</table><h3>Repair / Upgrade History</h3><table><tr><th>Ticket</th><th>Problem / Upgrade</th><th>Vendor</th><th>Cost</th><th>Status</th></tr>${repairRows}</table>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename=finance-history-${asset.assetCode}.html`);
    res.send(detailReportHtml(`Finance History: ${asset.assetCode}`, body));
  }
  catch (e) {
    next(e);
  }
});
