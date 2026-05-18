import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { registerRoutes } from "./routes";

export const app = express();
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
registerRoutes(app);
app.use((_req, res) => res.status(404).json({ success: false, message: "API route not found" }));
app.use(errorMiddleware);
