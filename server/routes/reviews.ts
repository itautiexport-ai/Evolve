import express from "express";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

export const reviewsRouter = express.Router();
reviewsRouter.use(requireAuth);

reviewsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [reviews] = await pool.query<any[]>(
      "SELECT * FROM weekly_reviews WHERE user_id = ? ORDER BY week_start_date DESC",
      [req.userId]
    );
    res.json(reviews);
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

reviewsRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { weekStartDate, content } = req.body;
    const id = crypto.randomUUID();
    await pool.query(
      "INSERT INTO weekly_reviews (id, user_id, week_start_date, content) VALUES (?, ?, ?, ?)",
      [id, req.userId, weekStartDate, JSON.stringify(content)]
    );
    res.status(201).json({ id, weekStartDate, content });
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

reviewsRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const [result]: any = await pool.query(
      "DELETE FROM weekly_reviews WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "review not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

reviewsRouter.delete("/", async (req: AuthenticatedRequest, res) => {
  try {
    await pool.query("DELETE FROM weekly_reviews WHERE user_id = ?", [req.userId]);
    res.status(204).send();
  } catch (err) {
    console.error("Clear reviews error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});
