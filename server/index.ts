import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { env, validateEnvironment } from "./config/env.js";
import { pool } from "./db/mysql/connection.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { goalsRouter } from "./routes/goals.js";
import { habitsRouter } from "./routes/habits.js";
import { mastersRouter } from "./routes/masters.js";
import { gratitudeRouter } from "./routes/gratitude.js";
import { reviewsRouter } from "./routes/reviews.js";
import { musicRouter } from "./routes/music.js";
import { affirmationAudioRouter } from "./routes/affirmationAudio.js";
import { visionBoardRouter } from "./routes/visionBoard.js";
import { manifestationsRouter } from "./routes/manifestations.js";
import { preferencesRouter } from "./routes/preferences.js";

// Validate required environment variables at startup
if (process.env.NODE_ENV !== "test") {
  try {
    validateEnvironment();
  } catch (err: any) {
    console.error("Startup validation error:", err.message);
    process.exit(1);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const app = express();

// Trust reverse proxy (Nginx) for secure cookies and client IPs
app.set("trust proxy", 1);

// CORS configuration: In production, Nginx proxies same-origin /api.
// In development, only allow explicitly configured origins.
const rawCorsOrigins = process.env.CORS_ALLOWED_ORIGINS ?? (env.isProd ? "" : "http://localhost:5173,http://127.0.0.1:5173");
const allowedOrigins = rawCorsOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or same-origin requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In non-production, permit local Vite dev ports
      if (!env.isProd) {
        if (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
          return callback(null, true);
        }
      }

      const corsErr: any = new Error("CORS origin forbidden");
      corsErr.status = 403;
      return callback(corsErr, false);
    },
    credentials: true,
  })
);

app.use(cookieParser());

// Bounded JSON request body limit matching audio limits (15MB)
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Health check endpoint
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (_err) {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

// Mount modular API routers
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/habits", habitsRouter);
app.use("/api/masters", mastersRouter);
app.use("/api/gratitude", gratitudeRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/music", musicRouter);
app.use("/api/affirmation-audio", affirmationAudioRouter);
app.use("/api/vision-board", visionBoardRouter);
app.use("/api/manifestations", manifestationsRouter);
app.use("/api/preferences", preferencesRouter);

// Express 5 compatible 404 handler for API routes
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "endpoint not found" });
});

// Safe global error handler (never leaks SQL errors, stack traces, or secrets)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.status === 413 || err.type === "entity.too.large") {
    res.status(413).json({ error: "Payload too large. Maximum upload limit is 15MB." });
    return;
  }
  if (err.status === 403 || err.message === "CORS origin forbidden") {
    res.status(403).json({ error: "cross-origin request forbidden" });
    return;
  }
  console.error("[SERVER ERROR]", err);
  res.status(500).json({ error: "an internal server error occurred" });
});

// Listen strictly on configured host (default 127.0.0.1) and port
const HOST = env.api.host;
const PORT = env.api.port;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, HOST, () => {
    console.log(`[Evolve Backend] Listening securely on http://${HOST}:${PORT}`);
  });
}
