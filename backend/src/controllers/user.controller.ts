import { Router } from "express";
import { z } from "zod";
import { Role, User, hashPassword } from "../models";
import { created, ok } from "../utils/api-response";
import { ApiError } from "../utils/errors";
import { getPagination, getPagingMeta } from "../utils/pagination";
import { writeAudit } from "../services/audit.service";

export const userRoutes = Router();
const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  roleId: z.string().uuid(),
  permissions: z.array(z.string()).default([]),
  status: z.string().default("Active"),
});
const updateSchema = createSchema.partial();

userRoutes.get("/", async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const { rows, count } = await User.findAndCountAll({
      include: [Role],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    ok(res, "Users fetched successfully", rows, getPagingMeta(count, page, limit));
  }
  catch (error) {
    next(error);
  }
});

userRoutes.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const user = await User.create({
      name: body.name,
      email: body.email,
      passwordHash: await hashPassword(body.password),
      roleId: body.roleId,
      permissions: body.permissions,
      status: body.status,
    } as any);
    await writeAudit(req, {
      action: "Created",
      module: "Users",
      recordId: user.id,
      afterSnapshot: {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        permissions: (user as any).permissions || [],
      },
    });
    created(res, "User created successfully", user);
  }
  catch (error) {
    next(error);
  }
});

userRoutes.get("/roles", async (_req, res, next) => {
  try {
    ok(res, "Roles fetched successfully", await Role.findAll({ order: [["name", "ASC"]] }));
  }
  catch (e) {
    next(e);
  }
});
const roleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()).default([]),
});

userRoutes.post("/roles", async (req, res, next) => {
  try {
    const body = roleSchema.parse(req.body);
    const role = await Role.create(body as any);
    await writeAudit(req, {
      action: "Created",
      module: "Roles",
      recordId: role.id,
      afterSnapshot: role.toJSON(),
    });
    created(res, "Role created successfully", role);
  }
  catch (e) {
    next(e);
  }
});

userRoutes.patch("/roles/:id", async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role)
      throw new ApiError(404, "Role not found");
    const before = role.toJSON();
    await role.update(roleSchema.partial().parse(req.body));
    await writeAudit(req, {
      action: "Updated",
      module: "Roles",
      recordId: role.id,
      beforeSnapshot: before,
      afterSnapshot: role.toJSON(),
    });
    ok(res, "Role updated successfully", role);
  }
  catch (e) {
    next(e);
  }
});

userRoutes.delete("/roles/:id", async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role)
      throw new ApiError(404, "Role not found");
    const before = role.toJSON();
    await role.destroy();
    await writeAudit(req, {
      action: "Deleted",
      module: "Roles",
      recordId: role.id,
      beforeSnapshot: before,
    });
    ok(res, "Role deleted successfully");
  }
  catch (e) {
    next(e);
  }
});

userRoutes.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, { include: [Role] });
    if (!user)
      throw new ApiError(404, "User not found");
    ok(res, "User fetched successfully", user);
  }
  catch (error) {
    next(error);
  }
});

userRoutes.patch("/:id", async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user)
      throw new ApiError(404, "User not found");
    const before = user.toJSON();
    const payload: any = updateSchema.parse(req.body);
    if (payload.password) {
      payload.passwordHash = await hashPassword(payload.password);
      delete payload.password;
    }
    await user.update(payload);
    await writeAudit(req, {
      action: "Updated",
      module: "Users",
      recordId: user.id,
      beforeSnapshot: before,
      afterSnapshot: user.toJSON(),
    });
    ok(res, "User updated successfully", user);
  }
  catch (error) {
    next(error);
  }
});
