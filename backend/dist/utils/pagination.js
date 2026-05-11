"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPagination = getPagination;
exports.getPagingMeta = getPagingMeta;
function getPagination(req) {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}
function getPagingMeta(count, page, limit) {
    return { page, limit, total: count, totalPages: Math.ceil(count / limit) || 1 };
}
