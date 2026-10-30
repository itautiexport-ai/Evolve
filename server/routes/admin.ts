import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import {
  requireAuth,
  requireAdmin,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

export const adminRouter = express.Router();
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

// Helper to log admin actions
async function recordAdminLog(adminId: string, action: string, details: string): Promise<void> {
  try {
    const id = crypto.randomUUID();
    await pool.query(
      "INSERT INTO admin_logs (id, admin_id, action, details) VALUES (?, ?, ?, ?)",
      [id, adminId, action, details]
    );
  } catch (err) {
    console.warn("Could not insert admin log:", err);
  }
}

// GET /api/admin/users - list all users with their permissions, phone, and status
adminRouter.get("/users", async (_req: AuthenticatedRequest, res) => {
  try {
    const [users] = await pool.query<any[]>(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.avatar, u.vibe_name as vibeName,
              u.joined_date as joinedDate,
              p.access_masters as accessMasters,
              p.access_goals as accessGoals,
              p.access_goal_planner as accessGoalPlanner,
              p.access_vision_board as accessVisionBoard,
              p.access_gratitude as accessGratitude,
              p.access_habits as accessHabits,
              p.access_overall_dashboard as accessOverallDashboard,
              p.access_habits_dashboard as accessHabitsDashboard,
              p.access_music as accessMusic,
              p.access_admin as accessAdmin
       FROM users u
       LEFT JOIN user_permissions p ON u.id = p.user_id
       ORDER BY u.created_at ASC`
    );

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || undefined,
      role: u.role,
      status: (u.status || "approved") as "approved" | "pending" | "rejected",
      avatar: u.avatar || undefined,
      vibeName: u.vibeName || undefined,
      joinedDate: u.joinedDate,
      accessMasters: u.accessMasters !== null && u.accessMasters !== undefined ? !!u.accessMasters : true,
      accessGoals: u.accessGoals !== null && u.accessGoals !== undefined ? !!u.accessGoals : true,
      accessGoalPlanner: u.accessGoalPlanner !== null && u.accessGoalPlanner !== undefined ? !!u.accessGoalPlanner : true,
      accessVisionBoard: u.accessVisionBoard !== null && u.accessVisionBoard !== undefined ? !!u.accessVisionBoard : true,
      accessGratitude: u.accessGratitude !== null && u.accessGratitude !== undefined ? !!u.accessGratitude : true,
      accessHabits: u.accessHabits !== null && u.accessHabits !== undefined ? !!u.accessHabits : true,
      accessOverallDashboard: u.accessOverallDashboard !== null && u.accessOverallDashboard !== undefined ? !!u.accessOverallDashboard : true,
      accessHabitsDashboard: u.accessHabitsDashboard !== null && u.accessHabitsDashboard !== undefined ? !!u.accessHabitsDashboard : true,
      accessMusic: u.accessMusic !== null && u.accessMusic !== undefined ? !!u.accessMusic : true,
      accessAdmin: u.accessAdmin !== null && u.accessAdmin !== undefined ? !!u.accessAdmin : u.role === "ADMIN",
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Admin get users error:", err);
    res.status(500).json({ error: "failed to retrieve users" });
  }
});

// POST /api/admin/users - create new user with specified ID, role, status, and permissions
adminRouter.post("/users", async (req: AuthenticatedRequest, res) => {
  try {
    const { id: customId, name, email, phone, password, role, status, vibeName } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "name, email, and password are required" });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const [existingEmail] = await pool.query<any[]>("SELECT id FROM users WHERE email = ?", [cleanEmail]);
    if (existingEmail.length > 0) {
      res.status(409).json({ error: "user with this email already exists" });
      return;
    }

    const userId = customId?.trim() ? customId.trim() : crypto.randomUUID();
    const [existingId] = await pool.query<any[]>("SELECT id FROM users WHERE id = ?", [userId]);
    if (existingId.length > 0) {
      res.status(409).json({ error: `User ID "${userId}" already exists` });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === "ADMIN" ? "ADMIN" : "USER";
    const userStatus = status === "pending" ? "pending" : status === "rejected" ? "rejected" : "approved";
    const cleanPhone = typeof phone === "string" && phone.trim() ? phone.trim() : null;
    const joinedDate = new Date().toISOString().split("T")[0];

    await pool.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, status, vibe_name, joined_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name.trim(), cleanEmail, cleanPhone, passwordHash, userRole, userStatus, vibeName?.trim() || null, joinedDate]
    );

    // Create permissions
    await pool.query(
      `INSERT INTO user_permissions (user_id, access_masters, access_goals, access_goal_planner, access_vision_board, access_gratitude, access_habits, access_overall_dashboard, access_habits_dashboard, access_music, access_admin)
       VALUES (?, 1, 1, 1, 1, 1, 1, 1, 1, 1, ?)
       ON DUPLICATE KEY UPDATE access_admin = VALUES(access_admin)`,
      [userId, userRole === "ADMIN" ? 1 : 0]
    );

    await recordAdminLog(req.userId!, "USER_CREATED", `Created user ${name} (${cleanEmail}) with role ${userRole} and status ${userStatus}`);

    res.status(201).json({
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone || undefined,
      role: userRole,
      status: userStatus,
      vibeName: vibeName?.trim() || undefined,
      joinedDate,
    });
  } catch (err) {
    console.error("Admin create user error:", err);
    res.status(500).json({ error: "failed to create user" });
  }
});

// PATCH /api/admin/users/:id/status - approve or reject a user account
adminRouter.patch("/users/:id/status", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["approved", "pending", "rejected"].includes(status)) {
      res.status(400).json({ error: "valid status ('approved', 'pending', 'rejected') is required" });
      return;
    }

    const [existing] = await pool.query<any[]>("SELECT id, role, email, name FROM users WHERE id = ?", [id]);
    if (existing.length === 0) {
      res.status(404).json({ error: "user not found" });
      return;
    }

    // Prevent rejecting or setting pending on the last admin
    if (existing[0].role === "ADMIN" && status !== "approved") {
      const [adminCountRows] = await pool.query<any[]>(
        "SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN' AND status = 'approved'"
      );
      if (adminCountRows[0].count <= 1) {
        res.status(400).json({ error: "cannot change status of the only remaining active administrator" });
        return;
      }
    }

    await pool.query("UPDATE users SET status = ? WHERE id = ?", [status, id]);

    if (status !== "approved") {
      // Invalidate all active sessions for non-approved user
      await pool.query("DELETE FROM sessions WHERE user_id = ?", [id]);
    }

    await recordAdminLog(req.userId!, "USER_STATUS_UPDATED", `Updated status for user ${existing[0].name} (${id}) to ${status}`);

    res.json({ id, status, message: `User status updated to ${status}` });
  } catch (err) {
    console.error("Admin update status error:", err);
    res.status(500).json({ error: "failed to update user status" });
  }
});

// PUT /api/admin/users/:id - update user
adminRouter.put("/users/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, vibeName, role, status, password } = req.body;

    const [existing] = await pool.query<any[]>("SELECT * FROM users WHERE id = ?", [id]);
    if (existing.length === 0) {
      res.status(404).json({ error: "user not found" });
      return;
    }

    const targetUser = existing[0];

    // Prevent demoting the last admin
    if (targetUser.role === "ADMIN" && role === "USER") {
      const [adminCountRows] = await pool.query<any[]>(
        "SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'"
      );
      if (adminCountRows[0].count <= 1) {
        res.status(400).json({ error: "cannot demote the only remaining administrator" });
        return;
      }
    }

    const newRole = role === "ADMIN" ? "ADMIN" : role === "USER" ? "USER" : targetUser.role;
    const newStatus = ["approved", "pending", "rejected"].includes(status) ? status : targetUser.status || "approved";
    const newEmail = email && typeof email === "string" ? email.trim().toLowerCase() : targetUser.email;
    const newPhone = phone !== undefined ? (typeof phone === "string" && phone.trim() ? phone.trim() : null) : targetUser.phone;

    if (password && typeof password === "string" && password.trim().length >= 6) {
      const passwordHash = await bcrypt.hash(password.trim(), 10);
      await pool.query(
        "UPDATE users SET name = ?, email = ?, phone = ?, vibe_name = ?, role = ?, status = ?, password_hash = ? WHERE id = ?",
        [name ?? targetUser.name, newEmail, newPhone, vibeName ?? targetUser.vibe_name, newRole, newStatus, passwordHash, id]
      );
      // Invalidate all active sessions for this user on password reset
      await pool.query("DELETE FROM sessions WHERE user_id = ?", [id]);
    } else {
      await pool.query(
        "UPDATE users SET name = ?, email = ?, phone = ?, vibe_name = ?, role = ?, status = ? WHERE id = ?",
        [name ?? targetUser.name, newEmail, newPhone, vibeName ?? targetUser.vibe_name, newRole, newStatus, id]
      );
    }

    if (newStatus !== "approved") {
      // Invalidate active sessions if user is not approved
      await pool.query("DELETE FROM sessions WHERE user_id = ?", [id]);
    }

    // Keep access_admin in sync with role if role changed
    if (newRole === "ADMIN") {
      await pool.query(
        `INSERT INTO user_permissions (user_id, access_admin) VALUES (?, 1)
         ON DUPLICATE KEY UPDATE access_admin = 1`,
        [id]
      );
    }

    await recordAdminLog(req.userId!, "USER_UPDATED", `Updated user ${id} (Role: ${newRole}, Status: ${newStatus})`);

    res.json({
      id,
      name: name ?? targetUser.name,
      email: newEmail,
      phone: newPhone || undefined,
      role: newRole,
      status: newStatus,
      vibeName: vibeName ?? targetUser.vibe_name,
    });
  } catch (err) {
    console.error("Admin update user error:", err);
    res.status(500).json({ error: "failed to update user" });
  }
});

// DELETE /api/admin/users/:id - delete user
adminRouter.delete("/users/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (id === req.userId) {
      res.status(400).json({ error: "cannot delete your own active administrator account" });
      return;
    }

    // Check if target is admin and if it's the last admin
    const [target] = await pool.query<any[]>("SELECT role, email FROM users WHERE id = ?", [id]);
    if (target.length === 0) {
      res.status(404).json({ error: "user not found" });
      return;
    }

    if (target[0].role === "ADMIN") {
      const [adminCountRows] = await pool.query<any[]>(
        "SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'"
      );
      if (adminCountRows[0].count <= 1) {
        res.status(400).json({ error: "cannot delete the only remaining administrator" });
        return;
      }
    }

    await pool.query("DELETE FROM sessions WHERE user_id = ?", [id]);
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    await recordAdminLog(req.userId!, "USER_DELETED", `Deleted user ${id} (${target[0].email})`);

    res.status(204).send();
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ error: "failed to delete user" });
  }
});

// PUT /api/admin/permissions/:userId - update permissions
adminRouter.put("/permissions/:userId", async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const {
      accessMasters,
      accessGoals,
      accessGoalPlanner,
      accessVisionBoard,
      accessGratitude,
      accessHabits,
      accessOverallDashboard,
      accessHabitsDashboard,
      accessMusic,
      accessAdmin,
    } = req.body;

    const [userRows] = await pool.query<any[]>("SELECT id, role FROM users WHERE id = ?", [userId]);
    if (userRows.length === 0) {
      res.status(404).json({ error: "user not found" });
      return;
    }

    await pool.query(
      `INSERT INTO user_permissions (
        user_id, access_masters, access_goals, access_goal_planner, access_vision_board,
        access_gratitude, access_habits, access_overall_dashboard, access_habits_dashboard,
        access_music, access_admin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        access_masters = VALUES(access_masters),
        access_goals = VALUES(access_goals),
        access_goal_planner = VALUES(access_goal_planner),
        access_vision_board = VALUES(access_vision_board),
        access_gratitude = VALUES(access_gratitude),
        access_habits = VALUES(access_habits),
        access_overall_dashboard = VALUES(access_overall_dashboard),
        access_habits_dashboard = VALUES(access_habits_dashboard),
        access_music = VALUES(access_music),
        access_admin = VALUES(access_admin)`,
      [
        userId,
        accessMasters ? 1 : 0,
        accessGoals ? 1 : 0,
        accessGoalPlanner ? 1 : 0,
        accessVisionBoard ? 1 : 0,
        accessGratitude ? 1 : 0,
        accessHabits ? 1 : 0,
        accessOverallDashboard ? 1 : 0,
        accessHabitsDashboard ? 1 : 0,
        accessMusic ? 1 : 0,
        accessAdmin ? 1 : 0,
      ]
    );

    // If accessAdmin changed, sync role if appropriate
    if (accessAdmin && userRows[0].role !== "ADMIN") {
      await pool.query("UPDATE users SET role = 'ADMIN' WHERE id = ?", [userId]);
    }

    await recordAdminLog(req.userId!, "PERMISSIONS_UPDATED", `Updated permissions for user ${userId}`);

    res.json({ success: true, userId });
  } catch (err) {
    console.error("Admin update permissions error:", err);
    res.status(500).json({ error: "failed to update permissions" });
  }
});

// GET /api/admin/logs - get audit logs
adminRouter.get("/logs", async (_req: AuthenticatedRequest, res) => {
  try {
    const [rows] = await pool.query<any[]>(
      "SELECT id, admin_id as adminId, action, details, created_at as timestamp FROM admin_logs ORDER BY created_at DESC LIMIT 100"
    );
    res.json(rows);
  } catch (err) {
    console.error("Admin get logs error:", err);
    res.status(500).json({ error: "failed to retrieve audit logs" });
  }
});

// POST /api/admin/logs - add audit log
adminRouter.post("/logs", async (req: AuthenticatedRequest, res) => {
  try {
    const { action, details } = req.body;
    if (!action || !details) {
      res.status(400).json({ error: "action and details are required" });
      return;
    }
    await recordAdminLog(req.userId!, action, details);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Admin create log error:", err);
    res.status(500).json({ error: "failed to record audit log" });
  }
});
