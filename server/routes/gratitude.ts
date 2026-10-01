import express from "express";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

export const gratitudeRouter = express.Router();
gratitudeRouter.use(requireAuth);

gratitudeRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [entries] = await pool.query<any[]>(
      "SELECT * FROM gratitude_entries WHERE user_id = ? ORDER BY entry_date DESC",
      [req.userId]
    );
    res.json(entries);
  } catch (err) {
    console.error("Get gratitude entries error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

gratitudeRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { content, date } = req.body;
    const id = crypto.randomUUID();
    await pool.query(
      "INSERT INTO gratitude_entries (id, user_id, entry_date, content) VALUES (?, ?, ?, ?)",
      [id, req.userId, date ?? new Date().toISOString().split("T")[0], content]
    );
    res.status(201).json({ id, content, date });
  } catch (err) {
    console.error("Create gratitude entry error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

gratitudeRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const [result]: any = await pool.query(
      "DELETE FROM gratitude_entries WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "entry not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete gratitude entry error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});
