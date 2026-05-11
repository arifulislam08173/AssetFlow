"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 5000),
    clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
    db: {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || "assetflow_db",
        user: process.env.DB_USER || "assetflow_user",
        password: process.env.DB_PASSWORD || "assetflow_password",
        ssl: process.env.DB_SSL === "true",
    },
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me",
        refreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me",
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
};
