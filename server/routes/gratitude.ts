import express from "express";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import {
  requireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

export const gratitudeRouter = express.Router();
gratitudeRouter.use(requireAuth);
gratitudeRouter.use(requirePermission("access_gratitude"));

function formatGratitude(row: any): any {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    category: row.category || "Personal Reflection",
    vibe: row.vibe || "🙏",
    date: row.entry_date,
  };
}

// GET all gratitude entries for logged-in user
gratitudeRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [entries] = await pool.query<any[]>(
      "SELECT * FROM gratitude_entries WHERE user_id = ? ORDER BY entry_date DESC, created_at DESC",
      [req.userId]
    );
    res.json(entries.map(formatGratitude));
  } catch (err) {
    console.error("Get gratitude entries error:", err);
    res.status(500).json({ error: "failed to retrieve gratitude entries" });
  }
});

// POST create gratitude entry
gratitudeRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { content, category, vibe, date } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ error: "gratitude content is required" });
      return;
    }

    const id = crypto.randomUUID();
    const entryDate = date ?? new Date().toISOString().split("T")[0];
    const cat = category?.trim() || "Personal Reflection";
    const v = vibe?.trim() || "🙏";

    await pool.query(
      "INSERT INTO gratitude_entries (id, user_id, entry_date, content, category, vibe) VALUES (?, ?, ?, ?, ?, ?)",
      [id, req.userId, entryDate, content.trim(), cat, v]
    );

    res.status(201).json({
      id,
      userId: req.userId,
      content: content.trim(),
      category: cat,
      vibe: v,
      date: entryDate,
    });
  } catch (err) {
    console.error("Create gratitude entry error:", err);
    res.status(500).json({ error: "failed to create gratitude entry" });
  }
});

// DELETE gratitude entry
gratitudeRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const [result]: any = await pool.query(
      "DELETE FROM gratitude_entries WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "entry not found or unauthorized" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete gratitude entry error:", err);
    res.status(500).json({ error: "failed to delete gratitude entry" });
  }
});
