import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db/mysql/connection.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "affirmation-audio");

export const affirmationAudioRouter = express.Router();
affirmationAudioRouter.use(requireAuth);

// GET current user's custom affirmation audio (returns file path/URL)
affirmationAudioRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [rows] = await pool.query<any[]>(
      "SELECT file_path FROM affirmation_audio WHERE user_id = ?",
      [req.userId]
    );
    if (rows.length === 0) {
      return res.json({ filePath: null });
    }
    res.json({ filePath: rows[0].file_path });
  } catch (err) {
    console.error("Get affirmation audio error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

// POST save base64 audio to disk and store its path in the DB
affirmationAudioRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { base64Audio } = req.body;
    if (!base64Audio) {
      return res.status(400).json({ error: "base64Audio is required" });
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const base64Data = base64Audio.replace(/^data:audio\/\w+;base64,/, "");
    const fileName = `${req.userId}-${crypto.randomUUID()}.mp3`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    fs.writeFileSync(filePath, base64Data, "base64");

    const relativePath = `/uploads/affirmation-audio/${fileName}`;

    await pool.query(
      `INSERT INTO affirmation_audio (id, user_id, file_path) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE file_path = VALUES(file_path)`,
      [crypto.randomUUID(), req.userId, relativePath]
    );

    res.status(201).json({ filePath: relativePath });
  } catch (err) {
    console.error("Save affirmation audio error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

// DELETE custom affirmation audio
affirmationAudioRouter.delete("/", async (req: AuthenticatedRequest, res) => {
  try {
    await pool.query("DELETE FROM affirmation_audio WHERE user_id = ?", [req.userId]);
    res.status(204).send();
  } catch (err) {
    console.error("Delete affirmation audio error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});
