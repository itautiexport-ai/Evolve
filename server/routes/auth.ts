import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import jwt from "jsonwebtoken";

export const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "password must be at least 6 characters" });
    }

    const [existing] = await pool.query<any[]>(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "email already registered" });
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const joinedDate = new Date().toISOString().split("T")[0];

    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, joined_date)
       VALUES (?, ?, ?, ?, 'USER', ?)`,
      [id, name, email, passwordHash, joinedDate]
    );

    res.status(201).json({
      id,
      name,
      email,
      role: "USER",
      joinedDate,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const [rows] = await pool.query<any[]>(
      "SELECT id, name, email, password_hash, role, avatar, joined_date FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "invalid email or password" });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "invalid email or password" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not set in environment variables");
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        joinedDate: user.joined_date,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});
