import mysql from "mysql2/promise";
import { env } from "../../config/env";

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  connectionLimit: env.db.poolMax,
  waitForConnections: true,
  dateStrings: true,
});

export type DbPool = typeof pool;
