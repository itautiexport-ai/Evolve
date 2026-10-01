import express from "express";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

export const mastersRouter = express.Router();
mastersRouter.use(requireAuth);

mastersRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [masters] = await pool.query<any[]>(
      "SELECT * FROM masters WHERE user_id = ? ORDER BY created_at DESC",
      [req.userId]
    );
    res.json(masters);
  } catch (err) {
    console.error("Get masters error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

mastersRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const m = req.body;
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO masters (id, user_id, title, category, level, progress, description, 
       key_practices, color_theme, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.userId, m.title, m.category, m.level ?? "Apprentice", m.progress ?? 0,
       m.description ?? null, JSON.stringify(m.keyPractices ?? []), m.colorTheme ?? "green",
       m.icon ?? null]
    );
    res.status(201).json({ id, ...m });
  } catch (err) {
    console.error("Create master error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

mastersRouter.put("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const m = req.body;
    const [result]: any = await pool.query(
      `UPDATE masters SET title=?, category=?, level=?, progress=?, description=?, 
       key_practices=?, color_theme=?, icon=? WHERE id=? AND user_id=?`,
      [m.title, m.category, m.level, m.progress ?? 0, m.description ?? null,
       JSON.stringify(m.keyPractices ?? []), m.colorTheme, m.icon ?? null, req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "master not found" });
    }
    res.json({ id: req.params.id, ...m });
  } catch (err) {
    console.error("Update master error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

mastersRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const [result]: any = await pool.query(
      "DELETE FROM masters WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "master not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete master error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});
