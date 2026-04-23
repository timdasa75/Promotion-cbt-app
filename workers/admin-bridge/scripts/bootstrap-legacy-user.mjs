import { randomBytes, pbkdf2Sync, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PASSWORD_HASH_ITERATIONS = 100000;
const PASSWORD_HASH_ALGORITHM = "pbkdf2_sha256";
const PASSWORD_SALT_BYTES = 16;
const VALID_ROLES = new Set(["user", "admin"]);
const VALID_PLANS = new Set(["free", "premium"]);
const VALID_STATUSES = new Set(["active", "suspended", "deleted"]);

function printUsage() {
  console.log(`Usage:\n  node ./scripts/bootstrap-legacy-user.mjs --email <email> --password <password> [--plan free|premium] [--role user|admin] [--status active|suspended|deleted] [--verified true|false] [--remote true|false]\n\nExample:\n  node ./scripts/bootstrap-legacy-user.mjs --email timdasa75@gmail.com --password "StrongPass123!" --plan premium --role admin --verified true`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "").trim();
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (typeof next === "undefined" || String(next).startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = String(next);
    i += 1;
  }
  return args;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function base64UrlEncode(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function hashPassword(password) {
  const normalizedPassword = String(password || "");
  if (normalizedPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const digest = pbkdf2Sync(normalizedPassword, salt, PASSWORD_HASH_ITERATIONS, 32, "sha256");
  return `${PASSWORD_HASH_ALGORITHM}$${PASSWORD_HASH_ITERATIONS}$${base64UrlEncode(salt)}$${base64UrlEncode(digest)}`;
}

function escapeSql(value) {
  return String(value || "").replace(/'/g, "''");
}

function buildBootstrapSql({ email, passwordHash, role, plan, status, emailVerified, nowIso }) {
  const userId = randomUUID();
  return `
INSERT INTO auth_users (
  id,
  email,
  password_hash,
  role,
  plan,
  status,
  email_verified,
  legacy_provider,
  legacy_user_id,
  created_at,
  updated_at,
  last_login_at
) VALUES (
  '${escapeSql(userId)}',
  '${escapeSql(email)}',
  '${escapeSql(passwordHash)}',
  '${escapeSql(role)}',
  '${escapeSql(plan)}',
  '${escapeSql(status)}',
  ${emailVerified ? 1 : 0},
  'firebase',
  '',
  '${escapeSql(nowIso)}',
  '${escapeSql(nowIso)}',
  ''
)
ON CONFLICT(email) DO UPDATE SET
  password_hash = excluded.password_hash,
  role = excluded.role,
  plan = excluded.plan,
  status = excluded.status,
  email_verified = excluded.email_verified,
  legacy_provider = 'firebase',
  updated_at = excluded.updated_at;`.trim();
}

const args = parseArgs(process.argv.slice(2));
if (args.help || args.h) {
  printUsage();
  process.exit(0);
}

const email = normalizeEmail(args.email);
const password = String(args.password || "");
const role = String(args.role || "user").trim().toLowerCase();
const plan = String(args.plan || "free").trim().toLowerCase();
const status = String(args.status || "active").trim().toLowerCase();
const emailVerified = toBoolean(args.verified, true);
const useRemote = toBoolean(args.remote, true);

if (!email || !email.includes("@")) {
  console.error("Error: --email must be a valid email address.");
  printUsage();
  process.exit(1);
}
if (!VALID_ROLES.has(role)) {
  console.error("Error: --role must be one of: user, admin.");
  process.exit(1);
}
if (!VALID_PLANS.has(plan)) {
  console.error("Error: --plan must be one of: free, premium.");
  process.exit(1);
}
if (!VALID_STATUSES.has(status)) {
  console.error("Error: --status must be one of: active, suspended, deleted.");
  process.exit(1);
}

const passwordHash = hashPassword(password);
const nowIso = new Date().toISOString();
const sql = buildBootstrapSql({ email, passwordHash, role, plan, status, emailVerified, nowIso });
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workerDir = path.resolve(scriptDir, "..");
const tempDir = mkdtempSync(path.join(tmpdir(), "promotion-cbt-auth-bootstrap-"));
const sqlFile = path.join(tempDir, "bootstrap-legacy-user.sql");
writeFileSync(sqlFile, `${sql}\n`, "utf-8");
const commandArgs = ["wrangler", "d1", "execute", "AUTH_DB", "--yes"];
if (useRemote) commandArgs.push("--remote");
commandArgs.push("--file", sqlFile);

console.log(`Bootstrapping ${email} into Cloudflare auth (${useRemote ? "remote" : "local"} D1)...`);
const result = process.platform === "win32"
  ? spawnSync("cmd.exe", ["/d", "/s", "/c", "npx", ...commandArgs], {
      cwd: workerDir,
      stdio: "inherit",
      shell: false,
      env: process.env,
    })
  : spawnSync("npx", commandArgs, {
      cwd: workerDir,
      stdio: "inherit",
      shell: false,
      env: process.env,
    });

try {
  rmSync(tempDir, { recursive: true, force: true });
} catch (error) {
  // Ignore temporary file cleanup failures.
}

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log(`\nSuccess. ${email} can now sign in through Cloudflare auth with the password you provided.`);
