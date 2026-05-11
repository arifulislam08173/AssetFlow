import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { requireAuth } from "./middlewares/auth.middleware";
import { authRoutes } from "./modules/auth/auth.routes";
import { assetRoutes } from "./modules/assets/asset.routes";
import { employeeRoutes } from "./modules/employees/employee.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { auditRoutes } from "./modules/audit-logs/audit.routes";
import { vendorRoutes } from "./modules/vendors/vendor.routes";
import { purchaseRoutes } from "./modules/purchases/purchase.routes";
import { repairRoutes } from "./modules/repairs/repair.routes";
import { reportRoutes } from "./modules/reports/report.routes";
import { userRoutes } from "./modules/users/user.routes";
import { masterRoutes } from "./modules/master/master.routes";
import { companyRoutes } from "./modules/companies/company.routes";
import { categoryRoutes } from "./modules/categories/category.routes";
import { assignmentRoutes } from "./modules/assignments/assignment.routes";
import { returnRoutes } from "./modules/returns/return.routes";
import { scannerRoutes } from "./modules/scanner/scanner.routes";
import { exportRoutes } from "./modules/exports/export.routes";
import { requirePermission } from "./middlewares/auth.middleware";

export const app = express();

function requireModuleAction(moduleName: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method === "GET") return requirePermission(`${moduleName}.view`)(req, res, next);
    if (req.method === "POST") return requirePermission(`${moduleName}.create`)(req, res, next);
    if (["PATCH", "PUT"].includes(req.method)) return requirePermission(`${moduleName}.update`)(req, res, next);
    if (req.method === "DELETE") return requirePermission(`${moduleName}.delete`)(req, res, next);
    return requirePermission(`${moduleName}.view`)(req, res, next);
  };
}


app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  // Higher limit in development so accidental frontend refresh loops do not block you while coding.
  limit: env.nodeEnv === "development" ? 5000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please wait a moment and try again." },
}));

app.get("/health", (_req, res) => res.json({ success: true, message: "AssetFlow API is running" }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/dashboard", requireAuth, dashboardRoutes);
app.use("/api/v1/assets", requireAuth, requireModuleAction("assets"), assetRoutes);
app.use("/api/v1/employees", requireAuth, requireModuleAction("employees"), employeeRoutes);
app.use("/api/v1/vendors", requireAuth, requireModuleAction("vendors"), vendorRoutes);
app.use("/api/v1/purchases", requireAuth, requireModuleAction("purchases"), purchaseRoutes);
app.use("/api/v1/repairs", requireAuth, requireModuleAction("repairs"), repairRoutes);
app.use("/api/v1/reports", requireAuth, requirePermission("reports.view"), reportRoutes);
app.use("/api/v1/audit-logs", requireAuth, requirePermission("audit_logs.view"), auditRoutes);
app.use("/api/v1/users", requireAuth, requireModuleAction("users"), userRoutes);
app.use("/api/v1/companies", requireAuth, requireModuleAction("companies"), companyRoutes);
app.use("/api/v1/categories", requireAuth, requireModuleAction("categories"), categoryRoutes);
app.use("/api/v1/assignments", requireAuth, requireModuleAction("assignments"), assignmentRoutes);
app.use("/api/v1/returns", requireAuth, requireModuleAction("returns"), returnRoutes);
app.use("/api/v1/scanner", requireAuth, requirePermission("scanner.use"), scannerRoutes);
app.use("/api/v1/exports", requireAuth, requirePermission("reports.export"), exportRoutes);
app.use("/api/v1/master", requireAuth, masterRoutes);

app.use((_req, res) => res.status(404).json({ success: false, message: "API route not found" }));
app.use(errorMiddleware);
