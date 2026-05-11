import { Router } from "express";
import { AssetCategory, Company, Department, Location, Role, Vendor } from "../../models";
import { ok } from "../../utils/api-response";

export const masterRoutes = Router();
masterRoutes.get("/options", async (req, res, next) => {
  try {
    const companyId = req.query.companyId ? String(req.query.companyId) : undefined;
        const [companies, roles, departments, locations, categories, vendors] = await Promise.all([
      Company.findAll({ order: [["name", "ASC"]] }),
      Role.findAll({ order: [["name", "ASC"]] }),
      Department.findAll({ order: [["name", "ASC"]] }),
      Location.findAll({ order: [["name", "ASC"]] }),
      AssetCategory.findAll({ order: [["name", "ASC"]] }),
      Vendor.findAll({ where: companyId ? ({ companyId } as any) : undefined, order: [["name", "ASC"]] }),
    ]);
    ok(res, "Master options fetched successfully", { companies, roles, departments, locations, categories, vendors });
  } catch (error) { next(error); }
});
