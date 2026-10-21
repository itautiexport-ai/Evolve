import express from "express";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import {
  requireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

export const goalsRouter = express.Router();
goalsRouter.use(requireAuth);
goalsRouter.use(requirePermission("access_goals"));

function formatGoal(row: any, milestones: any[] = [], journalEntries: any[] = []): any {
  let tags: string[] = [];
  if (row.tags) {
    if (Array.isArray(row.tags)) {
      tags = row.tags;
    } else if (typeof row.tags === "string") {
      try {
        tags = JSON.parse(row.tags);
      } catch {
        tags = [];
      }
    }
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    category: row.category,
    priority: row.priority || "medium",
    status: row.status || "not-started",
    targetDate: row.target_date || "",
    createdAt: row.created_at || new Date().toISOString().split("T")[0],
    progress: Number(row.progress || 0),
    targetValue: row.target_value !== null && row.target_value !== undefined ? Number(row.target_value) : undefined,
    currentValue: row.current_value !== null && row.current_value !== undefined ? Number(row.current_value) : undefined,
    unit: row.unit || undefined,
    imageUrl: row.image_url || undefined,
    tags,
    isPinned: !!row.is_pinned,
    reward: row.reward || undefined,
    purpose: row.purpose || undefined,
    successCriteria: row.success_criteria || undefined,
    requirements: row.requirements || undefined,
    challenges: row.challenges || undefined,
    milestones: milestones.map((m) => ({
      id: m.id,
      title: m.title,
      completed: !!m.completed,
      dueDate: m.due_date || undefined,
    })),
    journalEntries: journalEntries.map((j) => ({
      id: j.id,
      date: j.entry_date,
      content: j.content,
      mood: j.mood || undefined,
    })),
  };
}

// GET all goals for logged-in user
goalsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [goals] = await pool.query<any[]>(
      "SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC",
      [req.userId]
    );

    const goalIds = goals.map((g) => g.id);
    let allMilestones: any[] = [];
    let allJournals: any[] = [];

    if (goalIds.length > 0) {
      const [mRows] = await pool.query<any[]>(
        "SELECT * FROM milestones WHERE goal_id IN (?) ORDER BY created_at ASC",
        [goalIds]
      );
      allMilestones = mRows;

      const [jRows] = await pool.query<any[]>(
        "SELECT * FROM goal_journal_entries WHERE goal_id IN (?) ORDER BY entry_date DESC",
        [goalIds]
      );
      allJournals = jRows;
    }

    const formatted = goals.map((g) => {
      const gMilestones = allMilestones.filter((m) => m.goal_id === g.id);
      const gJournals = allJournals.filter((j) => j.goal_id === g.id);
      return formatGoal(g, gMilestones, gJournals);
    });

    res.json(formatted);
  } catch (err) {
    console.error("Get goals error:", err);
    res.status(500).json({ error: "failed to retrieve goals" });
  }
});

// POST create a new goal
goalsRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const g = req.body;
    if (!g.title || typeof g.title !== "string" || !g.title.trim()) {
      res.status(400).json({ error: "goal title is required" });
      return;
    }
    if (!g.category || typeof g.category !== "string") {
      res.status(400).json({ error: "goal category is required" });
      return;
    }

    const id = crypto.randomUUID();
    const today = new Date().toISOString().split("T")[0];

    await pool.query(
      `INSERT INTO goals (id, user_id, title, description, category, priority, status, 
       target_date, progress, target_value, current_value, unit, image_url, tags, 
       is_pinned, reward, purpose, success_criteria, requirements, challenges)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.userId,
        g.title.trim(),
        g.description ?? null,
        g.category,
        g.priority ?? "medium",
        g.status ?? "not-started",
        g.targetDate ?? null,
        Number(g.progress) || 0,
        g.targetValue !== undefined ? Number(g.targetValue) : null,
        g.currentValue !== undefined ? Number(g.currentValue) : null,
        g.unit ?? null,
        g.imageUrl ?? null,
        JSON.stringify(Array.isArray(g.tags) ? g.tags : []),
        g.isPinned ? 1 : 0,
        g.reward ?? null,
        g.purpose ?? null,
        g.successCriteria ?? null,
        g.requirements ?? null,
        g.challenges ?? null,
      ]
    );

    let createdMilestones: any[] = [];
    if (Array.isArray(g.milestones) && g.milestones.length > 0) {
      for (const m of g.milestones) {
        if (m.title && typeof m.title === "string" && m.title.trim()) {
          const mId = crypto.randomUUID();
          await pool.query(
            "INSERT INTO milestones (id, goal_id, title, completed, due_date) VALUES (?, ?, ?, ?, ?)",
            [mId, id, m.title.trim(), m.completed ? 1 : 0, m.dueDate ?? null]
          );
          createdMilestones.push({
            id: mId,
            goal_id: id,
            title: m.title.trim(),
            completed: m.completed ? 1 : 0,
            due_date: m.dueDate ?? null,
          });
        }
      }
    }

    let createdJournals: any[] = [];
    if (Array.isArray(g.journalEntries) && g.journalEntries.length > 0) {
      for (const j of g.journalEntries) {
        if (j.content && typeof j.content === "string" && j.content.trim()) {
          const jId = crypto.randomUUID();
          const jDate = j.date ?? today;
          await pool.query(
            "INSERT INTO goal_journal_entries (id, goal_id, entry_date, content, mood) VALUES (?, ?, ?, ?, ?)",
            [jId, id, jDate, j.content.trim(), j.mood ?? null]
          );
          createdJournals.push({
            id: jId,
            goal_id: id,
            entry_date: jDate,
            content: j.content.trim(),
            mood: j.mood ?? null,
          });
        }
      }
    }

    const createdGoal = formatGoal(
      {
        id,
        title: g.title.trim(),
        description: g.description || "",
        category: g.category,
        priority: g.priority ?? "medium",
        status: g.status ?? "not-started",
        target_date: g.targetDate || null,
        created_at: today,
        progress: Number(g.progress) || 0,
        target_value: g.targetValue,
        current_value: g.currentValue,
        unit: g.unit,
        image_url: g.imageUrl,
        tags: g.tags || [],
        is_pinned: g.isPinned ? 1 : 0,
        reward: g.reward,
        purpose: g.purpose,
        success_criteria: g.successCriteria,
        requirements: g.requirements,
        challenges: g.challenges,
      },
      createdMilestones,
      createdJournals
    );

    res.status(201).json(createdGoal);
  } catch (err) {
    console.error("Create goal error:", err);
    res.status(500).json({ error: "failed to create goal" });
  }
});

// PUT update a goal
goalsRouter.put("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const g = req.body;
    const { id } = req.params;

    if (!g.title || !g.category) {
      res.status(400).json({ error: "title and category are required" });
      return;
    }

    const [result]: any = await pool.query(
      `UPDATE goals SET title=?, description=?, category=?, priority=?, status=?, 
       target_date=?, progress=?, target_value=?, current_value=?, unit=?, image_url=?, 
       tags=?, is_pinned=?, reward=?, purpose=?, success_criteria=?, requirements=?, 
       challenges=? WHERE id=? AND user_id=?`,
      [
        g.title,
        g.description ?? null,
        g.category,
        g.priority ?? "medium",
        g.status ?? "not-started",
        g.targetDate ?? null,
        Number(g.progress) || 0,
        g.targetValue !== undefined ? Number(g.targetValue) : null,
        g.currentValue !== undefined ? Number(g.currentValue) : null,
        g.unit ?? null,
        g.imageUrl ?? null,
        JSON.stringify(Array.isArray(g.tags) ? g.tags : []),
        g.isPinned ? 1 : 0,
        g.reward ?? null,
        g.purpose ?? null,
        g.successCriteria ?? null,
        g.requirements ?? null,
        g.challenges ?? null,
        id,
        req.userId,
      ]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "goal not found or unauthorized" });
      return;
    }

    // If milestones array was provided in the update, sync it
    if (Array.isArray(g.milestones)) {
      await pool.query("DELETE FROM milestones WHERE goal_id = ?", [id]);
      for (const m of g.milestones) {
        if (m.title && typeof m.title === "string" && m.title.trim()) {
          const mId = crypto.randomUUID();
          await pool.query(
            "INSERT INTO milestones (id, goal_id, title, completed, due_date) VALUES (?, ?, ?, ?, ?)",
            [mId, id, m.title.trim(), m.completed ? 1 : 0, m.dueDate ?? null]
          );
        }
      }
    }

    // Fetch updated goal with milestones and journals
    const [rows] = await pool.query<any[]>("SELECT * FROM goals WHERE id = ?", [id]);
    const [milestones] = await pool.query<any[]>("SELECT * FROM milestones WHERE goal_id = ?", [id]);
    const [journals] = await pool.query<any[]>("SELECT * FROM goal_journal_entries WHERE goal_id = ?", [id]);

    res.json(formatGoal(rows[0], milestones, journals));
  } catch (err) {
    console.error("Update goal error:", err);
    res.status(500).json({ error: "failed to update goal" });
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
      res.status(404).json({ error: "goal not found or unauthorized" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete goal error:", err);
    res.status(500).json({ error: "failed to delete goal" });
  }
});

// POST add milestone to a goal (with user ownership enforcement)
goalsRouter.post("/:goalId/milestones", requirePermission("access_goal_planner"), async (req: AuthenticatedRequest, res) => {
  try {
    const { title, dueDate } = req.body;
    const { goalId } = req.params;

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "milestone title is required" });
      return;
    }

    // Verify ownership of the goal
    const [goals] = await pool.query<any[]>(
      "SELECT id FROM goals WHERE id = ? AND user_id = ?",
      [goalId, req.userId]
    );
    if (goals.length === 0) {
      res.status(404).json({ error: "goal not found or unauthorized" });
      return;
    }

    const id = crypto.randomUUID();
    await pool.query(
      "INSERT INTO milestones (id, goal_id, title, completed, due_date) VALUES (?, ?, ?, 0, ?)",
      [id, goalId, title.trim(), dueDate ?? null]
    );

    res.status(201).json({ id, title: title.trim(), completed: false, dueDate });
  } catch (err) {
    console.error("Create milestone error:", err);
    res.status(500).json({ error: "failed to create milestone" });
  }
});

// PUT update milestone (with user ownership enforcement)
goalsRouter.put("/milestones/:id", requirePermission("access_goal_planner"), async (req: AuthenticatedRequest, res) => {
  try {
    const { title, completed, dueDate } = req.body;
    const { id } = req.params;

    // Verify milestone belongs to a goal owned by current user
    const [ownerRows] = await pool.query<any[]>(
      `SELECT m.id FROM milestones m 
       JOIN goals g ON m.goal_id = g.id 
       WHERE m.id = ? AND g.user_id = ?`,
      [id, req.userId]
    );

    if (ownerRows.length === 0) {
      res.status(404).json({ error: "milestone not found or unauthorized" });
      return;
    }

    await pool.query(
      "UPDATE milestones SET title=?, completed=?, due_date=? WHERE id=?",
      [title, completed ? 1 : 0, dueDate ?? null, id]
    );

    res.json({ id, title, completed: !!completed, dueDate });
  } catch (err) {
    console.error("Update milestone error:", err);
    res.status(500).json({ error: "failed to update milestone" });
  }
});

// DELETE milestone (with user ownership enforcement)
goalsRouter.delete("/milestones/:id", requirePermission("access_goal_planner"), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const [result]: any = await pool.query(
      `DELETE m FROM milestones m
       JOIN goals g ON m.goal_id = g.id
       WHERE m.id = ? AND g.user_id = ?`,
      [id, req.userId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "milestone not found or unauthorized" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Delete milestone error:", err);
    res.status(500).json({ error: "failed to delete milestone" });
  }
});

// POST add journal entry to a goal (with user ownership enforcement)
goalsRouter.post("/:goalId/journal", requirePermission("access_goal_planner"), async (req: AuthenticatedRequest, res) => {
  try {
    const { content, mood, date } = req.body;
    const { goalId } = req.params;

    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ error: "journal content is required" });
      return;
    }

    // Verify ownership of the goal
    const [goals] = await pool.query<any[]>(
      "SELECT id FROM goals WHERE id = ? AND user_id = ?",
      [goalId, req.userId]
    );
    if (goals.length === 0) {
      res.status(404).json({ error: "goal not found or unauthorized" });
      return;
    }

    const id = crypto.randomUUID();
    const entryDate = date ?? new Date().toISOString().split("T")[0];

    await pool.query(
      "INSERT INTO goal_journal_entries (id, goal_id, entry_date, content, mood) VALUES (?, ?, ?, ?, ?)",
      [id, goalId, entryDate, content.trim(), mood ?? null]
    );

    res.status(201).json({ id, content: content.trim(), mood, date: entryDate });
  } catch (err) {
    console.error("Create journal entry error:", err);
    res.status(500).json({ error: "failed to add reflection journal" });
  }
});
