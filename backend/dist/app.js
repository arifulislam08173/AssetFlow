"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middlewares/error.middleware");
const auth_middleware_1 = require("./middlewares/auth.middleware");
const auth_routes_1 = require("./modules/auth/auth.routes");
const asset_routes_1 = require("./modules/assets/asset.routes");
const employee_routes_1 = require("./modules/employees/employee.routes");
const dashboard_routes_1 = require("./modules/dashboard/dashboard.routes");
const audit_routes_1 = require("./modules/audit-logs/audit.routes");
const vendor_routes_1 = require("./modules/vendors/vendor.routes");
const purchase_routes_1 = require("./modules/purchases/purchase.routes");
const repair_routes_1 = require("./modules/repairs/repair.routes");
const report_routes_1 = require("./modules/reports/report.routes");
const user_routes_1 = require("./modules/users/user.routes");
const master_routes_1 = require("./modules/master/master.routes");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)({ origin: env_1.env.clientUrl, credentials: true }));
exports.app.use((0, helmet_1.default)());
exports.app.use((0, compression_1.default)());
exports.app.use((0, cookie_parser_1.default)());
exports.app.use(express_1.default.json({ limit: "10mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use((0, morgan_1.default)(env_1.env.nodeEnv === "development" ? "dev" : "combined"));
exports.app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    // Higher limit in development so accidental frontend refresh loops do not block you while coding.
    limit: env_1.env.nodeEnv === "development" ? 5000 : 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please wait a moment and try again." },
}));
exports.app.get("/health", (_req, res) => res.json({ success: true, message: "AssetFlow API is running" }));
exports.app.use("/api/v1/auth", auth_routes_1.authRoutes);
exports.app.use("/api/v1/dashboard", auth_middleware_1.requireAuth, dashboard_routes_1.dashboardRoutes);
exports.app.use("/api/v1/assets", auth_middleware_1.requireAuth, asset_routes_1.assetRoutes);
exports.app.use("/api/v1/employees", auth_middleware_1.requireAuth, employee_routes_1.employeeRoutes);
exports.app.use("/api/v1/vendors", auth_middleware_1.requireAuth, vendor_routes_1.vendorRoutes);
exports.app.use("/api/v1/purchases", auth_middleware_1.requireAuth, purchase_routes_1.purchaseRoutes);
exports.app.use("/api/v1/repairs", auth_middleware_1.requireAuth, repair_routes_1.repairRoutes);
exports.app.use("/api/v1/reports", auth_middleware_1.requireAuth, report_routes_1.reportRoutes);
exports.app.use("/api/v1/audit-logs", auth_middleware_1.requireAuth, audit_routes_1.auditRoutes);
exports.app.use("/api/v1/users", auth_middleware_1.requireAuth, user_routes_1.userRoutes);
exports.app.use("/api/v1/master", auth_middleware_1.requireAuth, master_routes_1.masterRoutes);
exports.app.use((_req, res) => res.status(404).json({ success: false, message: "API route not found" }));
exports.app.use(error_middleware_1.errorMiddleware);
