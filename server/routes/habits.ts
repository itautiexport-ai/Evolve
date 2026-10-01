import express from "express";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

export const habitsRouter = express.Router();
habitsRouter.use(requireAuth);

// GET all habits for logged-in user (with history)
habitsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [habits] = await pool.query<any[]>(
      "SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC",
      [req.userId]
    );
    for (const habit of habits) {
      const [history] = await pool.query<any[]>(
        "SELECT entry_date, completed FROM habit_history WHERE habit_id = ?",
        [habit.id]
      );
      const historyMap: Record<string, boolean> = {};
      for (const h of history) {
        historyMap[h.entry_date] = !!h.completed;
      }
      habit.history = historyMap;
    }
    res.json(habits);
  } catch (err) {
    console.error("Get habits error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

// POST create a new habit
habitsRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const h = req.body;
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO habits (id, user_id, name, description, frequency, category, streak, best_streak)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.userId, h.name, h.description ?? null, h.frequency ?? "daily", h.category,
       h.streak ?? 0, h.bestStreak ?? 0]
    );
    res.status(201).json({ id, ...h, history: {} });
  } catch (err) {
    console.error("Create habit error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

// PUT update a habit (name, streaks, etc.)
habitsRouter.put("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const h = req.body;
    const [result]: any = await pool.query(
      `UPDATE habits SET name=?, description=?, frequency=?, category=?, streak=?, best_streak=?
       WHERE id=? AND user_id=?`,
      [h.name, h.description ?? null, h.frequency, h.category, h.streak ?? 0,
       h.bestStreak ?? 0, req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "habit not found" });
    }
    res.json({ id: req.params.id, ...h });
  } catch (err) {
    console.error("Update habit error:", err);
    res.status(500).json({ error: "internal server error" });
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
      return res.status(404).json({ error: "habit not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete habit error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

// PUT mark a date as done/not-done for a habit (upsert)
habitsRouter.put("/:habitId/history/:date", async (req: AuthenticatedRequest, res) => {
  try {
    const { completed } = req.body;
    await pool.query(
      `INSERT INTO habit_history (id, habit_id, entry_date, completed)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE completed = VALUES(completed)`,
      [crypto.randomUUID(), req.params.habitId, req.params.date, completed ? 1 : 0]
    );
    res.json({ date: req.params.date, completed });
  } catch (err) {
    console.error("Update habit history error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});
