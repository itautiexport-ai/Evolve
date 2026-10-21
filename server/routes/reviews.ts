import express from "express";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import {
  requireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

export const reviewsRouter = express.Router();
reviewsRouter.use(requireAuth);
reviewsRouter.use(requirePermission("access_habits_dashboard"));

function formatReview(row: any): any {
  let content = row.content;
  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {
      content = {};
    }
  }

  const weekKey = row.week_start_date;

  return {
    id: row.id,
    weekStartDate: weekKey,
    weekKey,
    content,
    happinessScore: content?.happinessScore ?? 5,
    risks: content?.risks ?? [],
    commitments: content?.commitments ?? [],
  };
}

// GET all weekly reviews for logged-in user
reviewsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [reviews] = await pool.query<any[]>(
      "SELECT * FROM weekly_reviews WHERE user_id = ? ORDER BY week_start_date DESC",
      [req.userId]
    );
    res.json(reviews.map(formatReview));
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ error: "failed to retrieve weekly reviews" });
  }
});

// POST create or upsert weekly review
reviewsRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { weekStartDate, weekKey, content, happinessScore, risks, commitments } = req.body;
    const finalWeekStart = weekStartDate || weekKey;

    if (!finalWeekStart) {
      res.status(400).json({ error: "weekStartDate or weekKey is required" });
      return;
    }

    const payloadContent = content || {
      happinessScore: happinessScore ?? 5,
      risks: Array.isArray(risks) ? risks : [],
      commitments: Array.isArray(commitments) ? commitments : [],
    };

    // Check if review for this week already exists for this user
    const [existing] = await pool.query<any[]>(
      "SELECT id FROM weekly_reviews WHERE user_id = ? AND week_start_date = ?",
      [req.userId, finalWeekStart]
    );

    let id: string;
    if (existing.length > 0) {
      id = existing[0].id;
      await pool.query(
        "UPDATE weekly_reviews SET content = ? WHERE id = ? AND user_id = ?",
        [JSON.stringify(payloadContent), id, req.userId]
      );
    } else {
      id = crypto.randomUUID();
      await pool.query(
        "INSERT INTO weekly_reviews (id, user_id, week_start_date, content) VALUES (?, ?, ?, ?)",
        [id, req.userId, finalWeekStart, JSON.stringify(payloadContent)]
      );
    }

    res.status(201).json({
      id,
      weekStartDate: finalWeekStart,
      weekKey: finalWeekStart,
      content: payloadContent,
      happinessScore: payloadContent.happinessScore,
      risks: payloadContent.risks,
      commitments: payloadContent.commitments,
    });
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ error: "failed to save weekly review" });
  }
});

// DELETE single review
reviewsRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const [result]: any = await pool.query(
      "DELETE FROM weekly_reviews WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "review not found or unauthorized" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({ error: "failed to delete review" });
  }
});

// DELETE all reviews for current user
reviewsRouter.delete("/", async (req: AuthenticatedRequest, res) => {
  try {
    await pool.query("DELETE FROM weekly_reviews WHERE user_id = ?", [req.userId]);
    res.status(204).send();
  } catch (err) {
    console.error("Clear reviews error:", err);
    res.status(500).json({ error: "failed to clear reviews" });
  }
});
