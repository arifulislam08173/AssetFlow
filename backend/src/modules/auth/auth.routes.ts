import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env";
import { RefreshToken, Role, User } from "../../models";
import { ok } from "../../utils/api-response";
import { ApiError } from "../../utils/errors";
import { requireAuth } from "../../middlewares/auth.middleware";

export const authRoutes = Router();
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

function signAccess(user: User) {
  const options: SignOptions = { expiresIn: env.jwt.accessExpiresIn as any };
  return jwt.sign({ sub: user.id }, env.jwt.accessSecret, options);
}
function signRefresh(user: User) {
  const options: SignOptions = { expiresIn: env.jwt.refreshExpiresIn as any };
  return jwt.sign({ sub: user.id, type: "refresh" }, env.jwt.refreshSecret, options);
}

async function saveRefreshToken(user: User, token: string) {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  await RefreshToken.create({
    userId: user.id,
    tokenHash: await bcrypt.hash(token, 10),
    expiresAt: new Date((decoded?.exp || Math.floor(Date.now() / 1000) + 604800) * 1000),
  } as any);
}

authRoutes.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.scope("withPassword").findOne({ where: { email: body.email }, include: [Role] });
    if (!user || !(await user.validatePassword(body.password))) throw new ApiError(401, "Invalid email or password");
    if (user.status !== "Active") throw new ApiError(403, "User is inactive");
    await user.update({ lastLoginAt: new Date() });
    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);
    await saveRefreshToken(user, refreshToken);
    res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: "lax", secure: env.nodeEnv === "production", maxAge: 7 * 24 * 60 * 60 * 1000 });
    const safeUser = user.toJSON() as any;
    delete safeUser.passwordHash;
    ok(res, "Login successful", { accessToken, user: safeUser });
  } catch (error) { next(error); }
});

authRoutes.post("/refresh-token", async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) throw new ApiError(401, "Missing refresh token");
    const payload = jwt.verify(token, env.jwt.refreshSecret) as { sub: string; type: string };
    const user = await User.findByPk(payload.sub);
    if (!user) throw new ApiError(401, "Invalid refresh token");
    const storedTokens = await RefreshToken.findAll({ where: { userId: user.id, revokedAt: null } });
    const matches = await Promise.all(storedTokens.map((item) => bcrypt.compare(token, item.tokenHash)));
    if (!matches.some(Boolean)) throw new ApiError(401, "Refresh token was revoked");
    ok(res, "Token refreshed", { accessToken: signAccess(user) });
  } catch (error) { next(error); }
});

authRoutes.post("/logout", requireAuth, async (req, res, next) => {
  try {
    await RefreshToken.update({ revokedAt: new Date() }, { where: { userId: req.user!.id, revokedAt: null } });
    res.clearCookie("refreshToken");
    ok(res, "Logout successful");
  } catch (error) { next(error); }
});

authRoutes.get("/me", requireAuth, async (req, res) => {
  const user = await User.findByPk(req.user!.id, { include: [Role] });
  const safeUser = user?.toJSON() as any;
  if (safeUser) delete safeUser.passwordHash;
  ok(res, "Profile fetched", {
    ...safeUser,
    permissions: req.auth?.permissions || [],
    roleName: req.auth?.role,
  });
});
