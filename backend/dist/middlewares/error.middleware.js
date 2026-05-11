"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const errors_1 = require("../utils/errors");
const errorMiddleware = (err, _req, res, _next) => {
    const statusCode = err instanceof errors_1.ApiError ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    if (statusCode >= 500)
        console.error(err);
    res.status(statusCode).json({ success: false, message });
};
exports.errorMiddleware = errorMiddleware;
