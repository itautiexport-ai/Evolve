import express from "express";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

export const musicRouter = express.Router();
musicRouter.use(requireAuth);

musicRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [tracks] = await pool.query<any[]>(
      "SELECT * FROM music_tracks WHERE user_id = ? ORDER BY created_at DESC",
      [req.userId]
    );
    res.json(tracks);
  } catch (err) {
    console.error("Get music tracks error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

musicRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { title, url } = req.body;
    const id = crypto.randomUUID();
    await pool.query(
      "INSERT INTO music_tracks (id, user_id, title, url) VALUES (?, ?, ?, ?)",
      [id, req.userId, title ?? null, url]
    );
    res.status(201).json({ id, title, url });
  } catch (err) {
    console.error("Create music track error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

musicRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const [result]: any = await pool.query(
      "DELETE FROM music_tracks WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "track not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete music track error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});
