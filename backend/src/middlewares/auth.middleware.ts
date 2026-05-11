import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User, Role } from "../models";
import { ApiError } from "../utils/errors";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      auth?: { userId: string; role?: string; permissions?: string[] };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new ApiError(401, "Missing access token");
    const token = header.replace("Bearer ", "");
    const payload = jwt.verify(token, env.jwt.accessSecret) as { sub: string };
    const user = await User.findByPk(payload.sub, { include: [Role] });
    if (!user || user.status !== "Active") throw new ApiError(401, "Invalid or inactive user");
    const role = (user as any).Role as Role | undefined;
    req.user = user;
    const rolePermissions = role?.permissions || [];
    const userPermissions = ((user as any).permissions || []) as string[];
    // If a user has custom permissions, those permissions override the role.
    // This lets an admin create a read-only user even if the selected role has broader access.
    const effectivePermissions = userPermissions.length > 0 ? userPermissions : rolePermissions;
    req.auth = {
      userId: user.id,
      role: role?.name,
      permissions: Array.from(new Set(effectivePermissions)),
    };
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, "Invalid access token"));
  }
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const permissions = req.auth?.permissions || [];
    const namespace = permission.split(".")[0];
    if (
      permissions.includes("*") ||
      permissions.includes(permission) ||
      permissions.includes(`${namespace}.*`)
    ) return next();
    next(new ApiError(403, "You do not have permission for this action"));
  };
}
