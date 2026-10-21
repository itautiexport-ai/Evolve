import express from "express";
import { pool } from "../db/mysql/connection.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

export const preferencesRouter = express.Router();
preferencesRouter.use(requireAuth);

// GET user preferences
preferencesRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [rows] = await pool.query<any[]>(
      "SELECT preferences FROM user_preferences WHERE user_id = ?",
      [req.userId]
    );

    if (rows.length === 0) {
      res.json({ preferences: {} });
      return;
    }

    let preferences = rows[0].preferences;
    if (typeof preferences === "string") {
      try {
        preferences = JSON.parse(preferences);
      } catch {
        preferences = {};
      }
    }

    res.json({ preferences });
  } catch (err) {
    console.error("Get preferences error:", err);
    res.status(500).json({ error: "failed to retrieve user preferences" });
  }
});

// PUT update user preferences
preferencesRouter.put("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { preferences } = req.body;
    const prefJson = JSON.stringify(preferences || {});

    await pool.query(
      `INSERT INTO user_preferences (user_id, preferences)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE preferences = VALUES(preferences)`,
      [req.userId, prefJson]
    );

    res.json({ preferences: preferences || {} });
  } catch (err) {
    console.error("Update preferences error:", err);
    res.status(500).json({ error: "failed to save user preferences" });
  }
});
