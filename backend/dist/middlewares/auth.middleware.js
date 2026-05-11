"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requirePermission = requirePermission;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const models_1 = require("../models");
const errors_1 = require("../utils/errors");
async function requireAuth(req, _res, next) {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer "))
            throw new errors_1.ApiError(401, "Missing access token");
        const token = header.replace("Bearer ", "");
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwt.accessSecret);
        const user = await models_1.User.findByPk(payload.sub, { include: [models_1.Role] });
        if (!user || user.status !== "Active")
            throw new errors_1.ApiError(401, "Invalid or inactive user");
        const role = user.Role;
        req.user = user;
        req.auth = { userId: user.id, role: role?.name, permissions: role?.permissions || [] };
        next();
    }
    catch (error) {
        next(error instanceof errors_1.ApiError ? error : new errors_1.ApiError(401, "Invalid access token"));
    }
}
function requirePermission(permission) {
    return (req, _res, next) => {
        if (req.auth?.permissions?.includes("*") || req.auth?.permissions?.includes(permission))
            return next();
        next(new errors_1.ApiError(403, "You do not have permission for this action"));
    };
}
