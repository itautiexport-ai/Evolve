/* Simple migration runner: executes .sql files in order, tracking which have
   already been applied in a `schema_migrations` table so re-running this
   command (e.g. after pulling a new migration file) only applies what's new,
   instead of re-running every file from 001 and failing on "already exists"
   errors. Not a replacement for a full migration tool (knex/umzug) in a real
   deployment, but sufficient - and importantly, actually idempotent - for
   this scope. */
import fs from "fs";
import path from "path";
import { pool } from "./connection.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureMigrationsTableExists() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const [rows] = await pool.query<any[]>("SELECT filename FROM schema_migrations");
  return new Set(rows.map((r) => r.filename as string));
}

async function runSqlFile(filePath: string) {
  const sql = fs.readFileSync(filePath, "utf-8");
  const withoutCommentLines = sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  const statements = withoutCommentLines
    .split(/;\s*[\r\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }
}

async function main() {
  await ensureMigrationsTableExists();
  const applied = await getAppliedMigrations();
  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  let appliedCount = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skipped (already applied): ${file}`);
      continue;
    }
    await runSqlFile(path.join(migrationsDir, file));
    await pool.query("INSERT INTO schema_migrations (filename) VALUES (?)", [file]);
    console.log(`Applied: ${file}`);
    appliedCount++;
  }

  console.log(appliedCount > 0 ? `Migrations complete (${appliedCount} newly applied).` : "Migrations complete (nothing new to apply).");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
