import { Response } from "express";

export function ok(res: Response, message: string, data: unknown = null, meta?: unknown) {
  return res.json({ success: true, message, data, ...(meta ? { meta } : {}) });
}

export function created(res: Response, message: string, data: unknown = null) {
  return res.status(201).json({ success: true, message, data });
}
