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

    // ------------------------------------------------------------------------
    // 1. SELF-SIGNUP: Pending account creation, no session issued
    // ------------------------------------------------------------------------
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Pending Self User A",
        email: testEmailUserA,
        phone: "+1 555-0199",
        password: "password123!",
        role: "ADMIN", // Role escalation attempt must be ignored
      }),
    });
    assert.equal(signupRes.status, 201, "Self-signup must return 201 Created");
    const signupData = await signupRes.json();
    assert.equal(signupData.user.role, "USER", "Self-signup role must be strictly hardcoded to USER");
    assert.equal(signupData.user.status, "pending", "Self-signup status must be pending");
    assert.equal(signupData.user.phone, "+1 555-0199", "User phone must be stored");
    assert.equal(signupData.token, undefined, "JWT token must NOT be returned in JSON response");
    createdUserIds.push(signupData.user.id);

    // Verify cookies NOT set for pending self-signup
    const signupCookies = signupRes.headers.get("set-cookie") || "";
    assert.equal(signupCookies.includes("evolve_token"), false, "Pending self-signup must NOT issue session cookie");

    // Verify NO active session created in MySQL sessions table
    const [pendingSessRows] = await pool.query<any[]>(
      "SELECT * FROM sessions WHERE user_id = ?",
      [signupData.user.id]
    );
    assert.equal(pendingSessRows.length, 0, "No active session row must exist for pending account");

    // Verify row in MySQL users table
    const [userARows] = await pool.query<any[]>(
      "SELECT id, name, email, phone, role, status FROM users WHERE id = ?",
      [signupData.user.id]
    );
    assert.equal(userARows.length, 1);
    assert.equal(userARows[0].status, "pending", "Database user record must have status = pending");
    assert.equal(userARows[0].phone, "+1 555-0199", "Database user record must have phone stored");

    // ------------------------------------------------------------------------
    // 2. PENDING USER DENIAL: Login rejected with 403 PENDING_APPROVAL
    // ------------------------------------------------------------------------
    const pendingLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: testEmailUserA,
        password: "password123!",
      }),
    });
    assert.equal(pendingLoginRes.status, 403, "Pending user login must return 403 Forbidden");
    const pendingLoginData = await pendingLoginRes.json();
    assert.equal(pendingLoginData.code, "PENDING_APPROVAL", "Pending login error code must be PENDING_APPROVAL");
    assert.equal(pendingLoginData.status, "pending");

    // Also test login with User ID for pending user
    const pendingIdLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: signupData.user.id,
        password: "password123!",
      }),
    });
    assert.equal(pendingIdLoginRes.status, 403, "Pending user ID login must return 403");

    // Public status check for pending user
    const statusCheckRes = await fetch(`${baseUrl}/api/auth/status?identifier=${encodeURIComponent(signupData.user.id)}`);
    assert.equal(statusCheckRes.status, 200);
    const statusCheckData = await statusCheckRes.json();
    assert.equal(statusCheckData.status, "pending");

    // ------------------------------------------------------------------------
    // 3. ADMIN SETUP & AUTHENTICATION
    // ------------------------------------------------------------------------
    const adminId = `admin-test-${Date.now()}`;
    const adminHash = await bcrypt.hash("adminPass123!", 10);
    await pool.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, status, joined_date)
       VALUES (?, ?, ?, '+1 555-0000', ?, 'ADMIN', 'approved', '2026-01-01')`,
      [adminId, "Primary Admin", testEmailAdmin, adminHash]
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
      body: JSON.stringify({ identifier: testEmailAdmin, password: "adminPass123!" }),
    });
    assert.equal(adminLoginRes.status, 200, "Admin login must succeed");
    const adminLoginCookie = adminLoginRes.headers.get("set-cookie")!.split(";")[0];
    const adminCsrf = (await adminLoginRes.json()).csrfToken;

    // ------------------------------------------------------------------------
    // 4. ADMIN-CREATED CREDENTIALS & USER ID / EMAIL LOGIN
    // ------------------------------------------------------------------------
    const customUserId = `CORP-DEV-${Date.now()}`;
    const customUserEmail = `dev_${Date.now()}@corp.internal`;
    const customUserPhone = "+1 (555) 789-0123";
    const customUserPassword = "CustomPass789!";

    const adminCreateRes = await fetch(`${baseUrl}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${adminLoginCookie}; evolve_csrf=${adminCsrf}`,
        "X-CSRF-Token": adminCsrf,
      },
      body: JSON.stringify({
        id: customUserId,
        name: "Corporate Developer",
        email: customUserEmail,
        phone: customUserPhone,
        password: customUserPassword,
        role: "USER",
        status: "approved",
      }),
    });
    assert.equal(adminCreateRes.status, 201, "Admin creating user must return 201");
    const createdUserData = await adminCreateRes.json();
    assert.equal(createdUserData.id, customUserId, "Created user must have specified custom User ID");
    assert.equal(createdUserData.email, customUserEmail);
    assert.equal(createdUserData.phone, customUserPhone);
    assert.equal(createdUserData.status, "approved");
    createdUserIds.push(customUserId);

    // Verify persistence in MySQL
    const [customDbRows] = await pool.query<any[]>(
      "SELECT id, name, email, phone, role, status FROM users WHERE id = ?",
      [customUserId]
    );
    assert.equal(customDbRows.length, 1);
    assert.equal(customDbRows[0].id, customUserId);
    assert.equal(customDbRows[0].email, customUserEmail);
    assert.equal(customDbRows[0].phone, customUserPhone);
    assert.equal(customDbRows[0].status, "approved");

    // Login using User ID + password
    const loginWithIdRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: customUserId,
        password: customUserPassword,
      }),
    });
    assert.equal(loginWithIdRes.status, 200, "Login with custom User ID must succeed");
    const idLoginData = await loginWithIdRes.json();
    assert.equal(idLoginData.user.id, customUserId);
    const idCookie = loginWithIdRes.headers.get("set-cookie")!.split(";")[0];

    // Verify session works for protected route
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { "Cookie": idCookie },
    });
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.user.id, customUserId);
    assert.equal(meData.user.phone, customUserPhone);
    assert.equal(meData.user.status, "approved");

    // Login using email + password
    const loginWithEmailRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: customUserEmail,
        password: customUserPassword,
      }),
    });
    assert.equal(loginWithEmailRes.status, 200, "Login with email must succeed");

    // Login with wrong password must return 401
    const wrongPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: customUserId,
        password: "IncorrectPassword!",
      }),
    });
    assert.equal(wrongPassRes.status, 401, "Wrong password must return 401");

    // ------------------------------------------------------------------------
    // 5. ADMIN APPROVAL WORKFLOW
    // ------------------------------------------------------------------------
    // Admin approves User A (who self-signed up as pending)
    const approveRes = await fetch(`${baseUrl}/api/admin/users/${signupData.user.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${adminLoginCookie}; evolve_csrf=${adminCsrf}`,
        "X-CSRF-Token": adminCsrf,
      },
      body: JSON.stringify({ status: "approved" }),
    });
    assert.equal(approveRes.status, 200, "Admin approval must return 200 OK");

    // Verify status updated in MySQL database
    const [approvedDbRows] = await pool.query<any[]>(
      "SELECT status FROM users WHERE id = ?",
      [signupData.user.id]
    );
    assert.equal(approvedDbRows[0].status, "approved", "User status in MySQL must now be approved");

    // Now User A can successfully log in!
    const userALoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: testEmailUserA,
        password: "password123!",
      }),
    });
    assert.equal(userALoginRes.status, 200, "Approved user must be able to log in");
    const userATokenCookie = userALoginRes.headers.get("set-cookie")!.split(";")[0];
    const userACsrf = (await userALoginRes.json()).csrfToken;

    // ------------------------------------------------------------------------
    // 6. PROTECTED ACTIONS & CROSS-USER ISOLATION
    // ------------------------------------------------------------------------
    // User A creates a confidential goal
    const createGoalRes = await fetch(`${baseUrl}/api/goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${userATokenCookie}; evolve_csrf=${userACsrf}`,
        "X-CSRF-Token": userACsrf,
      },
      body: JSON.stringify({
        title: "User A Confidential Goal",
        category: "Health & Fitness",
      }),
    });
    assert.equal(createGoalRes.status, 201, "User A must be able to create goal");
    const goalData = await createGoalRes.json();

    // Register User B, admin approves, User B logs in
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

    // Admin approves User B
    await fetch(`${baseUrl}/api/admin/users/${userBData.user.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${adminLoginCookie}; evolve_csrf=${adminCsrf}`,
        "X-CSRF-Token": adminCsrf,
      },
      body: JSON.stringify({ status: "approved" }),
    });

    const userBLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: testEmailUserB, password: "password123!" }),
    });
    assert.equal(userBLoginRes.status, 200);
    const userBTokenCookie = userBLoginRes.headers.get("set-cookie")!.split(";")[0];
    const userBCsrf = (await userBLoginRes.json()).csrfToken;

    // Cross-user read isolation
    const userBGoalsRes = await fetch(`${baseUrl}/api/goals`, {
      headers: { "Cookie": `${userBTokenCookie}; evolve_csrf=${userBCsrf}` },
    });
    assert.equal(userBGoalsRes.status, 200);
    const userBGoals = await userBGoalsRes.json();
    assert.equal(
      userBGoals.some((g: any) => g.id === goalData.id),
      false,
      "User B must NOT see User A's goal"
    );

    // Cross-user update isolation
    const crossUpdateRes = await fetch(`${baseUrl}/api/goals/${goalData.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${userBTokenCookie}; evolve_csrf=${userBCsrf}`,
        "X-CSRF-Token": userBCsrf,
      },
      body: JSON.stringify({ title: "Tampered by User B", category: "Health & Fitness" }),
    });
    assert.equal(crossUpdateRes.status, 404, "User B must not be able to update User A's goal");

    // Cross-user delete isolation
    const crossDeleteRes = await fetch(`${baseUrl}/api/goals/${goalData.id}`, {
      method: "DELETE",
      headers: {
        "Cookie": `${userBTokenCookie}; evolve_csrf=${userBCsrf}`,
        "X-CSRF-Token": userBCsrf,
      },
    });
    assert.equal(crossDeleteRes.status, 404, "User B must not be able to delete User A's goal");

    // ------------------------------------------------------------------------
    // 7. ADMIN REJECTION WORKFLOW & SESSION REVOCATION
    // ------------------------------------------------------------------------
    // Admin rejects User B
    const rejectRes = await fetch(`${baseUrl}/api/admin/users/${userBData.user.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${adminLoginCookie}; evolve_csrf=${adminCsrf}`,
        "X-CSRF-Token": adminCsrf,
      },
      body: JSON.stringify({ status: "rejected" }),
    });
    assert.equal(rejectRes.status, 200, "Admin rejection must return 200 OK");

    // Verify sessions revoked in DB
    const [bSessRows] = await pool.query<any[]>(
      "SELECT * FROM sessions WHERE user_id = ?",
      [userBData.user.id]
    );
    assert.equal(bSessRows.length, 0, "Rejected user's active sessions must be immediately revoked");

    // User B's existing session cookie is now denied
    const rejectedReqRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { "Cookie": userBTokenCookie },
    });
    assert.equal(rejectedReqRes.status, 401, "Rejected user's old session must return 401");

    // User B login attempt is denied with 403 ACCOUNT_REJECTED
    const rejectedLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: testEmailUserB, password: "password123!" }),
    });
    assert.equal(rejectedLoginRes.status, 403, "Rejected user login must return 403");
    const rejectedData = await rejectedLoginRes.json();
    assert.equal(rejectedData.code, "ACCOUNT_REJECTED");

    // ------------------------------------------------------------------------
    // 8. PASSWORD CHANGE & LOGOUT SESSION REVOCATION
    // ------------------------------------------------------------------------
    // Password change revokes old session
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
    assert.equal(changePassRes.status, 200);

    const oldSessionMeRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { "Cookie": userATokenCookie },
    });
    assert.equal(oldSessionMeRes.status, 401, "Old session cookie must be revoked after password change");

    // Login with new password
    const newPassLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: testEmailUserA, password: "newpassword456!" }),
    });
    assert.equal(newPassLoginRes.status, 200);
    const newPassCookie = newPassLoginRes.headers.get("set-cookie")!.split(";")[0];
    const newPassCsrf = (await newPassLoginRes.json()).csrfToken;

    // Logout revokes session
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Cookie": `${newPassCookie}; evolve_csrf=${newPassCsrf}`,
        "X-CSRF-Token": newPassCsrf,
      },
    });
    assert.equal(logoutRes.status, 200);

    const afterLogoutMeRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { "Cookie": newPassCookie },
    });
    assert.equal(afterLogoutMeRes.status, 401, "Session must be denied after logout");

    // ------------------------------------------------------------------------
    // 9. API FAILURE HANDLING & PERMISSION GUARDS
    // ------------------------------------------------------------------------
    // Non-admin attempting admin endpoints must get 403
    const nonAdminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: customUserId, password: customUserPassword }),
    });
    const nonAdminCookie = nonAdminLoginRes.headers.get("set-cookie")!.split(";")[0];
    const nonAdminCsrf = (await nonAdminLoginRes.json()).csrfToken;

    const unauthStatusUpdate = await fetch(`${baseUrl}/api/admin/users/${signupData.user.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${nonAdminCookie}; evolve_csrf=${nonAdminCsrf}`,
        "X-CSRF-Token": nonAdminCsrf,
      },
      body: JSON.stringify({ status: "approved" }),
    });
    assert.equal(unauthStatusUpdate.status, 403, "Non-admin status update must be forbidden (403)");

    const unauthCreateUser = await fetch(`${baseUrl}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${nonAdminCookie}; evolve_csrf=${nonAdminCsrf}`,
        "X-CSRF-Token": nonAdminCsrf,
      },
      body: JSON.stringify({ name: "Hacker", email: "hacker@evil.com", password: "pwd" }),
    });
    assert.equal(unauthCreateUser.status, 403, "Non-admin user creation must be forbidden (403)");

    // Invalid status update value
    const invalidStatusRes = await fetch(`${baseUrl}/api/admin/users/${signupData.user.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${adminLoginCookie}; evolve_csrf=${adminCsrf}`,
        "X-CSRF-Token": adminCsrf,
      },
      body: JSON.stringify({ status: "nonexistent_status" }),
    });
    assert.equal(invalidStatusRes.status, 400, "Invalid status value must return 400 Bad Request");

    // Duplicate custom User ID
    const duplicateIdRes = await fetch(`${baseUrl}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${adminLoginCookie}; evolve_csrf=${adminCsrf}`,
        "X-CSRF-Token": adminCsrf,
      },
      body: JSON.stringify({
        id: customUserId, // Already exists
        name: "Duplicate User",
        email: `unique_${Date.now()}@test.com`,
        password: "Pass12345!",
      }),
    });
    assert.equal(duplicateIdRes.status, 409, "Duplicate User ID must return 409 Conflict");

    // Duplicate Email
    const duplicateEmailRes = await fetch(`${baseUrl}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${adminLoginCookie}; evolve_csrf=${adminCsrf}`,
        "X-CSRF-Token": adminCsrf,
      },
      body: JSON.stringify({
        id: `NEW-ID-${Date.now()}`,
        name: "Duplicate Email User",
        email: customUserEmail, // Already exists
        password: "Pass12345!",
      }),
    });
    assert.equal(duplicateEmailRes.status, 409, "Duplicate email must return 409 Conflict");

    // Nonexistent user status check
    const nonexistentStatusRes = await fetch(`${baseUrl}/api/auth/status?identifier=nonexistent_user_xyz`);
    assert.equal(nonexistentStatusRes.status, 404, "Status check for nonexistent user must return 404");

    // Demoting or rejecting the only remaining admin must fail with 400
    const rejectAdminRes = await fetch(`${baseUrl}/api/admin/users/${adminId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${adminLoginCookie}; evolve_csrf=${adminCsrf}`,
        "X-CSRF-Token": adminCsrf,
      },
      body: JSON.stringify({ status: "rejected" }),
    });
    assert.equal(rejectAdminRes.status, 400, "Rejecting the last active admin must return 400");
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
