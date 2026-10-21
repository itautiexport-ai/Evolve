import readline from "readline";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { pool } from "../db/mysql/connection.js";
import { validateEnvironment } from "../config/env.js";

async function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("==================================================");
  console.log("       Evolve - Create Initial Administrator      ");
  console.log("==================================================");

  try {
    validateEnvironment();
  } catch (err: any) {
    console.error("Configuration validation failed:", err.message);
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const envName = process.env.ADMIN_NAME?.trim();
    const envEmail = process.env.ADMIN_EMAIL?.trim();
    const envPassword = process.env.ADMIN_PASSWORD?.trim();

    let name = envName;
    if (!name) {
      name = await prompt(rl, "Enter Administrator Full Name (e.g. System Admin): ");
      while (!name) {
        console.log("Name cannot be empty.");
        name = await prompt(rl, "Enter Administrator Full Name: ");
      }
    }

    let email = envEmail;
    if (!email) {
      email = await prompt(rl, "Enter Administrator Email (e.g. admin@evolve.local): ");
      while (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.log("Please enter a valid email address.");
        email = await prompt(rl, "Enter Administrator Email: ");
      }
    }
    email = email.toLowerCase();

    let password = envPassword;
    if (!password) {
      password = await prompt(rl, "Enter Administrator Password (min 8 chars): ");
      while (!password || password.length < 8) {
        console.log("Password must be at least 8 characters long.");
        password = await prompt(rl, "Enter Administrator Password (min 8 chars): ");
      }
      const confirmPassword = await prompt(rl, "Confirm Administrator Password: ");
      if (password !== confirmPassword) {
        console.error("Passwords do not match. Aborting.");
        rl.close();
        await pool.end();
        process.exit(1);
      }
    } else if (password.length < 8) {
      console.error("Provided ADMIN_PASSWORD must be at least 8 characters long.");
      rl.close();
      await pool.end();
      process.exit(1);
    }

    // Check if user exists
    const [existing] = await pool.query<any[]>("SELECT id, role FROM users WHERE email = ?", [email]);

    const passwordHash = await bcrypt.hash(password, 10);
    const today = new Date().toISOString().split("T")[0];

    let userId: string;

    if (existing.length > 0) {
      userId = existing[0].id;
      console.log(`User with email "${email}" already exists. Upgrading to ADMIN role...`);
      await pool.query(
        "UPDATE users SET name = ?, role = 'ADMIN', password_hash = ? WHERE id = ?",
        [name, passwordHash, userId]
      );
    } else {
      userId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, vibe_name, joined_date)
         VALUES (?, ?, ?, ?, 'ADMIN', 'Admin Vision', ?)`,
        [userId, name, email, passwordHash, today]
      );
    }

    // Insert or update full permissions
    await pool.query(
      `INSERT INTO user_permissions (
        user_id, access_masters, access_goals, access_goal_planner, access_vision_board,
        access_gratitude, access_habits, access_overall_dashboard, access_habits_dashboard,
        access_music, access_admin
      ) VALUES (?, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
      ON DUPLICATE KEY UPDATE
        access_masters = 1, access_goals = 1, access_goal_planner = 1, access_vision_board = 1,
        access_gratitude = 1, access_habits = 1, access_overall_dashboard = 1,
        access_habits_dashboard = 1, access_music = 1, access_admin = 1`,
      [userId]
    );

    // Record audit log
    const logId = crypto.randomUUID();
    await pool.query(
      "INSERT INTO admin_logs (id, admin_id, action, details) VALUES (?, ?, 'ADMIN_INIT', ?)",
      [logId, userId, `Initial Administrator "${name}" (${email}) created/configured via CLI`]
    );

    console.log("==================================================");
    console.log(` SUCCESS: Administrator created successfully!`);
    console.log(` User ID : ${userId}`);
    console.log(` Name    : ${name}`);
    console.log(` Email   : ${email}`);
    console.log(` Role    : ADMIN`);
    console.log("==================================================");
  } catch (err: any) {
    console.error("Error creating administrator:", err);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

main();
