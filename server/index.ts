import express from "express";
import cors from "cors";
import { pool } from "./db/mysql/connection.js";
import { authRouter } from "./routes/auth.js";
import { goalsRouter } from "./routes/goals.js";
import { habitsRouter } from "./routes/habits.js";
import { mastersRouter } from "./routes/masters.js";
import { gratitudeRouter } from "./routes/gratitude.js";
import { reviewsRouter } from "./routes/reviews.js";
import { musicRouter } from "./routes/music.js";
import { affirmationAudioRouter } from "./routes/affirmationAudio.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/habits", habitsRouter);
app.use("/api/masters", mastersRouter);
app.use("/api/gratitude", gratitudeRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/music", musicRouter);
app.use("/api/affirmation-audio", affirmationAudioRouter);

const PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 3001;

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

app.listen(PORT, () => {
  console.log(`Evolve backend server running on http://localhost:${PORT}`);
});
