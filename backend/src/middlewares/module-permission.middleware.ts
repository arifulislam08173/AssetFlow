import type { NextFunction, Request, Response } from "express";
import { requirePermission } from "./auth.middleware";

export function requireModuleAction(moduleName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === "GET")
      return requirePermission(`${moduleName}.view`)(req, res, next);
    if (req.method === "POST")
      return requirePermission(`${moduleName}.create`)(req, res, next);
    if (["PATCH", "PUT"].includes(req.method))
      return requirePermission(`${moduleName}.update`)(req, res, next);
    if (req.method === "DELETE")
      return requirePermission(`${moduleName}.delete`)(req, res, next);
    return requirePermission(`${moduleName}.view`)(req, res, next);
  };
}
