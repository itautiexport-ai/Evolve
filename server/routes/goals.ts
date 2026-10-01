import express from "express";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

export const goalsRouter = express.Router();
goalsRouter.use(requireAuth);

// GET all goals for logged-in user (with milestones and journal entries)
goalsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [goals] = await pool.query<any[]>(
      "SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC",
      [req.userId]
    );
    for (const goal of goals) {
      const [milestones] = await pool.query<any[]>(
        "SELECT * FROM milestones WHERE goal_id = ?",
        [goal.id]
      );
      const [journalEntries] = await pool.query<any[]>(
        "SELECT * FROM goal_journal_entries WHERE goal_id = ? ORDER BY entry_date DESC",
        [goal.id]
      );
      goal.milestones = milestones;
      goal.journalEntries = journalEntries;
    }
    res.json(goals);
  } catch (err) {
    console.error("Get goals error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

// POST create a new goal
goalsRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const g = req.body;
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO goals (id, user_id, title, description, category, priority, status, 
       target_date, progress, target_value, current_value, unit, image_url, tags, 
       is_pinned, reward, purpose, success_criteria, requirements, challenges)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.userId, g.title, g.description ?? null, g.category, g.priority ?? "medium",
       g.status ?? "not-started", g.targetDate ?? null, g.progress ?? 0, g.targetValue ?? null,
       g.currentValue ?? null, g.unit ?? null, g.imageUrl ?? null, JSON.stringify(g.tags ?? []),
       g.isPinned ? 1 : 0, g.reward ?? null, g.purpose ?? null, g.successCriteria ?? null,
       g.requirements ?? null, g.challenges ?? null]
    );
    res.status(201).json({ id, ...g });
  } catch (err) {
    console.error("Create goal error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

// PUT update a goal
goalsRouter.put("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const g = req.body;
    const [result]: any = await pool.query(
      `UPDATE goals SET title=?, description=?, category=?, priority=?, status=?, 
       target_date=?, progress=?, target_value=?, current_value=?, unit=?, image_url=?, 
       tags=?, is_pinned=?, reward=?, purpose=?, success_criteria=?, requirements=?, 
       challenges=? WHERE id=? AND user_id=?`,
      [g.title, g.description ?? null, g.category, g.priority, g.status, g.targetDate ?? null,
       g.progress ?? 0, g.targetValue ?? null, g.currentValue ?? null, g.unit ?? null,
       g.imageUrl ?? null, JSON.stringify(g.tags ?? []), g.isPinned ? 1 : 0, g.reward ?? null,
       g.purpose ?? null, g.successCriteria ?? null, g.requirements ?? null, g.challenges ?? null,
       req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "goal not found" });
    }
    res.json({ id: req.params.id, ...g });
  } catch (err) {
    console.error("Update goal error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

// DELETE a goal
goalsRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const [result]: any = await pool.query(
      "DELETE FROM goals WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "goal not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete goal error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

// POST add milestone to a goal
goalsRouter.post("/:goalId/milestones", async (req: AuthenticatedRequest, res) => {
  try {
    const { title, dueDate } = req.body;
    const id = crypto.randomUUID();
    await pool.query(
      "INSERT INTO milestones (id, goal_id, title, completed, due_date) VALUES (?, ?, ?, 0, ?)",
      [id, req.params.goalId, title, dueDate ?? null]
    );
    res.status(201).json({ id, title, completed: false, dueDate });
  } catch (err) {
    console.error("Create milestone error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

// PUT update milestone (e.g. mark complete)
goalsRouter.put("/milestones/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { title, completed, dueDate } = req.body;
    await pool.query(
      "UPDATE milestones SET title=?, completed=?, due_date=? WHERE id=?",
      [title, completed ? 1 : 0, dueDate ?? null, req.params.id]
    );
    res.json({ id: req.params.id, title, completed, dueDate });
  } catch (err) {
    console.error("Update milestone error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

// DELETE milestone
goalsRouter.delete("/milestones/:id", async (req: AuthenticatedRequest, res) => {
  try {
    await pool.query("DELETE FROM milestones WHERE id = ?", [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error("Delete milestone error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

// POST add journal entry to a goal
goalsRouter.post("/:goalId/journal", async (req: AuthenticatedRequest, res) => {
  try {
    const { content, mood, date } = req.body;
    const id = crypto.randomUUID();
    await pool.query(
      "INSERT INTO goal_journal_entries (id, goal_id, entry_date, content, mood) VALUES (?, ?, ?, ?, ?)",
      [id, req.params.goalId, date ?? new Date().toISOString().split("T")[0], content, mood ?? null]
    );
    res.status(201).json({ id, content, mood, date });
  } catch (err) {
    console.error("Create journal entry error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});
