import { Router } from "express";
import { Op } from "sequelize";
import { z } from "zod";
import { Asset, Company, Department, Employee, EmployeeCompany, Location } from "../models";
import { created, ok } from "../utils/api-response";
import { ApiError } from "../utils/errors";
import { getPagination, getPagingMeta } from "../utils/pagination";
import { writeAudit } from "../services/audit.service";

export const employeeRoutes = Router();
const schema = z.object({ companyIds: z.array(z.string().uuid()).optional(), employeeCode: z.string().min(2), name: z.string().min(2), email: z.string().email(), phone: z.string().optional().nullable(), designation: z.string().min(2), departmentId: z.string().uuid(), locationId: z.string().uuid(), joiningDate: z.string(), status: z.string().optional(), clearanceStatus: z.string().optional() });

employeeRoutes.get("/", async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const search = String(req.query.search || "").trim();
    const where: any = {};
    if (search)
      where[Op.or] = [{ employeeCode: { [Op.iLike]: `%${search}%` } }, { name: { [Op.iLike]: `%${search}%` } }, { email: { [Op.iLike]: `%${search}%` } }];
    if (req.query.status)
      where.status = req.query.status;
    if (req.query.departmentId)
      where.departmentId = req.query.departmentId;
    const include: any[] = [Department, Location, { model: Company, as: "companies", through: { attributes: [] } }];
    if (req.query.companyId)
      include[2].where = { id: req.query.companyId };
    const { rows, count } = await Employee.findAndCountAll({ where, include, distinct: true, order: [["createdAt", "DESC"]], limit, offset });
    ok(res, "Employees fetched successfully", rows, getPagingMeta(count, page, limit));
  }
  catch (error) {
    next(error);
  }
});

employeeRoutes.post("/", async (req, res, next) => {
  try {
    const body = schema.parse(req.body);
    const { companyIds, ...employeeData } = body as any;
    const employee = await Employee.create(employeeData);
    if (companyIds?.length)
      await (employee as any).setCompanies(companyIds);
    await writeAudit(req, { action: "Created", module: "Employees", recordId: employee.id, afterSnapshot: employee.toJSON() });
    created(res, "Employee created successfully", employee);
  }
  catch (error) {
    next(error);
  }
});

employeeRoutes.get("/:id", async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id, { include: [Department, Location, Asset, { model: Company, as: "companies", through: { attributes: [] } }] });
    if (!employee)
      throw new ApiError(404, "Employee not found");
    ok(res, "Employee fetched successfully", employee);
  }
  catch (error) {
    next(error);
  }
});

employeeRoutes.patch("/:id", async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee)
      throw new ApiError(404, "Employee not found");
    const before = employee.toJSON();
    const { companyIds, ...employeeData } = req.body;
    await employee.update(employeeData);
    if (Array.isArray(companyIds))
      await (employee as any).setCompanies(companyIds);
    await writeAudit(req, { action: "Updated", module: "Employees", recordId: employee.id, beforeSnapshot: before, afterSnapshot: employee.toJSON() });
    ok(res, "Employee updated successfully", employee);
  }
  catch (error) {
    next(error);
  }
});

employeeRoutes.delete("/:id", async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee)
      throw new ApiError(404, "Employee not found");
    const before = employee.toJSON();
    await employee.destroy();
    await writeAudit(req, { action: "Deleted", module: "Employees", recordId: req.params.id, beforeSnapshot: before });
    ok(res, "Employee deleted successfully");
  }
  catch (error) {
    next(error);
  }
});

employeeRoutes.get("/:id/assets", async (req, res, next) => {
  try {
    const assets = await Asset.findAll({ where: { assignedEmployeeId: req.params.id } });
    ok(res, "Employee assets fetched successfully", assets);
  }
  catch (error) {
    next(error);
  }
});
