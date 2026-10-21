import express from "express";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import {
  requireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

export const mastersRouter = express.Router();
mastersRouter.use(requireAuth);
mastersRouter.use(requirePermission("access_masters"));

function formatMaster(row: any): any {
  let keyPractices: string[] = [];
  if (row.key_practices) {
    if (Array.isArray(row.key_practices)) {
      keyPractices = row.key_practices;
    } else if (typeof row.key_practices === "string") {
      try {
        keyPractices = JSON.parse(row.key_practices);
      } catch {
        keyPractices = [];
      }
    }
  }

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    level: row.level || "Apprentice",
    progress: Number(row.progress || 0),
    description: row.description || "",
    keyPractices,
    colorTheme: row.color_theme || "green",
    icon: row.icon || undefined,
    updatedAt: row.updated_at || new Date().toISOString().split("T")[0],
  };
}

// GET all masters for logged-in user
mastersRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [masters] = await pool.query<any[]>(
      "SELECT * FROM masters WHERE user_id = ? ORDER BY created_at DESC",
      [req.userId]
    );
    res.json(masters.map(formatMaster));
  } catch (err) {
    console.error("Get masters error:", err);
    res.status(500).json({ error: "failed to retrieve masters" });
  }
});

// POST create master
mastersRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const m = req.body;
    if (!m.title || !m.category) {
      res.status(400).json({ error: "title and category are required" });
      return;
    }

    const id = crypto.randomUUID();
    const today = new Date().toISOString().split("T")[0];

    await pool.query(
      `INSERT INTO masters (id, user_id, title, category, level, progress, description, 
       key_practices, color_theme, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.userId,
        m.title.trim(),
        m.category,
        m.level ?? "Apprentice",
        Number(m.progress) || 0,
        m.description ?? null,
        JSON.stringify(Array.isArray(m.keyPractices) ? m.keyPractices : []),
        m.colorTheme ?? "green",
        m.icon ?? null,
      ]
    );

    const created = formatMaster({
      id,
      title: m.title.trim(),
      category: m.category,
      level: m.level ?? "Apprentice",
      progress: Number(m.progress) || 0,
      description: m.description || "",
      key_practices: m.keyPractices || [],
      color_theme: m.colorTheme ?? "green",
      icon: m.icon,
      updated_at: today,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("Create master error:", err);
    res.status(500).json({ error: "failed to create master" });
  }
});

// PUT update master
mastersRouter.put("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const m = req.body;
    const { id } = req.params;

    if (!m.title || !m.category) {
      res.status(400).json({ error: "title and category are required" });
      return;
    }

    const [result]: any = await pool.query(
      `UPDATE masters SET title=?, category=?, level=?, progress=?, description=?, 
       key_practices=?, color_theme=?, icon=? WHERE id=? AND user_id=?`,
      [
        m.title.trim(),
        m.category,
        m.level,
        Number(m.progress) || 0,
        m.description ?? null,
        JSON.stringify(Array.isArray(m.keyPractices) ? m.keyPractices : []),
        m.colorTheme,
        m.icon ?? null,
        id,
        req.userId,
      ]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "master not found or unauthorized" });
      return;
    }

    const [rows] = await pool.query<any[]>("SELECT * FROM masters WHERE id = ?", [id]);
    res.json(formatMaster(rows[0]));
  } catch (err) {
    console.error("Update master error:", err);
    res.status(500).json({ error: "failed to update master" });
  }
});

// DELETE master
mastersRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const [result]: any = await pool.query(
      "DELETE FROM masters WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "master not found or unauthorized" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete master error:", err);
    res.status(500).json({ error: "failed to delete master" });
  }
});
