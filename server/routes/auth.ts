import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { pool } from "../db/mysql/connection.js";
import {
  requireAuth,
  generateToken,
  setAuthCookies,
  clearAuthCookies,
  protectAuthCrossOrigin,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

export const authRouter = express.Router();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/signup
// Self-signup: creates an account with status 'pending' without granting an authenticated session
authRouter.post("/signup", protectAuthCrossOrigin, async (req, res) => {
  try {
    const { name, email, password, phone, vibeName } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "full name is required" });
      return;
    }
    if (!email || typeof email !== "string" || !isValidEmail(email.trim())) {
      res.status(400).json({ error: "a valid email address is required" });
      return;
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "password must be at least 6 characters" });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = typeof phone === "string" && phone.trim() ? phone.trim() : null;
    const cleanVibe = typeof vibeName === "string" ? vibeName.trim() : null;

    // Check duplicate email
    const [existing] = await pool.query<any[]>(
      "SELECT id FROM users WHERE email = ?",
      [cleanEmail]
    );
    if (existing.length > 0) {
      res.status(409).json({ error: "email already registered" });
      return;
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const joinedDate = new Date().toISOString().split("T")[0];

    // Enforce role = 'USER' and status = 'pending' for self-signup
    await pool.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, status, vibe_name, joined_date)
       VALUES (?, ?, ?, ?, ?, 'USER', 'pending', ?, ?)`,
      [id, cleanName, cleanEmail, cleanPhone, passwordHash, cleanVibe, joinedDate]
    );

    // Create default permissions
    try {
      await pool.query(
        `INSERT INTO user_permissions (user_id, access_masters, access_goals, access_goal_planner, access_vision_board, access_gratitude, access_habits, access_overall_dashboard, access_habits_dashboard, access_music, access_admin)
         VALUES (?, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
        [id]
      );
    } catch (permErr) {
      console.warn("Could not insert default permissions:", permErr);
    }

    // Do NOT generate session or set cookies for pending self-signup!
    const userObj = {
      id,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone || undefined,
      role: "USER" as const,
      status: "pending" as const,
      vibeName: cleanVibe || undefined,
      joinedDate,
    };

    res.status(201).json({
      message: "Registration submitted successfully. Your account is pending administrator approval.",
      user: userObj,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "internal server error during signup" });
  }
});

// GET /api/auth/status
// Check public approval status for a user by email or user ID
authRouter.get("/status", async (req, res) => {
  try {
    const identifier = (req.query.identifier || req.query.email || req.query.id || "").toString().trim();
    if (!identifier) {
      res.status(400).json({ error: "identifier is required" });
      return;
    }

    const [rows] = await pool.query<any[]>(
      "SELECT id, name, email, phone, status FROM users WHERE email = ? OR id = ?",
      [identifier.toLowerCase(), identifier]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "user not found" });
      return;
    }

    const u = rows[0];
    res.json({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || undefined,
      status: u.status || "approved",
    });
  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({ error: "failed to check status" });
  }
});

// POST /api/auth/login
// Supports login with either User ID or email + password, enforcing approved status
authRouter.post("/login", protectAuthCrossOrigin, async (req, res) => {
  try {
    const identifier = (req.body.identifier || req.body.email || req.body.userId || "").trim();
    const { password } = req.body;

    if (!identifier || !password || typeof password !== "string") {
      res.status(400).json({ error: "identifier and password are required" });
      return;
    }

    const rateLimitKey = `${req.ip || "unknown"}_${identifier.toLowerCase()}`;
    const rateCheck = checkLoginRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: `Too many failed login attempts. Please try again in ${rateCheck.remainingWaitSec} seconds.`,
      });
      return;
    }

    // Support verification by email OR User ID
    const [rows] = await pool.query<any[]>(
      `SELECT id, name, email, phone, password_hash, role, status, avatar, vibe_name, joined_date
       FROM users WHERE email = ? OR id = ?`,
      [identifier.toLowerCase(), identifier]
    );

    if (rows.length === 0) {
      recordFailedLogin(rateLimitKey);
      res.status(401).json({ error: "invalid identifier or password" });
      return;
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      recordFailedLogin(rateLimitKey);
      res.status(401).json({ error: "invalid identifier or password" });
      return;
    }

    clearLoginRateLimit(rateLimitKey);

    // Enforce approval status check
    const userStatus = user.status || "approved";
    if (userStatus === "pending") {
      res.status(403).json({
        error: "Your account is pending administrator approval. Please wait until your account is approved before logging in.",
        code: "PENDING_APPROVAL",
        status: "pending",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || undefined,
          status: "pending",
        },
      });
      return;
    }

    if (userStatus === "rejected") {
      res.status(403).json({
        error: "Your registration request was rejected by an administrator.",
        code: "ACCOUNT_REJECTED",
        status: "rejected",
      });
      return;
    }

    // Fetch permissions
    let permissions: any = {};
    try {
      const [permRows] = await pool.query<any[]>(
        "SELECT * FROM user_permissions WHERE user_id = ?",
        [user.id]
      );
      if (permRows.length > 0) {
        permissions = permRows[0];
      }
    } catch (permErr) {
      console.warn("Could not query user_permissions:", permErr);
    }

    // Create revocable session record
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    try {
      await pool.query(
        "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
        [sessionId, user.id, expiresAt]
      );
    } catch (sessErr) {
      console.warn("Could not insert session row:", sessErr);
    }

    const token = generateToken({ sessionId, userId: user.id, role: user.role });
    const csrfToken = setAuthCookies(res, token);

    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || undefined,
      role: user.role,
      status: "approved" as const,
      avatar: user.avatar || undefined,
      vibeName: user.vibe_name || undefined,
      joinedDate: user.joined_date,
      accessMasters: permissions.access_masters !== undefined ? !!permissions.access_masters : true,
      accessGoals: permissions.access_goals !== undefined ? !!permissions.access_goals : true,
      accessGoalPlanner: permissions.access_goal_planner !== undefined ? !!permissions.access_goal_planner : true,
      accessVisionBoard: permissions.access_vision_board !== undefined ? !!permissions.access_vision_board : true,
      accessGratitude: permissions.access_gratitude !== undefined ? !!permissions.access_gratitude : true,
      accessHabits: permissions.access_habits !== undefined ? !!permissions.access_habits : true,
      accessOverallDashboard: permissions.access_overall_dashboard !== undefined ? !!permissions.access_overall_dashboard : true,
      accessHabitsDashboard: permissions.access_habits_dashboard !== undefined ? !!permissions.access_habits_dashboard : true,
      accessMusic: permissions.access_music !== undefined ? !!permissions.access_music : true,
      accessAdmin: permissions.access_admin !== undefined ? !!permissions.access_admin : user.role === "ADMIN",
    };

    res.json({
      csrfToken,
      user: userObj,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "internal server error during login" });
  }
});

// POST /api/auth/logout
authRouter.post("/logout", async (req, res) => {
  const token = req.cookies?.evolve_token;
  if (token) {
    try {
      const decoded = jwt.verify(token, env.auth.jwtSecret) as any;
      if (decoded?.sessionId) {
        await pool.query("DELETE FROM sessions WHERE id = ?", [decoded.sessionId]);
      }
    } catch {
      // Token expired or invalid; ignore and clear cookies
    }
  }
  clearAuthCookies(res);
  res.json({ message: "logged out successfully" });
});

// POST /api/auth/change-password
authRouter.post("/change-password", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      res.status(400).json({ error: "new password must be at least 6 characters" });
      return;
    }

    const [rows] = await pool.query<any[]>("SELECT password_hash FROM users WHERE id = ?", [req.userId]);
    if (rows.length === 0) {
      res.status(404).json({ error: "user not found" });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) {
      res.status(401).json({ error: "current password does not match" });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, req.userId]);

    // Revoke all existing sessions for this user on password reset
    await pool.query("DELETE FROM sessions WHERE user_id = ?", [req.userId]);

    // Issue a fresh new session for current user
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
      [sessionId, req.userId, expiresAt]
    );
    const token = generateToken({ sessionId, userId: req.userId!, role: req.userRole });
    const csrfToken = setAuthCookies(res, token);

    res.json({ message: "password updated successfully", csrfToken });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "failed to change password" });
  }
});

// GET /api/auth/me
authRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT id, name, email, phone, role, status, avatar, vibe_name, joined_date
       FROM users WHERE id = ?`,
      [req.userId]
    );

    if (rows.length === 0) {
      clearAuthCookies(res);
      res.status(401).json({ error: "user no longer exists" });
      return;
    }

    const user = rows[0];

    // Fetch permissions
    let permissions: any = {};
    try {
      const [permRows] = await pool.query<any[]>(
        "SELECT * FROM user_permissions WHERE user_id = ?",
        [user.id]
      );
      if (permRows.length > 0) {
        permissions = permRows[0];
      }
    } catch (permErr) {
      console.warn("Could not query user_permissions:", permErr);
    }

    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || undefined,
      role: user.role,
      status: (user.status || "approved") as "approved" | "pending" | "rejected",
      avatar: user.avatar || undefined,
      vibeName: user.vibe_name || undefined,
      joinedDate: user.joined_date,
      accessMasters: permissions.access_masters !== undefined ? !!permissions.access_masters : true,
      accessGoals: permissions.access_goals !== undefined ? !!permissions.access_goals : true,
      accessGoalPlanner: permissions.access_goal_planner !== undefined ? !!permissions.access_goal_planner : true,
      accessVisionBoard: permissions.access_vision_board !== undefined ? !!permissions.access_vision_board : true,
      accessGratitude: permissions.access_gratitude !== undefined ? !!permissions.access_gratitude : true,
      accessHabits: permissions.access_habits !== undefined ? !!permissions.access_habits : true,
      accessOverallDashboard: permissions.access_overall_dashboard !== undefined ? !!permissions.access_overall_dashboard : true,
      accessHabitsDashboard: permissions.access_habits_dashboard !== undefined ? !!permissions.access_habits_dashboard : true,
      accessMusic: permissions.access_music !== undefined ? !!permissions.access_music : true,
      accessAdmin: permissions.access_admin !== undefined ? !!permissions.access_admin : user.role === "ADMIN",
    };

    res.json({ user: userObj });
  } catch (err) {
    console.error("Get /me error:", err);
    res.status(500).json({ error: "internal server error fetching session" });
  }
});
