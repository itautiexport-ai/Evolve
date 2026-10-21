import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db/mysql/connection.js";
import {
  requireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, "..", "..", "uploads", "affirmation-audio");

// Maximum allowed audio size: 10 megabytes (decoded)
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export const affirmationAudioRouter = express.Router();
affirmationAudioRouter.use(requireAuth);
affirmationAudioRouter.use(requirePermission("access_vision_board"));

// GET stream audio with authenticated ownership check
affirmationAudioRouter.get("/stream", async (req: AuthenticatedRequest, res) => {
  try {
    const [rows] = await pool.query<any[]>(
      "SELECT file_path FROM affirmation_audio WHERE user_id = ?",
      [req.userId]
    );
    if (rows.length === 0 || !rows[0].file_path) {
      res.status(404).json({ error: "no audio file found" });
      return;
    }

    const storedPath = rows[0].file_path;
    const fileName = path.basename(storedPath);
    const fullPath = path.resolve(UPLOAD_DIR, fileName);

    // Path traversal prevention: verify target path is inside UPLOAD_DIR
    if (!fullPath.startsWith(UPLOAD_DIR) || !fs.existsSync(fullPath)) {
      res.status(404).json({ error: "audio file not found on disk" });
      return;
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(fullPath);
  } catch (err) {
    console.error("Stream affirmation audio error:", err);
    res.status(500).json({ error: "failed to stream audio file" });
  }
});

// GET current user's custom affirmation audio
affirmationAudioRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [rows] = await pool.query<any[]>(
      "SELECT file_path FROM affirmation_audio WHERE user_id = ?",
      [req.userId]
    );
    if (rows.length === 0 || !rows[0].file_path) {
      res.json({ filePath: null });
      return;
    }
    res.json({ filePath: "/api/affirmation-audio/stream" });
  } catch (err) {
    console.error("Get affirmation audio error:", err);
    res.status(500).json({ error: "failed to retrieve affirmation audio" });
  }
});

// POST save custom affirmation audio
affirmationAudioRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { base64Audio } = req.body;
    if (!base64Audio || typeof base64Audio !== "string") {
      res.status(400).json({ error: "base64Audio payload is required" });
      return;
    }

    const cleanBase64 = base64Audio.replace(/^data:audio\/\w+;base64,/, "");
    const estimatedSize = Math.ceil((cleanBase64.length * 3) / 4);

    if (estimatedSize > MAX_AUDIO_BYTES) {
      res.status(413).json({
        error: `Audio file exceeds maximum allowed size of 10MB (approx ${Math.round(estimatedSize / 1024 / 1024)}MB uploaded).`,
      });
      return;
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Check if an existing file should be cleaned up
    const [existing] = await pool.query<any[]>(
      "SELECT file_path FROM affirmation_audio WHERE user_id = ?",
      [req.userId]
    );
    if (existing.length > 0 && existing[0].file_path) {
      const oldFilename = path.basename(existing[0].file_path);
      const oldFullPath = path.join(UPLOAD_DIR, oldFilename);
      if (fs.existsSync(oldFullPath)) {
        try {
          fs.unlinkSync(oldFullPath);
        } catch (unlinkErr) {
          console.warn("Could not remove old affirmation audio file:", unlinkErr);
        }
      }
    }

    const fileName = `${req.userId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.mp3`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    fs.writeFileSync(filePath, cleanBase64, "base64");

    const relativePath = `/uploads/affirmation-audio/${fileName}`;

    await pool.query(
      `INSERT INTO affirmation_audio (id, user_id, file_path) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE file_path = VALUES(file_path)`,
      [crypto.randomUUID(), req.userId, relativePath]
    );

    res.status(201).json({ filePath: "/api/affirmation-audio/stream" });
  } catch (err) {
    console.error("Save affirmation audio error:", err);
    res.status(500).json({ error: "failed to save affirmation audio" });
  }
});

// DELETE custom affirmation audio
affirmationAudioRouter.delete("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [existing] = await pool.query<any[]>(
      "SELECT file_path FROM affirmation_audio WHERE user_id = ?",
      [req.userId]
    );

    if (existing.length > 0 && existing[0].file_path) {
      const oldFilename = path.basename(existing[0].file_path);
      const oldFullPath = path.join(UPLOAD_DIR, oldFilename);
      if (fs.existsSync(oldFullPath)) {
        try {
          fs.unlinkSync(oldFullPath);
        } catch (unlinkErr) {
          console.warn("Could not remove affirmation audio file:", unlinkErr);
        }
      }
    }

    await pool.query("DELETE FROM affirmation_audio WHERE user_id = ?", [req.userId]);
    res.status(204).send();
  } catch (err) {
    console.error("Delete affirmation audio error:", err);
    res.status(500).json({ error: "failed to delete affirmation audio" });
  }
});
