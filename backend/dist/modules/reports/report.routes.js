"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRoutes = void 0;
const express_1 = require("express");
const models_1 = require("../../models");
const api_response_1 = require("../../utils/api-response");
exports.reportRoutes = (0, express_1.Router)();
exports.reportRoutes.get("/assets", async (_req, res, next) => { try {
    const data = await models_1.Asset.findAll({ include: [{ model: models_1.AssetCategory, as: "category" }, { model: models_1.Vendor, as: "vendor" }, { model: models_1.Location, as: "location" }, { model: models_1.Employee, as: "assignedEmployee" }], order: [["assetCode", "ASC"]] });
    (0, api_response_1.ok)(res, "Asset inventory report generated", data);
}
catch (e) {
    next(e);
} });
exports.reportRoutes.get("/depreciation", async (_req, res, next) => { try {
    const data = await models_1.Asset.findAll({ attributes: ["assetCode", "name", "purchasePrice", "currentValue", "salvageValue", "usefulLifeYears", "depreciationMethod", "purchaseDate"], order: [["purchaseDate", "ASC"]] });
    (0, api_response_1.ok)(res, "Depreciation report generated", data);
}
catch (e) {
    next(e);
} });
