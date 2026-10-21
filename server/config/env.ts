import dotenv from "dotenv";
dotenv.config();


export function validateEnvironment(): void {
  const missing: string[] = [];
  const requiredKeys = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD", "JWT_SECRET"];
  
  for (const key of requiredKeys) {
    if (!process.env[key]?.trim()) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `[CONFIG ERROR] Application failed to start. Missing required environment variables: ${missing.join(", ")}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  if ((process.env.JWT_SECRET?.trim().length ?? 0) < 16) {
    const errorMsg = "[CONFIG ERROR] JWT_SECRET must be at least 16 characters long for secure token signing.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

const nodeEnv = process.env.NODE_ENV || "development";
const isProd = nodeEnv === "production";

export const env = {
  nodeEnv,
  isProd,
  api: {
    host: process.env.API_HOST || "127.0.0.1",
    port: Number(process.env.API_PORT || 3001),
  },
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    name: process.env.DB_NAME || (nodeEnv === "test" ? "evolve_test" : "evolve"),
    user: process.env.DB_USER || "evolve_app",
    password: process.env.DB_PASSWORD || "",
    poolMin: Number(process.env.DB_POOL_MIN ?? 2),
    poolMax: Number(process.env.DB_POOL_MAX ?? 10),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || (nodeEnv === "test" ? "test_secret_for_automated_test_suites_32_chars" : ""),
    cookieSecure: process.env.COOKIE_SECURE === "true" || (process.env.COOKIE_SECURE === undefined && isProd),
    cookieSameSite: (process.env.COOKIE_SAMESITE as "lax" | "strict" | "none") || "lax",
    tokenExpiry: process.env.JWT_EXPIRY || "7d",
  },
};
