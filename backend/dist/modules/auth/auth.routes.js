"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const env_1 = require("../../config/env");
const models_1 = require("../../models");
const api_response_1 = require("../../utils/api-response");
const errors_1 = require("../../utils/errors");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const audit_service_1 = require("../audit-logs/audit.service");
exports.authRoutes = (0, express_1.Router)();
const loginSchema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(6) });
function signAccess(user) {
    const options = { expiresIn: env_1.env.jwt.accessExpiresIn };
    return jsonwebtoken_1.default.sign({ sub: user.id }, env_1.env.jwt.accessSecret, options);
}
function signRefresh(user) {
    const options = { expiresIn: env_1.env.jwt.refreshExpiresIn };
    return jsonwebtoken_1.default.sign({ sub: user.id, type: "refresh" }, env_1.env.jwt.refreshSecret, options);
}
async function saveRefreshToken(user, token) {
    const decoded = jsonwebtoken_1.default.decode(token);
    await models_1.RefreshToken.create({
        userId: user.id,
        tokenHash: await bcryptjs_1.default.hash(token, 10),
        expiresAt: new Date((decoded?.exp || Math.floor(Date.now() / 1000) + 604800) * 1000),
    });
}
exports.authRoutes.post("/login", async (req, res, next) => {
    try {
        const body = loginSchema.parse(req.body);
        const user = await models_1.User.scope("withPassword").findOne({ where: { email: body.email }, include: [models_1.Role] });
        if (!user || !(await user.validatePassword(body.password)))
            throw new errors_1.ApiError(401, "Invalid email or password");
        if (user.status !== "Active")
            throw new errors_1.ApiError(403, "User is inactive");
        await user.update({ lastLoginAt: new Date() });
        const accessToken = signAccess(user);
        const refreshToken = signRefresh(user);
        await saveRefreshToken(user, refreshToken);
        res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: "lax", secure: env_1.env.nodeEnv === "production", maxAge: 7 * 24 * 60 * 60 * 1000 });
        await (0, audit_service_1.writeAudit)(req, { action: "Login", module: "Auth", recordId: user.id, afterSnapshot: { email: user.email } });
        const safeUser = user.toJSON();
        delete safeUser.passwordHash;
        (0, api_response_1.ok)(res, "Login successful", { accessToken, user: safeUser });
    }
    catch (error) {
        next(error);
    }
});
exports.authRoutes.post("/refresh-token", async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken || req.body.refreshToken;
        if (!token)
            throw new errors_1.ApiError(401, "Missing refresh token");
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwt.refreshSecret);
        const user = await models_1.User.findByPk(payload.sub);
        if (!user)
            throw new errors_1.ApiError(401, "Invalid refresh token");
        const storedTokens = await models_1.RefreshToken.findAll({ where: { userId: user.id, revokedAt: null } });
        const matches = await Promise.all(storedTokens.map((item) => bcryptjs_1.default.compare(token, item.tokenHash)));
        if (!matches.some(Boolean))
            throw new errors_1.ApiError(401, "Refresh token was revoked");
        (0, api_response_1.ok)(res, "Token refreshed", { accessToken: signAccess(user) });
    }
    catch (error) {
        next(error);
    }
});
exports.authRoutes.post("/logout", auth_middleware_1.requireAuth, async (req, res, next) => {
    try {
        await models_1.RefreshToken.update({ revokedAt: new Date() }, { where: { userId: req.user.id, revokedAt: null } });
        res.clearCookie("refreshToken");
        await (0, audit_service_1.writeAudit)(req, { action: "Logout", module: "Auth", recordId: req.user.id });
        (0, api_response_1.ok)(res, "Logout successful");
    }
    catch (error) {
        next(error);
    }
});
exports.authRoutes.get("/me", auth_middleware_1.requireAuth, async (req, res) => (0, api_response_1.ok)(res, "Profile fetched", req.user));
