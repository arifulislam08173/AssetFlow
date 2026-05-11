"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.masterRoutes = void 0;
const express_1 = require("express");
const models_1 = require("../../models");
const api_response_1 = require("../../utils/api-response");
exports.masterRoutes = (0, express_1.Router)();
exports.masterRoutes.get("/options", async (_req, res, next) => {
    try {
        const [roles, departments, locations, categories, vendors] = await Promise.all([
            models_1.Role.findAll({ order: [["name", "ASC"]] }),
            models_1.Department.findAll({ order: [["name", "ASC"]] }),
            models_1.Location.findAll({ order: [["name", "ASC"]] }),
            models_1.AssetCategory.findAll({ order: [["name", "ASC"]] }),
            models_1.Vendor.findAll({ order: [["name", "ASC"]] }),
        ]);
        (0, api_response_1.ok)(res, "Master options fetched successfully", { roles, departments, locations, categories, vendors });
    }
    catch (error) {
        next(error);
    }
});
