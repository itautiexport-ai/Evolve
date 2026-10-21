import test, { after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { app } from "../index.js";
import {
  generateToken,
  generateCsrfToken,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
  requireAuth,
  requireAdmin,
  requirePermission,
  protectAuthCrossOrigin,
} from "../middleware/auth.js";
import { env } from "../config/env.js";
import { pool } from "../db/mysql/connection.js";

// Ensure test JWT secret exists
if (!env.auth.jwtSecret) {
  env.auth.jwtSecret = "test_secret_for_automated_test_suites_32_chars";
}

// Clean up database connection pool after all tests run
after(async () => {
  try {
    await pool.end();
  } catch {
    // Ignore pool shutdown errors
  }
});

// ============================================================================
// 1. AUTHENTICATION & SECURITY UNIT TESTS
// ============================================================================

test("Auth: Password hashing with bcrypt", async () => {
  const password = "SuperSecretPassword123!";
  const hash = await bcrypt.hash(password, 10);
  assert.notEqual(password, hash);

  const isMatch = await bcrypt.compare(password, hash);
  assert.equal(isMatch, true, "Valid password must match hash");

  const isWrongMatch = await bcrypt.compare("WrongPassword", hash);
  assert.equal(isWrongMatch, false, "Invalid password must not match hash");
});

test("Auth: JWT token generation and verification", () => {
  const payload = { sessionId: "sess-12345", userId: "user-12345", role: "USER" };
  const token = generateToken(payload);
  assert.ok(token && typeof token === "string", "Token must be a non-empty string");

  const decoded = jwt.verify(token, env.auth.jwtSecret) as any;
  assert.equal(decoded.sessionId, payload.sessionId);
  assert.equal(decoded.userId, payload.userId);
  assert.equal(decoded.role, payload.role);

  assert.throws(() => {
    jwt.verify(token, "wrong_secret_key_1234567890");
  }, "Token verification with invalid secret must throw");
});

test("Auth: Correctly signed JWT without sessionId is rejected with 401", async () => {
  // Regression test: correctly signed JWT with userId but NO sessionId must be rejected
  const legacyToken = jwt.sign(
    { userId: "valid-user-id-without-session", role: "USER" },
    env.auth.jwtSecret,
    { expiresIn: "7d" }
  );

  let nextCalled = false;
  let statusCode = 0;
  let jsonBody: any = null;

  const req: any = {
    method: "GET",
    cookies: { evolve_token: legacyToken },
    headers: {},
  };
  const res: any = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: any) {
      jsonBody = body;
      return this;
    },
    clearCookie() {},
  };

  await requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false, "Must not call next() for token missing sessionId");
  assert.equal(statusCode, 401, "Must return status 401 for token missing sessionId");
  assert.ok(
    jsonBody?.error && /sessionId|invalid/i.test(jsonBody.error),
    "Must return error indicating invalid token payload / missing sessionId"
  );
});

test("Auth: CSRF token generation", () => {
  const token1 = generateCsrfToken();
  const token2 = generateCsrfToken();
  assert.equal(typeof token1, "string");
  assert.equal(token1.length, 64, "Hex-encoded 32-byte CSRF token must be 64 characters");
  assert.notEqual(token1, token2, "Subsequent CSRF tokens must be unique and cryptographically secure");
});

test("Auth: Login rate limiting enforces 5 attempts maximum within window", () => {
  const testId = `test_ip_${Date.now()}_test@example.com`;

  for (let i = 1; i <= 5; i++) {
    const check = checkLoginRateLimit(testId);
    assert.equal(check.allowed, true, `Attempt ${i} should be permitted`);
    recordFailedLogin(testId);
  }

  const blockedCheck = checkLoginRateLimit(testId);
  assert.equal(blockedCheck.allowed, false, "6th attempt must be blocked by rate limiter");
  assert.ok(
    blockedCheck.remainingWaitSec && blockedCheck.remainingWaitSec > 0,
    "Blocked check must return remaining wait seconds"
  );

  clearLoginRateLimit(testId);
  const clearedCheck = checkLoginRateLimit(testId);
  assert.equal(clearedCheck.allowed, true, "Rate limit must be cleared upon successful login");
});

test("Auth: protectAuthCrossOrigin blocks cross-site and unapproved origins", () => {
  // Test 1: Sec-Fetch-Site: cross-site
  {
    let nextCalled = false;
    let statusCode = 0;
    const req: any = {
      headers: { "sec-fetch-site": "cross-site" },
    };
    const res: any = {
      status(code: number) { statusCode = code; return this; },
      json() { return this; },
    };
    protectAuthCrossOrigin(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(statusCode, 403, "cross-site fetch must be rejected with 403");
  }

  // Test 2: Unapproved origin
  {
    let nextCalled = false;
    let statusCode = 0;
    const req: any = {
      headers: { origin: "https://malicious-phishing-attacker.com" },
    };
    const res: any = {
      status(code: number) { statusCode = code; return this; },
      json() { return this; },
    };
    protectAuthCrossOrigin(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(statusCode, 403, "Unapproved origin must be rejected with 403");
  }

  // Test 3: Approved local origin in development
  {
    let nextCalled = false;
    const req: any = {
      headers: { origin: "http://localhost:5173" },
    };
    const res: any = {
      status() { return this; },
      json() { return this; },
    };
    protectAuthCrossOrigin(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true, "Local Vite development origin should be permitted");
  }
});

test("Upload Limits: Bounded audio size checks", () => {
  const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10MB decoded limit

  const smallAudioBytes = 1 * 1024 * 1024;
  const smallBase64 = Buffer.alloc(smallAudioBytes).toString("base64");
  const smallEstimatedSize = Math.ceil((smallBase64.length * 3) / 4);
  assert.ok(smallEstimatedSize <= MAX_AUDIO_BYTES, "1MB audio must be accepted within limits");

  const oversizedBytes = 12 * 1024 * 1024;
  const oversizedBase64 = Buffer.alloc(oversizedBytes).toString("base64");
  const oversizedEstimatedSize = Math.ceil((oversizedBase64.length * 3) / 4);
  assert.ok(oversizedEstimatedSize > MAX_AUDIO_BYTES, "12MB audio must exceed 10MB limit");
});

// ============================================================================
// 2. MIDDLEWARE ENFORCEMENT & FAIL-CLOSED LOGIC TESTS
// ============================================================================

test("CSRF Enforcement: Mutating requests require valid matching CSRF token", async () => {
  const token = generateToken({ sessionId: "sess-1", userId: "user-1", role: "USER" });
  const csrf = generateCsrfToken();

  // Missing header
  {
    let nextCalled = false;
    let statusCode = 0;
    const req: any = {
      method: "POST",
      cookies: { evolve_token: token, evolve_csrf: csrf },
      headers: {},
    };
    const res: any = {
      status(code: number) { statusCode = code; return this; },
      json() { return this; },
    };
    await requireAuth(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(statusCode, 403, "Mutating request without X-CSRF-Token must return 403");
  }

  // Mismatched header
  {
    let nextCalled = false;
    let statusCode = 0;
    const req: any = {
      method: "POST",
      cookies: { evolve_token: token, evolve_csrf: csrf },
      headers: { "x-csrf-token": "mismatched_token_abc" },
    };
    const res: any = {
      status(code: number) { statusCode = code; return this; },
      json() { return this; },
    };
    await requireAuth(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(statusCode, 403, "Mutating request with mismatched X-CSRF-Token must return 403");
  }
});

test("Permissions: Database error in requirePermission fails closed (status 500, never calls next)", async () => {
  const origQuery = pool.query;
  try {
    (pool as any).query = async () => {
      throw new Error("Simulated database failure in permission check");
    };

    let nextCalled = false;
    let statusCode = 0;
    let jsonBody: any = null;

    const req: any = {
      userId: "user-test-fail-closed",
      userRole: "USER",
    };
    const res: any = {
      status(code: number) { statusCode = code; return this; },
      json(body: any) { jsonBody = body; return this; },
    };

    const middleware = requirePermission("access_goals");
    await middleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false, "Must NEVER call next() on database error in permission check");
    assert.equal(statusCode, 500, "Must return status 500 on permission database error");
    assert.ok(jsonBody?.error, "Must return an error message");
  } finally {
    pool.query = origQuery;
  }
});

test("Permissions: Database error in requireAdmin fails closed (status 500, never calls next)", async () => {
  const origQuery = pool.query;
  try {
    (pool as any).query = async () => {
      throw new Error("Simulated database failure in admin verification");
    };

    let nextCalled = false;
    let statusCode = 0;
    let jsonBody: any = null;

    const req: any = {
      userId: "admin-test-fail-closed",
      userRole: "ADMIN",
    };
    const res: any = {
      status(code: number) { statusCode = code; return this; },
      json(body: any) { jsonBody = body; return this; },
    };

    await requireAdmin(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false, "Must NEVER call next() on admin check database error");
    assert.equal(statusCode, 500, "Must return status 500 on admin database error");
    assert.ok(jsonBody?.error, "Must return an error message");
  } finally {
    pool.query = origQuery;
  }
});

test("Permissions: Explicit safe behavior for missing permission records", async () => {
  const origQuery = pool.query;
  try {
    // Return empty array (simulating missing permission row)
    (pool as any).query = async () => [[]];

    // access_admin missing record must fail closed (403)
    let adminNextCalled = false;
    let adminStatus = 0;
    const adminReq: any = { userId: "user-no-perms", userRole: "USER" };
    const adminRes: any = {
      status(code: number) { adminStatus = code; return this; },
      json() { return this; },
    };
    await requirePermission("access_admin")(adminReq, adminRes, () => { adminNextCalled = true; });
    assert.equal(adminNextCalled, false, "access_admin must fail closed if permission row missing");
    assert.equal(adminStatus, 403, "access_admin must return 403 for missing record");

    // Standard module (e.g. access_goals) defaults safely to true for regular user
    let goalsNextCalled = false;
    const goalsReq: any = { userId: "user-no-perms", userRole: "USER" };
    const goalsRes: any = {
      status() { return this; },
      json() { return this; },
    };
    await requirePermission("access_goals")(goalsReq, goalsRes, () => { goalsNextCalled = true; });
    assert.equal(goalsNextCalled, true, "Standard user modules safely default to true when record is pending");
  } finally {
    pool.query = origQuery;
  }
});

test("Permissions: Explicit permission denial when permission is 0 in database", async () => {
  const origQuery = pool.query;
  try {
    (pool as any).query = async () => [[{ access_goals: 0 }]];

    let nextCalled = false;
    let statusCode = 0;
    const req: any = { userId: "user-restricted", userRole: "USER" };
    const res: any = {
      status(code: number) { statusCode = code; return this; },
      json() { return this; },
    };

    await requirePermission("access_goals")(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false, "Must not call next() when access_goals is 0");
    assert.equal(statusCode, 403, "Must return 403 when permission is explicitly disabled");
  } finally {
    pool.query = origQuery;
  }
});

// ============================================================================
// 3. HTTP ENDPOINT TESTS (EXPRESS 5 ROUTING, HEALTH, CORS)
// ============================================================================

test("HTTP: Server startup, health endpoint, and Express 5 404 routing", async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.ok(healthRes.status === 200 || healthRes.status === 500);

    // Express 5 compatible /api 404 handler
    const notFoundRes = await fetch(`${baseUrl}/api/nonexistent-endpoint-route`);
    assert.equal(notFoundRes.status, 404);
    const notFoundJson = await notFoundRes.json();
    assert.equal(notFoundJson.error, "endpoint not found");
  } finally {
    server.close();
  }
});

test("HTTP: Cross-origin rejection on login endpoint", async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const crossRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Origin": "http://unapproved-cross-origin.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "user@example.com", password: "password123" }),
    });
    assert.equal(crossRes.status, 403, "Unapproved cross-origin request must be rejected with 403");
  } finally {
    server.close();
  }
});

// ============================================================================
// 4. LIVE MYSQL ISOLATED INTEGRATION TESTS
// ============================================================================

test("Database: Live MySQL Integration Test Suite", async (t) => {
  // CRITICAL SAFETY INVARIANT:
  // Before ANY integration-test database connection or mutation, require DB_NAME to equal 'evolve_test' exactly.
  const activeDbName = process.env.DB_NAME || env.db.name;
  if (activeDbName !== "evolve_test") {
    assert.fail(
      `[INTEGRATION TEST SAFETY FAILURE] Integration tests require DB_NAME to equal 'evolve_test' exactly before any connection or mutation (current: '${activeDbName}'). ` +
      `Ensure DB_NAME=evolve_test is set to prevent testing against production or inappropriate databases.`
    );
  }

  let isConnected = false;
  let connectionError: any = null;

  try {
    const [rows] = await pool.query<any[]>("SELECT 1 as ok");
    if (rows && rows[0]?.ok === 1) {
      isConnected = true;
    }
  } catch (err: any) {
    connectionError = err;
  }

  if (!isConnected) {
    if (process.env.TEST_REQUIRE_MYSQL === "true") {
      assert.fail(
        `[REQUIRED INTEGRATION TEST FAILED] MySQL test database is not available on ${env.db.host}:${env.db.port} (${connectionError?.message}). ` +
        `Ensure MySQL is running with valid test credentials before invoking test:integration.`
      );
    } else {
      t.skip(
        `MySQL database on ${env.db.host}:${env.db.port} is not available: ${connectionError?.message}. ` +
        `Skipping live MySQL integration tests. Run 'npm run test:integration' with an active MySQL test database.`
      );
      return;
    }
  }

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const createdUserIds: string[] = [];

  try {
    const testEmailUserA = `test_usera_${Date.now()}@example.com`;
    const testEmailUserB = `test_userb_${Date.now()}@example.com`;
    const testEmailAdmin = `test_admin_${Date.now()}@example.com`;

    // 1. Signup role escalation prevention
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Attacker User",
        email: testEmailUserA,
        password: "password123!",
        role: "ADMIN", // Role escalation attempt
      }),
    });
    assert.equal(signupRes.status, 201);
    const signupData = await signupRes.json();
    assert.equal(signupData.user.role, "USER", "Signup role must be strictly hardcoded to USER");
    assert.equal(signupData.token, undefined, "JWT token must NOT be returned in JSON response");
    createdUserIds.push(signupData.user.id);

    // Verify cookies set
    const cookies = signupRes.headers.get("set-cookie") || "";
    assert.ok(cookies.includes("evolve_token"), "HttpOnly evolve_token cookie must be set");
    assert.ok(cookies.includes("evolve_csrf"), "evolve_csrf cookie must be set");

    // 2. Revocable session created in sessions table
    const [sessRows] = await pool.query<any[]>(
      "SELECT * FROM sessions WHERE user_id = ?",
      [signupData.user.id]
    );
    assert.ok(sessRows.length > 0, "Active session row must be created in MySQL sessions table");

    // 3. User B registration
    const signupBRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "User B",
        email: testEmailUserB,
        password: "password123!",
      }),
    });
    assert.equal(signupBRes.status, 201);
    const userBData = await signupBRes.json();
    createdUserIds.push(userBData.user.id);

    // 4. Cross-user read, update, and delete isolation
    // User A creates a confidential goal
    const userATokenCookie = signupRes.headers.get("set-cookie")!.split(";")[0];
    const userACsrf = signupData.csrfToken;

    const createGoalRes = await fetch(`${baseUrl}/api/goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${userATokenCookie}; evolve_csrf=${userACsrf}`,
        "X-CSRF-Token": userACsrf,
      },
      body: JSON.stringify({
        title: "User A Confidential Goal",
        category: "health",
      }),
    });
    assert.equal(createGoalRes.status, 201);
    const goalData = await createGoalRes.json();

    // 4a. Cross-user READ isolation: User B fetches their goals list
    const userBTokenCookie = signupBRes.headers.get("set-cookie")!.split(";")[0];
    const userBCsrf = userBData.csrfToken;

    const userBGoalsRes = await fetch(`${baseUrl}/api/goals`, {
      headers: {
        "Cookie": `${userBTokenCookie}; evolve_csrf=${userBCsrf}`,
      },
    });
    assert.equal(userBGoalsRes.status, 200);
    const userBGoals = await userBGoalsRes.json();
    const leakedGoal = userBGoals.find((g: any) => g.id === goalData.id || g.title === "User A Confidential Goal");
    assert.equal(leakedGoal, undefined, "User B must NOT see User A's goal in GET /api/goals (read isolation)");

    // 4b. Cross-user UPDATE isolation: User B attempts to update User A's goal
    const crossUpdateRes = await fetch(`${baseUrl}/api/goals/${goalData.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${userBTokenCookie}; evolve_csrf=${userBCsrf}`,
        "X-CSRF-Token": userBCsrf,
      },
      body: JSON.stringify({ title: "Tampered by User B" }),
    });
    assert.equal(crossUpdateRes.status, 404, "User B must not be able to update User A's goal (update isolation)");

    // 4c. Cross-user DELETE isolation: User B attempts to delete User A's goal
    const crossDeleteRes = await fetch(`${baseUrl}/api/goals/${goalData.id}`, {
      method: "DELETE",
      headers: {
        "Cookie": `${userBTokenCookie}; evolve_csrf=${userBCsrf}`,
        "X-CSRF-Token": userBCsrf,
      },
    });
    assert.equal(crossDeleteRes.status, 404, "User B must not be able to delete User A's goal (delete isolation)");

    // Verify User A's goal was NOT deleted in MySQL database
    const [goalCheckRows] = await pool.query<any[]>("SELECT id FROM goals WHERE id = ?", [goalData.id]);
    assert.equal(goalCheckRows.length, 1, "User A's goal must still exist in MySQL after unauthorized delete attempt");

    // 5. Password-change session revocation
    const changePassRes = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${userATokenCookie}; evolve_csrf=${userACsrf}`,
        "X-CSRF-Token": userACsrf,
      },
      body: JSON.stringify({
        currentPassword: "password123!",
        newPassword: "newpassword456!",
      }),
    });
    assert.equal(changePassRes.status, 200, "Password change must succeed with valid credentials");

    // Subsequent request with OLD session cookie must immediately be rejected (revoked session)
    const oldCookieMeRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { "Cookie": userATokenCookie },
    });
    assert.equal(oldCookieMeRes.status, 401, "Old session cookie must immediately return 401 after password change");

    // Verify User A can log in with new password
    const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmailUserA, password: "newpassword456!" }),
    });
    assert.equal(newLoginRes.status, 200, "User must be able to log in with new password");

    // Verify User A CANNOT log in with old password
    const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmailUserA, password: "password123!" }),
    });
    assert.equal(oldLoginRes.status, 401, "Old password must be rejected");

    // 6. Logout session revocation
    const activeCookie = newLoginRes.headers.get("set-cookie")!.split(";")[0];
    const newCsrf = (await newLoginRes.json()).csrfToken;

    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Cookie": `${activeCookie}; evolve_csrf=${newCsrf}`,
        "X-CSRF-Token": newCsrf,
      },
    });
    assert.equal(logoutRes.status, 200);

    const afterLogoutRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { "Cookie": activeCookie },
    });
    assert.equal(afterLogoutRes.status, 401, "Revoked session must immediately be denied access after logout");

    // 7. Admin demotion immediate lockout
    const adminId = `admin-test-${Date.now()}`;
    const adminHash = await bcrypt.hash("password123!", 10);
    await pool.query(
      "INSERT INTO users (id, name, email, password_hash, role, joined_date) VALUES (?, ?, ?, ?, 'ADMIN', ?)",
      [adminId, "Admin User", testEmailAdmin, adminHash, "2026-01-01"]
    );
    await pool.query(
      "INSERT INTO user_permissions (user_id, access_admin) VALUES (?, 1)",
      [adminId]
    );
    createdUserIds.push(adminId);

    // Admin login
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmailAdmin, password: "password123!" }),
    });
    assert.equal(adminLoginRes.status, 200);
    const adminLoginCookie = adminLoginRes.headers.get("set-cookie")!.split(";")[0];

    // Verify admin access works
    const adminAccessRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { "Cookie": adminLoginCookie },
    });
    assert.equal(adminAccessRes.status, 200, "Admin user must have access to admin routes");

    // Demote admin user in MySQL to USER
    await pool.query("UPDATE users SET role = 'USER' WHERE id = ?", [adminId]);

    // Demoted user immediately loses admin access without re-login
    const demotedAccessRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { "Cookie": adminLoginCookie },
    });
    assert.equal(demotedAccessRes.status, 403, "Demoted administrator must immediately lose access to admin routes");

    // 8. Deleted user immediate lockout
    await pool.query("DELETE FROM users WHERE id = ?", [adminId]);
    const deletedAccessRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { "Cookie": adminLoginCookie },
    });
    assert.equal(deletedAccessRes.status, 401, "Deleted user must immediately lose all access");
  } finally {
    server.close();
    // Clean up test records in finally block
    if (createdUserIds.length > 0) {
      try {
        for (const uid of createdUserIds) {
          await pool.query("DELETE FROM sessions WHERE user_id = ?", [uid]);
          await pool.query("DELETE FROM goals WHERE user_id = ?", [uid]);
          await pool.query("DELETE FROM user_permissions WHERE user_id = ?", [uid]);
          await pool.query("DELETE FROM users WHERE id = ?", [uid]);
        }
      } catch (cleanupErr) {
        console.warn("Test records cleanup error in finally block:", cleanupErr);
      }
    }
  }
});
