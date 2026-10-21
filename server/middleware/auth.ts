import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { pool } from "../db/mysql/connection.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: "ADMIN" | "USER";
  sessionId?: string;
  csrfToken?: string;
}

export function generateToken(payload: { sessionId: string; userId: string; role?: string }): string {
  return jwt.sign(payload, env.auth.jwtSecret, { expiresIn: "7d" });
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function setAuthCookies(res: Response, token: string): string {
  const csrfToken = generateCsrfToken();
  res.cookie("evolve_token", token, {
    httpOnly: true,
    secure: env.auth.cookieSecure,
    sameSite: env.auth.cookieSameSite,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie("evolve_csrf", csrfToken, {
    httpOnly: false,
    secure: env.auth.cookieSecure,
    sameSite: env.auth.cookieSameSite,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return csrfToken;
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("evolve_token", { path: "/" });
  res.clearCookie("evolve_csrf", { path: "/" });
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.evolve_token;

  if (!token) {
    res.status(401).json({ error: "authentication required" });
    return;
  }

  // Verify CSRF token on mutating requests authenticated via cookie
  const mutatingMethods = ["POST", "PUT", "DELETE", "PATCH"];
  const method = (req.method || "GET").toUpperCase();
  if (mutatingMethods.includes(method)) {
    const headerCsrf = req.headers["x-csrf-token"];
    const cookieCsrf = req.cookies?.evolve_csrf;
    if (!headerCsrf || !cookieCsrf || headerCsrf !== cookieCsrf) {
      res.status(403).json({ error: "invalid or missing CSRF token" });
      return;
    }
  }

  let decoded: { sessionId?: string; userId?: string; role?: string };
  try {
    decoded = jwt.verify(token, env.auth.jwtSecret) as any;
  } catch (_err) {
    clearAuthCookies(res);
    res.status(401).json({ error: "invalid or expired token" });
    return;
  }

  if (!decoded?.userId || !decoded?.sessionId) {
    clearAuthCookies(res);
    res.status(401).json({ error: "invalid token payload: missing sessionId" });
    return;
  }

  // Validate active session and fresh user state from MySQL on EVERY request
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT u.id, u.role, s.id as session_id
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ? AND s.user_id = ? AND s.expires_at > NOW()`,
      [decoded.sessionId, decoded.userId]
    );

    if (rows.length === 0) {
      clearAuthCookies(res);
      res.status(401).json({ error: "session expired, revoked or user no longer exists" });
      return;
    }

    const userRow = rows[0];
    req.userId = userRow.id;
    req.userRole = userRow.role; // Freshly checked from MySQL
    req.sessionId = userRow.session_id;
    next();
  } catch (dbErr) {
    console.error("Session verification database error:", dbErr);
    res.status(500).json({ error: "failed to verify authentication session" });
  }
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (req.userRole !== "ADMIN") {
    res.status(403).json({ error: "admin privileges required" });
    return;
  }

  try {
    const [rows] = await pool.query<any[]>(
      "SELECT access_admin FROM user_permissions WHERE user_id = ?",
      [req.userId]
    );

    if (rows.length > 0 && rows[0].access_admin === 0) {
      res.status(403).json({ error: "admin privileges restricted for this account" });
      return;
    }

    next();
  } catch (err) {
    console.error("Admin permission verification error:", err);
    res.status(500).json({ error: "failed to verify admin authorization" });
  }
}

export type PermissionKey =
  | "access_masters"
  | "access_goals"
  | "access_goal_planner"
  | "access_vision_board"
  | "access_gratitude"
  | "access_habits"
  | "access_overall_dashboard"
  | "access_habits_dashboard"
  | "access_music"
  | "access_admin";

const DEFAULT_PERMISSIONS: Record<PermissionKey, boolean> = {
  access_masters: true,
  access_goals: true,
  access_goal_planner: true,
  access_vision_board: true,
  access_gratitude: true,
  access_habits: true,
  access_overall_dashboard: true,
  access_habits_dashboard: true,
  access_music: true,
  access_admin: false,
};

export function requirePermission(permissionKey: PermissionKey) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({ error: "authentication required" });
      return;
    }

    // Admins always have access unless explicitly checking access_admin
    if (req.userRole === "ADMIN" && permissionKey !== "access_admin") {
      next();
      return;
    }

    try {
      const [rows] = await pool.query<any[]>(
        `SELECT ${permissionKey} FROM user_permissions WHERE user_id = ?`,
        [req.userId]
      );

      if (rows.length > 0) {
        if (rows[0][permissionKey] === 0) {
          res.status(403).json({ error: `access to ${permissionKey} module is restricted for this account` });
          return;
        }
      } else {
        const allowedByDefault = DEFAULT_PERMISSIONS[permissionKey] ?? false;
        if (!allowedByDefault) {
          res.status(403).json({ error: `access to ${permissionKey} module is restricted for this account` });
          return;
        }
      }

      next();
    } catch (err) {
      // Fail closed on database error: NEVER call next()
      console.error(`Permission check error for ${permissionKey}:`, err);
      res.status(500).json({ error: "failed to verify module authorization" });
    }
  };
}

export function protectAuthCrossOrigin(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  const secFetchSite = req.headers["sec-fetch-site"];

  if (secFetchSite === "cross-site") {
    res.status(403).json({ error: "cross-origin authentication requests are forbidden" });
    return;
  }

  if (origin) {
    const rawCorsOrigins = process.env.CORS_ALLOWED_ORIGINS ?? (env.isProd ? "" : "http://localhost:5173,http://127.0.0.1:5173");
    const allowedOrigins = rawCorsOrigins.split(",").map((o) => o.trim()).filter(Boolean);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      (!env.isProd && (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin) || /^http:\/\/localhost:\d+$/.test(origin)));

    if (!isAllowed) {
      res.status(403).json({ error: "cross-origin authentication requests are forbidden" });
      return;
    }
  }

  next();
}

// In-memory rate limiter for login attempts
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const loginRateLimitMap = new Map<string, RateLimitRecord>();

export function checkLoginRateLimit(identifier: string): { allowed: boolean; remainingWaitSec?: number } {
  const now = Date.now();
  const maxAttempts = 5;

  const record = loginRateLimitMap.get(identifier);
  if (!record || now > record.resetAt) {
    return { allowed: true };
  }

  if (record.count >= maxAttempts) {
    const remainingWaitSec = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remainingWaitSec };
  }

  return { allowed: true };
}

export function recordFailedLogin(identifier: string): void {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const record = loginRateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    loginRateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
  } else {
    record.count++;
  }
}

export function clearLoginRateLimit(identifier: string): void {
  loginRateLimitMap.delete(identifier);
}
