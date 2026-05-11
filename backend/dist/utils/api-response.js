"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.created = created;
function ok(res, message, data = null, meta) {
    return res.json({ success: true, message, data, ...(meta ? { meta } : {}) });
}
function created(res, message, data = null) {
    return res.status(201).json({ success: true, message, data });
}
