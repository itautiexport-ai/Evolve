import express from "express";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import {
  requireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

export const manifestationsRouter = express.Router();
manifestationsRouter.use(requireAuth);
manifestationsRouter.use(requirePermission("access_vision_board"));

// GET manifestations for logged in user
manifestationsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM manifestations WHERE user_id = ?",
      [req.userId]
    );

    if (rows.length === 0) {
      res.json({
        current: {
          title: "",
          imageUrl: "",
          startDate: null,
          isAccomplished: false,
          accomplishDate: null,
          daysToAchieve: null,
        },
        accomplishedList: [],
      });
      return;
    }

    const row = rows[0];
    let current = row.current;
    if (typeof current === "string") {
      try {
        current = JSON.parse(current);
      } catch {
        current = null;
      }
    }

    let accomplishedList = row.accomplished_list;
    if (typeof accomplishedList === "string") {
      try {
        accomplishedList = JSON.parse(accomplishedList);
      } catch {
        accomplishedList = [];
      }
    }

    res.json({
      current: current || {
        title: "",
        imageUrl: "",
        startDate: null,
        isAccomplished: false,
        accomplishDate: null,
        daysToAchieve: null,
      },
      accomplishedList: Array.isArray(accomplishedList) ? accomplishedList : [],
    });
  } catch (err) {
    console.error("Get manifestations error:", err);
    res.status(500).json({ error: "failed to retrieve manifestations" });
  }
});

// PUT update manifestations
manifestationsRouter.put("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { current, accomplishedList } = req.body;
    const id = crypto.randomUUID();

    const currentJson = JSON.stringify(current || null);
    const listJson = JSON.stringify(Array.isArray(accomplishedList) ? accomplishedList : []);

    await pool.query(
      `INSERT INTO manifestations (id, user_id, current, accomplished_list)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         current = VALUES(current),
         accomplished_list = VALUES(accomplished_list)`,
      [id, req.userId, currentJson, listJson]
    );

    res.json({
      current: current || null,
      accomplishedList: Array.isArray(accomplishedList) ? accomplishedList : [],
    });
  } catch (err) {
    console.error("Update manifestations error:", err);
    res.status(500).json({ error: "failed to save manifestations" });
  }
});
