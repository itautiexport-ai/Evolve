import express from "express";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import {
  requireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

export const habitsRouter = express.Router();
habitsRouter.use(requireAuth);
habitsRouter.use(requirePermission("access_habits"));

function formatHabit(row: any, historyMap: Record<string, boolean> = {}): any {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    frequency: row.frequency || "daily",
    category: row.category,
    streak: Number(row.streak || 0),
    bestStreak: Number(row.best_streak || 0),
    createdAt: row.created_at || new Date().toISOString().split("T")[0],
    history: historyMap,
  };
}

// GET all habits for logged-in user (with completion history)
habitsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [habits] = await pool.query<any[]>(
      "SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC",
      [req.userId]
    );

    const habitIds = habits.map((h) => h.id);
    let allHistory: any[] = [];
    if (habitIds.length > 0) {
      const [hRows] = await pool.query<any[]>(
        "SELECT habit_id, entry_date, completed FROM habit_history WHERE habit_id IN (?)",
        [habitIds]
      );
      allHistory = hRows;
    }

    const formatted = habits.map((h) => {
      const historyMap: Record<string, boolean> = {};
      allHistory
        .filter((hist) => hist.habit_id === h.id)
        .forEach((hist) => {
          historyMap[hist.entry_date] = !!hist.completed;
        });
      return formatHabit(h, historyMap);
    });

    res.json(formatted);
  } catch (err) {
    console.error("Get habits error:", err);
    res.status(500).json({ error: "failed to retrieve habits" });
  }
});

// POST create a new habit
habitsRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const h = req.body;
    if (!h.name || typeof h.name !== "string" || !h.name.trim()) {
      res.status(400).json({ error: "habit name is required" });
      return;
    }
    if (!h.category || typeof h.category !== "string") {
      res.status(400).json({ error: "habit category is required" });
      return;
    }

    const id = crypto.randomUUID();
    const today = new Date().toISOString().split("T")[0];

    await pool.query(
      `INSERT INTO habits (id, user_id, name, description, frequency, category, streak, best_streak)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.userId,
        h.name.trim(),
        h.description ?? null,
        h.frequency ?? "daily",
        h.category,
        Number(h.streak) || 0,
        Number(h.bestStreak) || 0,
      ]
    );

    const created = formatHabit(
      {
        id,
        name: h.name.trim(),
        description: h.description || "",
        frequency: h.frequency || "daily",
        category: h.category,
        streak: Number(h.streak) || 0,
        best_streak: Number(h.bestStreak) || 0,
        created_at: today,
      },
      {}
    );

    res.status(201).json(created);
  } catch (err) {
    console.error("Create habit error:", err);
    res.status(500).json({ error: "failed to create habit" });
  }
});

// PUT update a habit (name, streaks, etc.)
habitsRouter.put("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const h = req.body;
    const { id } = req.params;

    if (!h.name || !h.category) {
      res.status(400).json({ error: "habit name and category are required" });
      return;
    }

    const [result]: any = await pool.query(
      `UPDATE habits SET name=?, description=?, frequency=?, category=?, streak=?, best_streak=?
       WHERE id=? AND user_id=?`,
      [
        h.name.trim(),
        h.description ?? null,
        h.frequency ?? "daily",
        h.category,
        Number(h.streak) || 0,
        Number(h.bestStreak) || 0,
        id,
        req.userId,
      ]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "habit not found or unauthorized" });
      return;
    }

    // Get current history map
    const [hRows] = await pool.query<any[]>(
      "SELECT entry_date, completed FROM habit_history WHERE habit_id = ?",
      [id]
    );
    const historyMap: Record<string, boolean> = {};
    hRows.forEach((r) => {
      historyMap[r.entry_date] = !!r.completed;
    });

    const [updatedRow] = await pool.query<any[]>("SELECT * FROM habits WHERE id = ?", [id]);
    res.json(formatHabit(updatedRow[0], historyMap));
  } catch (err) {
    console.error("Update habit error:", err);
    res.status(500).json({ error: "failed to update habit" });
  }
});

// DELETE a habit
habitsRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const [result]: any = await pool.query(
      "DELETE FROM habits WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "habit not found or unauthorized" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete habit error:", err);
    res.status(500).json({ error: "failed to delete habit" });
  }
});

// PUT mark a date as done/not-done for a habit (with user ownership enforcement)
habitsRouter.put("/:habitId/history/:date", async (req: AuthenticatedRequest, res) => {
  try {
    const { completed } = req.body;
    const { habitId, date } = req.params;

    // Enforce ownership: Habit must belong to logged in user
    const [habitRows] = await pool.query<any[]>(
      "SELECT id FROM habits WHERE id = ? AND user_id = ?",
      [habitId, req.userId]
    );
    if (habitRows.length === 0) {
      res.status(404).json({ error: "habit not found or unauthorized" });
      return;
    }

    if (completed) {
      await pool.query(
        `INSERT INTO habit_history (id, habit_id, entry_date, completed)
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE completed = 1`,
        [crypto.randomUUID(), habitId, date]
      );
    } else {
      await pool.query(
        "DELETE FROM habit_history WHERE habit_id = ? AND entry_date = ?",
        [habitId, date]
      );
    }

    res.json({ date, completed: !!completed });
  } catch (err) {
    console.error("Update habit history error:", err);
    res.status(500).json({ error: "failed to update habit history" });
  }
});
