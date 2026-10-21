import express from "express";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import {
  requireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

export const visionBoardRouter = express.Router();
visionBoardRouter.use(requireAuth);
visionBoardRouter.use(requirePermission("access_vision_board"));

// GET vision board for logged in user
visionBoardRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM vision_boards WHERE user_id = ?",
      [req.userId]
    );

    if (rows.length === 0) {
      res.json({
        boardData: {},
        centerQuote: "Ready to manifest my main character energy and level up!",
        isCompleted: false,
        boardOwner: "My",
      });
      return;
    }

    const row = rows[0];
    let boardData = row.board_data;
    if (typeof boardData === "string") {
      try {
        boardData = JSON.parse(boardData);
      } catch {
        boardData = {};
      }
    }

    res.json({
      boardData,
      centerQuote: row.center_quote || "Ready to manifest my main character energy and level up!",
      isCompleted: !!row.is_completed,
      boardOwner: row.board_owner || "My",
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error("Get vision board error:", err);
    res.status(500).json({ error: "failed to retrieve vision board" });
  }
});

// PUT update or create vision board
visionBoardRouter.put("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { boardData, centerQuote, isCompleted, boardOwner } = req.body;

    const id = crypto.randomUUID();
    const dataString = JSON.stringify(boardData || {});
    const quote = centerQuote || "Ready to manifest my main character energy and level up!";
    const completed = isCompleted ? 1 : 0;
    const owner = boardOwner || "My";

    await pool.query(
      `INSERT INTO vision_boards (id, user_id, center_quote, is_completed, board_owner, board_data)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         center_quote = VALUES(center_quote),
         is_completed = VALUES(is_completed),
         board_owner = VALUES(board_owner),
         board_data = VALUES(board_data)`,
      [id, req.userId, quote, completed, owner, dataString]
    );

    res.json({
      boardData: boardData || {},
      centerQuote: quote,
      isCompleted: !!completed,
      boardOwner: owner,
    });
  } catch (err) {
    console.error("Update vision board error:", err);
    res.status(500).json({ error: "failed to save vision board" });
  }
});
