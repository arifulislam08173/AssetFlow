import type { Request } from "express";
import { addListQuery } from "../utils/list-query";
import { Router } from "express";
import { Op } from "sequelize";
import {
  Asset, AssetAssignment, AssetCategory, AssetReturn, AuditLog,
  Company, Employee, Location, Purchase, RepairTicket, Role, User, Vendor,
} from "../models";
import { pdfMoney, sendPdfReport, type PdfColumn } from "../utils/pdf-report";

export const exportRoutes = Router();

type ExportKind = "assets" | "employees" | "vendors" | "purchases" | "assignments" | "returns" | "repairs" | "finance" | "categories" | "companies" | "users" | "audit";
const exportSpecs: Record<ExportKind, { search: string[]; exact: string[]; date: string; dateOnly?: boolean }> = {
  assets: { search: ["assetCode", "name", "serialNumber", "brand", "model"], exact: ["companyId", "status", "categoryId", "condition", "vendorId", "locationId"], date: "purchaseDate", dateOnly: true },
  employees: { search: ["employeeCode", "name", "email"], exact: ["status", "departmentId", "clearanceStatus"], date: "joiningDate", dateOnly: true },
  vendors: { search: ["name", "contactPerson", "phone", "email"], exact: ["companyId", "status"], date: "createdAt" },
  purchases: { search: ["invoiceNumber", "paymentStatus"], exact: ["companyId", "vendorId", "paymentStatus"], date: "purchaseDate", dateOnly: true },
  assignments: { search: ["$Asset.assetCode$", "$Asset.name$", "$Employee.employeeCode$", "$Employee.name$"], exact: ["conditionAtAssign"], date: "assignedAt" },
  returns: { search: ["$Asset.assetCode$", "$Asset.name$", "$Employee.employeeCode$", "$Employee.name$"], exact: ["returnStatus", "returnCondition"], date: "createdAt" },
  repairs: { search: ["ticketCode", "problem", "$Asset.assetCode$", "$Asset.name$", "$Vendor.name$"], exact: ["status", "repairVendorId"], date: "reportedAt" },
  finance: { search: ["name", "assetCode"], exact: ["companyId", "categoryId", "status", "depreciationMethod"], date: "purchaseDate", dateOnly: true },
  categories: { search: ["name"], exact: ["companyId"], date: "createdAt" },
  companies: { search: ["name", "code", "email", "contactPerson"], exact: ["status"], date: "createdAt" },
  users: { search: ["name", "email"], exact: ["status", "roleId"], date: "createdAt" },
  audit: { search: ["userName", "action", "module", "recordId", "ipAddress"], exact: ["action", "module", "userId"], date: "createdAt" },
};
function exportWhere(req: Request, kind: ExportKind): any {
  const where: any = {};
  addListQuery(where, req, exportSpecs[kind]);
  if (kind === "assignments" && req.query.returnState === "open") where.returnedAt = null;
  if (kind === "assignments" && req.query.returnState === "returned") where.returnedAt = { [Op.not]: null };
  return where;
}
function companyOnAsset(req: Request): any {
  return typeof req.query.companyId === "string" && req.query.companyId ? { where: { companyId: req.query.companyId }, required: true } : {};
}
function companyOnEmployee(req: Request): any {
  return typeof req.query.companyId === "string" && req.query.companyId ? { where: { id: req.query.companyId }, required: true } : {};
}


function csvEscape(input: unknown): string {
  let s = String(input ?? "");
  if (/^[\s]*[=+@]/.test(s) || /^[\s]*-(?!\d)/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}
function sendCsv(res: any, filename: string, headings: string[], rows: unknown[][]) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.send("\ufeff" + [headings, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n"));
}
function cols(...labels: string[]): PdfColumn[] { return labels.map((title) => ({ title })); }
function onError(next: (error: unknown) => void, error: unknown) { next(error); }

const assetIncludes = [
  { model: Company, as: "company" }, { model: AssetCategory, as: "category" },
  { model: Location, as: "location" }, { model: Employee, as: "assignedEmployee" },
];

exportRoutes.get("/assets.csv", async (req, res, next) => {
  try {
    const rows: any[] = await Asset.findAll({ where: exportWhere(req, "assets"),  include: assetIncludes, order: [["assetCode", "ASC"]] });
    sendCsv(res, "assetflow-assets.csv",
      ["Company", "Asset Code", "Name", "Category", "Serial", "Status", "Condition", "Employee", "Location", "Purchase Date", "Purchase Price", "Current Value", "Useful Life", "Warranty Expiry"],
      rows.map((a) => [a.company?.name, a.assetCode, a.name, a.category?.name, a.serialNumber, a.status, a.condition, a.assignedEmployee?.name, a.location?.name, a.purchaseDate, a.purchasePrice, a.currentValue, a.usefulLifeYears, a.warrantyExpiry]));
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/assets.pdf", async (req, res, next) => {
  try {
    const rows: any[] = await Asset.findAll({ where: exportWhere(req, "assets"),  include: assetIncludes, order: [["assetCode", "ASC"]] });
    sendPdfReport(res, {
      title: "Asset Inventory Report", filename: "assetflow-assets.pdf", landscape: true,
      subtitle: "Registered asset inventory, ownership and lifecycle status",
      summary: [`Total assets: ${rows.length}`, `Assigned: ${rows.filter((a) => !!a.assignedEmployeeId).length}`, `Available: ${rows.filter((a) => a.status === "Available").length}`],
      sections: [{ columns: [
        { title: "Company", weight: 1.15 }, { title: "Asset Code", weight: 1.1 }, { title: "Asset", weight: 1.7 },
        { title: "Category", weight: 1.1 }, { title: "Serial", weight: 1.15 }, { title: "Status" },
        { title: "Condition" }, { title: "Assigned To", weight: 1.3 }, { title: "Location", weight: 1.1 },
        { title: "Purchase", weight: 1.1, align: "right" }, { title: "Book Value", weight: 1.1, align: "right" },
      ], rows: rows.map((a) => [a.company?.name, a.assetCode, a.name, a.category?.name, a.serialNumber, a.status, a.condition, a.assignedEmployee?.name, a.location?.name, pdfMoney(a.purchasePrice), pdfMoney(a.currentValue)]) }],
    });
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/employees.pdf", async (req, res, next) => {
  try {
    const rows: any[] = await Employee.findAll({ where: exportWhere(req, "employees"),  include: [{ model: Company, as: "companies", ...companyOnEmployee(req) }, Location], order: [["employeeCode", "ASC"]] });
    sendPdfReport(res, { title: "Employee Directory", filename: "assetflow-employees.pdf", landscape: true,
      summary: [`Total employees: ${rows.length}`, `Active: ${rows.filter((r) => r.status === "Active").length}`],
      sections: [{ columns: cols("Employee ID", "Name", "Company", "Email", "Phone", "Designation", "Location", "Status", "Clearance"),
        rows: rows.map((e) => [e.employeeCode, e.name, (e.companies || []).map((c: any) => c.code || c.name).join(", "), e.email, e.phone, e.designation, e.Location?.name, e.status, e.clearanceStatus]) }] });
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/vendors.pdf", async (req, res, next) => {
  try {
    const rows: any[] = await Vendor.findAll({ where: exportWhere(req, "vendors"),  include: [{ model: Company, as: "company" }], order: [["name", "ASC"]] });
    sendPdfReport(res, { title: "Vendor Directory", filename: "assetflow-vendors.pdf", landscape: true,
      summary: [`Total vendors: ${rows.length}`], sections: [{ columns: cols("Company", "Vendor", "Contact Person", "Phone", "Email", "Address", "Status", "Created"),
      rows: rows.map((v) => [v.company?.name, v.name, v.contactPerson, v.phone, v.email, v.address, v.status, v.createdAt]) }] });
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/purchases.pdf", async (req, res, next) => {
  try {
    const rows: any[] = await Purchase.findAll({ where: exportWhere(req, "purchases"),  include: [{ model: Company, as: "company" }, Vendor], order: [["purchaseDate", "DESC"]] });
    sendPdfReport(res, { title: "Purchase Register", filename: "assetflow-purchases.pdf", landscape: true,
      summary: [`Purchases: ${rows.length}`, `Total value: ${pdfMoney(rows.reduce((a, p) => a + Number(p.totalAmount || 0), 0))}`],
      sections: [{ columns: cols("Company", "Invoice Number", "Vendor", "Purchase Date", "Total Amount", "Payment Status"),
      rows: rows.map((p) => [p.company?.name, p.invoiceNumber, p.Vendor?.name, p.purchaseDate, pdfMoney(p.totalAmount), p.paymentStatus]) }] });
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/assignments.pdf", async (req, res, next) => {
  try {
    const rows: any[] = await AssetAssignment.findAll({ subQuery: false, where: exportWhere(req, "assignments"),  include: [{ model: Asset, ...companyOnAsset(req), include: [{ model: Company, as: "company" }] }, Employee], order: [["assignedAt", "DESC"]] });
    sendPdfReport(res, { title: "Asset Assignment Register", filename: "assetflow-assignments.pdf", landscape: true,
      summary: [`Records: ${rows.length}`, `Currently assigned: ${rows.filter((x) => !x.returnedAt).length}`],
      sections: [{ columns: cols("Company", "Asset Code", "Asset", "Employee", "Assigned At", "Condition", "Returned At"),
      rows: rows.map((x) => [x.Asset?.company?.name, x.Asset?.assetCode, x.Asset?.name, x.Employee?.name, x.assignedAt, x.conditionAtAssign, x.returnedAt]) }] });
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/returns.pdf", async (req, res, next) => {
  try {
    const rows: any[] = await AssetReturn.findAll({ subQuery: false, where: exportWhere(req, "returns"),  include: [{ model: Asset, ...companyOnAsset(req), include: [{ model: Company, as: "company" }] }, Employee], order: [["createdAt", "DESC"]] });
    sendPdfReport(res, { title: "Asset Return & Clearance Register", filename: "assetflow-returns.pdf", landscape: true,
      summary: [`Return records: ${rows.length}`, `Total penalties: ${pdfMoney(rows.reduce((s, x) => s + Number(x.penaltyAmount || 0), 0))}`],
      sections: [{ columns: cols("Company", "Asset Code", "Asset", "Employee", "Return Date", "Return Status", "Condition", "Penalty", "Notes"),
      rows: rows.map((x) => [x.Asset?.company?.name, x.Asset?.assetCode, x.Asset?.name, x.Employee?.name, x.createdAt, x.returnStatus, x.returnCondition, pdfMoney(x.penaltyAmount), x.notes]) }] });
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/repairs.pdf", async (req, res, next) => {
  try {
    const rows: any[] = await RepairTicket.findAll({ subQuery: false, where: exportWhere(req, "repairs"),  include: [{ model: Asset, ...companyOnAsset(req), include: [{ model: Company, as: "company" }] }, Vendor], order: [["reportedAt", "DESC"]] });
    sendPdfReport(res, { title: "Repair & Upgrade Register", filename: "assetflow-repairs.pdf", landscape: true,
      summary: [`Tickets: ${rows.length}`, `Repair spend: ${pdfMoney(rows.reduce((s, r) => s + Number(r.repairCost || 0), 0))}`],
      sections: [{ columns: cols("Company", "Ticket", "Asset Code", "Asset", "Problem / Upgrade", "Vendor", "Cost", "Status", "Reported"),
      rows: rows.map((x) => [x.Asset?.company?.name, x.ticketCode, x.Asset?.assetCode, x.Asset?.name, x.problem, x.Vendor?.name, pdfMoney(x.repairCost), x.status, x.reportedAt]) }] });
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/finance.pdf", async (req, res, next) => {
  try {
    const rows: any[] = await Asset.findAll({ where: exportWhere(req, "finance"),  include: assetIncludes, order: [["purchaseDate", "ASC"]] });
    const totalPurchase = rows.reduce((s, a) => s + Number(a.purchasePrice || 0), 0);
    const totalCurrent = rows.reduce((s, a) => s + Number(a.currentValue || 0), 0);
    sendPdfReport(res, { title: "Asset Depreciation & Finance Report", filename: "assetflow-finance.pdf", landscape: true,
      subtitle: "Book values are the amounts currently stored in AssetFlow; this export does not recalculate depreciation.",
      summary: [`Purchase: ${pdfMoney(totalPurchase)}`, `Book value: ${pdfMoney(totalCurrent)}`, `Difference: ${pdfMoney(totalPurchase - totalCurrent)}`],
      sections: [{ columns: [
        { title: "Company", weight: 1.2 }, { title: "Asset Code", weight: 1 }, { title: "Asset", weight: 1.3 },
        { title: "Purchase Date", weight: 1 }, { title: "Purchase", weight: 1.2 }, { title: "Book Value", weight: 1.2 },
        { title: "Difference", weight: 1.2 }, { title: "Useful Life", weight: 0.9 }, { title: "Method", weight: 1.1 },
        { title: "Warranty", weight: 1 },
      ], rows: rows.map((a) => [a.company?.name, a.assetCode, a.name, a.purchaseDate, pdfMoney(a.purchasePrice), pdfMoney(a.currentValue), pdfMoney(Number(a.purchasePrice || 0) - Number(a.currentValue || 0)), `${a.usefulLifeYears} years`, a.depreciationMethod, a.warrantyExpiry]) }] });
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/categories.pdf", async (req, res, next) => {
  try {
    const rows: any[] = await AssetCategory.findAll({ where: exportWhere(req, "categories"),  include: [{ model: Company, as: "company" }], order: [["name", "ASC"]] });
    sendPdfReport(res, { title: "Asset Category Register", filename: "assetflow-categories.pdf",
      summary: [`Categories: ${rows.length}`], sections: [{ columns: cols("Company", "Category", "Useful Life (years)", "Depreciation Method", "Created"),
      rows: rows.map((c) => [c.company?.name, c.name, c.usefulLifeYears, c.depreciationMethod, c.createdAt]) }] });
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/companies.pdf", async (req, res, next) => {
  try {
    const rows: any[] = await Company.findAll({ where: exportWhere(req, "companies"),  order: [["name", "ASC"]] });
    sendPdfReport(res, { title: "Company Register", filename: "assetflow-companies.pdf", landscape: true,
      summary: [`Companies: ${rows.length}`], sections: [{ columns: cols("Company", "Code", "Contact", "Email", "Phone", "Address", "Status", "Created"),
      rows: rows.map((c) => [c.name, c.code, c.contactPerson, c.email, c.phone, c.address, c.status, c.createdAt]) }] });
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/companies.csv", async (req, res, next) => {
  try {
    const rows: any[] = await Company.findAll({ where: exportWhere(req, "companies"),  order: [["name", "ASC"]] });
    sendCsv(res, "assetflow-companies.csv", ["Company", "Code", "Contact", "Email", "Phone", "Address", "Status", "Created"],
      rows.map((c) => [c.name, c.code, c.contactPerson, c.email, c.phone, c.address, c.status, c.createdAt]));
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/categories.csv", async (req, res, next) => {
  try {
    const rows: any[] = await AssetCategory.findAll({ where: exportWhere(req, "categories"),  include: [{ model: Company, as: "company" }], order: [["name", "ASC"]] });
    sendCsv(res, "assetflow-categories.csv", ["Company", "Category", "Useful Life", "Method", "Created"],
      rows.map((c) => [c.company?.name, c.name, c.usefulLifeYears, c.depreciationMethod, c.createdAt]));
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/users.pdf", async (req, res, next) => {
  try {
    const rows: any[] = await User.findAll({ where: exportWhere(req, "users"),  attributes: ["id", "name", "email", "status", "createdAt", "lastLoginAt", "roleId"], include: [Role], order: [["name", "ASC"]] });
    sendPdfReport(res, { title: "User Access Register", filename: "assetflow-users.pdf",
      summary: [`User accounts: ${rows.length}`], sections: [{ columns: cols("Name", "Email", "Role", "Status", "Created", "Last Login"),
      rows: rows.map((u) => [u.name, u.email, u.Role?.name, u.status, u.createdAt, u.lastLoginAt]) }] });
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/audit-logs.pdf", async (req, res, next) => {
  try {
    const rows: any[] = await AuditLog.findAll({ where: exportWhere(req, "audit"),  order: [["createdAt", "DESC"]], limit: 500 });
    sendPdfReport(res, { title: "Audit Activity Report", filename: "assetflow-audit-logs.pdf", landscape: true,
      subtitle: "The most recent 500 activities (newest first)", summary: [`Included activities: ${rows.length}`],
      sections: [{ columns: cols("Date", "User", "Action", "Module", "Record", "IP Address"),
      rows: rows.map((r) => [r.createdAt, r.userName, r.action, r.module, r.recordId, r.ipAddress]) }] });
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/audit-logs.csv", async (req, res, next) => {
  try {
    const rows: any[] = await AuditLog.findAll({ where: exportWhere(req, "audit"),  order: [["createdAt", "DESC"]], limit: 500 });
    sendCsv(res, "assetflow-audit-logs.csv", ["Date", "User", "Action", "Module", "Record", "IP Address"],
      rows.map((r) => [r.createdAt, r.userName, r.action, r.module, r.recordId, r.ipAddress]));
  } catch (error) { onError(next, error); }
});

exportRoutes.get("/users.csv", async (req, res, next) => {
  try {
    const rows: any[] = await User.findAll({ where: exportWhere(req, "users"),  attributes: ["id", "name", "email", "status", "createdAt", "lastLoginAt", "roleId"], include: [Role], order: [["name", "ASC"]] });
    sendCsv(res, "assetflow-users.csv", ["Name", "Email", "Role", "Status", "Created", "Last Login"],
      rows.map((u) => [u.name, u.email, u.Role?.name, u.status, u.createdAt, u.lastLoginAt]));
  } catch (error) { onError(next, error); }
});


// CSV downloads use exactly the same backend predicates as the corresponding filtered PDFs.
exportRoutes.get("/employees.csv", async (req, res, next) => { try {
  const rows: any[] = await Employee.findAll({ where: exportWhere(req, "employees"), include: [{ model: Company, as: "companies", ...companyOnEmployee(req) }, Location], order: [["employeeCode", "ASC"]] });
  sendCsv(res, "assetflow-employees.csv", ["Code", "Name", "Company", "Email", "Phone", "Designation", "Joining Date", "Status"],
    rows.map((e) => [e.employeeCode, e.name, (e.companies || []).map((c: any) => c.code).join(", "), e.email, e.phone, e.designation, e.joiningDate, e.status]));
} catch (e) { next(e); } });
exportRoutes.get("/vendors.csv", async (req, res, next) => { try {
  const rows: any[] = await Vendor.findAll({ where: exportWhere(req, "vendors"), include: [{ model: Company, as: "company" }], order: [["name", "ASC"]] });
  sendCsv(res, "assetflow-vendors.csv", ["Company", "Name", "Contact", "Phone", "Email", "Status", "Created"],
    rows.map((v) => [v.company?.name, v.name, v.contactPerson, v.phone, v.email, v.status, v.createdAt]));
} catch (e) { next(e); } });
exportRoutes.get("/purchases.csv", async (req, res, next) => { try {
  const rows: any[] = await Purchase.findAll({ where: exportWhere(req, "purchases"), include: [{ model: Company, as: "company" }, Vendor], order: [["purchaseDate", "DESC"]] });
  sendCsv(res, "assetflow-purchases.csv", ["Company", "Invoice", "Vendor", "Purchase Date", "Amount", "Payment Status"],
    rows.map((x) => [x.company?.name, x.invoiceNumber, x.Vendor?.name, x.purchaseDate, x.totalAmount, x.paymentStatus]));
} catch (e) { next(e); } });
exportRoutes.get("/assignments.csv", async (req, res, next) => { try {
  const rows: any[] = await AssetAssignment.findAll({ subQuery: false, where: exportWhere(req, "assignments"), include: [{ model: Asset, ...companyOnAsset(req) }, Employee], order: [["assignedAt", "DESC"]] });
  sendCsv(res, "assetflow-assignments.csv", ["Asset", "Employee", "Assigned", "Condition", "Returned"],
    rows.map((x) => [x.Asset?.assetCode, x.Employee?.name, x.assignedAt, x.conditionAtAssign, x.returnedAt]));
} catch (e) { next(e); } });
exportRoutes.get("/returns.csv", async (req, res, next) => { try {
  const rows: any[] = await AssetReturn.findAll({ subQuery: false, where: exportWhere(req, "returns"), include: [{ model: Asset, ...companyOnAsset(req) }, Employee], order: [["createdAt", "DESC"]] });
  sendCsv(res, "assetflow-returns.csv", ["Asset", "Employee", "Return Date", "Status", "Condition", "Penalty"],
    rows.map((x) => [x.Asset?.assetCode, x.Employee?.name, x.createdAt, x.returnStatus, x.returnCondition, x.penaltyAmount]));
} catch (e) { next(e); } });
exportRoutes.get("/repairs.csv", async (req, res, next) => { try {
  const rows: any[] = await RepairTicket.findAll({ subQuery: false, where: exportWhere(req, "repairs"), include: [{ model: Asset, ...companyOnAsset(req) }, Vendor], order: [["reportedAt", "DESC"]] });
  sendCsv(res, "assetflow-repairs.csv", ["Ticket", "Asset", "Problem", "Vendor", "Reported", "Cost", "Status"],
    rows.map((x) => [x.ticketCode, x.Asset?.assetCode, x.problem, x.Vendor?.name, x.reportedAt, x.repairCost, x.status]));
} catch (e) { next(e); } });
exportRoutes.get("/finance.csv", async (req, res, next) => { try {
  const rows: any[] = await Asset.findAll({ where: exportWhere(req, "finance"), include: assetIncludes, order: [["purchaseDate", "DESC"]] });
  sendCsv(res, "assetflow-finance.csv", ["Asset", "Name", "Purchase Date", "Purchase Price", "Book Value", "Method", "Useful Life"],
    rows.map((x) => [x.assetCode, x.name, x.purchaseDate, x.purchasePrice, x.currentValue, x.depreciationMethod, x.usefulLifeYears]));
} catch (e) { next(e); } });
