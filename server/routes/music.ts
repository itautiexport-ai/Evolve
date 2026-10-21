import express from "express";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import {
  requireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

export const musicRouter = express.Router();
musicRouter.use(requireAuth);
musicRouter.use(requirePermission("access_music"));

function formatTrack(row: any): any {
  return {
    id: row.id,
    title: row.title || "Custom Track",
    description: row.description || "",
    url: row.url,
  };
}

// GET all music tracks for logged-in user
musicRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [tracks] = await pool.query<any[]>(
      "SELECT * FROM music_tracks WHERE user_id = ? ORDER BY created_at ASC",
      [req.userId]
    );
    res.json(tracks.map(formatTrack));
  } catch (err) {
    console.error("Get music tracks error:", err);
    res.status(500).json({ error: "failed to retrieve music tracks" });
  }
});

// POST create music track
musicRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { title, description, url } = req.body;
    if (!url || typeof url !== "string" || !url.trim()) {
      res.status(400).json({ error: "audio track URL is required" });
      return;
    }

    const id = crypto.randomUUID();
    const cleanTitle = title?.trim() || "Custom Audio";
    const cleanDesc = description?.trim() || "";
    const cleanUrl = url.trim();

    await pool.query(
      "INSERT INTO music_tracks (id, user_id, title, description, url) VALUES (?, ?, ?, ?, ?)",
      [id, req.userId, cleanTitle, cleanDesc, cleanUrl]
    );

    res.status(201).json({
      id,
      title: cleanTitle,
      description: cleanDesc,
      url: cleanUrl,
    });
  } catch (err) {
    console.error("Create music track error:", err);
    res.status(500).json({ error: "failed to add music track" });
  }
});

// DELETE music track
musicRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const [result]: any = await pool.query(
      "DELETE FROM music_tracks WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "track not found or unauthorized" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete music track error:", err);
    res.status(500).json({ error: "failed to delete track" });
  }
});
