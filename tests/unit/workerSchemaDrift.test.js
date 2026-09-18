// Schema-drift guard for the admin-bridge Worker's SQL.
//
// Guards against the 2026-09-18 outage class: Worker SQL referencing columns
// that do not exist (auth_users.name). Mock-backed unit tests execute JS
// closures — not real SQL — so a phantom column sails through every test and
// then throws D1 error 7500 in production, surfacing only as the generic
// "Request failed. Please try again later." toast.
//
// This test extracts every SQL statement in the Worker source that references
// the schema-managed tables and validates the columns it selects/inserts/sets
// against schema/cloudflare-auth.sql — the same file production D1 is created
// from. It cannot prove the SQL is *correct*, only that every named column
// *exists*; that is precisely the property mocks fail to check.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SCHEMA_PATH = join(ROOT, "workers", "admin-bridge", "schema", "cloudflare-auth.sql");
const WORKER_FILES = [
  join(ROOT, "workers", "admin-bridge", "worker.js"),
  join(ROOT, "workers", "admin-bridge", "auth-hybrid.js"),
];

const CONSTRAINT_KEYWORDS = new Set([
  "primary", "unique", "check", "foreign", "constraint", "key", "index",
]);

// Parse every CREATE TABLE in the schema file into a Set of column names.
export function parseSchemaTables(schemaSql) {
  const tables = new Map();
  const tableRe = /CREATE TABLE (?:IF NOT EXISTS )?([A-Za-z_]\w*)\s*\(/g;
  for (const match of schemaSql.matchAll(tableRe)) {
    const name = match[1];
    const start = match.index + match[0].length;
    let depth = 1;
    let end = start;
    while (depth > 0 && end < schemaSql.length) {
      const ch = schemaSql[end];
      if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      end += 1;
    }
    const body = schemaSql.slice(start, end - 1).replace(/--[^\n\r]*/g, "");
    const columns = new Set();
    let partDepth = 0;
    let partStart = 0;
    const parts = [];
    for (let i = 0; i < body.length; i += 1) {
      const ch = body[i];
      if (ch === "(") partDepth += 1;
      else if (ch === ")") partDepth -= 1;
      else if (ch === "," && partDepth === 0) {
        parts.push(body.slice(partStart, i));
        partStart = i + 1;
      }
    }
    parts.push(body.slice(partStart));
    for (const part of parts) {
      const firstWord = part.trim().split(/\s+/)[0]?.replace(/[`"']/g, "") || "";
      if (!firstWord || CONSTRAINT_KEYWORDS.has(firstWord.toLowerCase())) continue;
      columns.add(firstWord);
    }
    tables.set(name, columns);
  }
  return tables;
}

// Extract SQL string bodies (backtick templates and plain quotes) that mention
// a schema-managed table, from a Worker source file.
function extractStatements(source) {
  const statements = [];
  for (const m of source.matchAll(/`[^`]*`/gs)) {
    if (/\bFROM\b|\bINTO\b|\bUPDATE\b/.test(m[0])) statements.push(m[0].slice(1, -1));
  }
  for (const m of source.matchAll(/"([^"\n\\]*)"/g)) {
    if (/\b(FROM|INTO|UPDATE)\s+[a-z_]/i.test(m[1]) && /auth_users|user_profiles|auth_sessions|auth_email_tokens|auth_audit_log|otp_codes|trusted_devices|feedback_submissions|product_pricing|payment_receipts|question_edits|login_audit_log|device_auth_recovery_grants|device_verification_settings|firestore_sync_log|content_meta|auth_rate_limits/.test(m[1])) {
      statements.push(m[1]);
    }
  }
  return statements;
}

// Resolve alias -> table for FROM/JOIN clauses in a statement.
function resolveAliases(sql, knownTables) {
  const aliases = new Map();
  for (const m of sql.matchAll(/(?:FROM|JOIN)\s+([A-Za-z_]\w*)(?:\s+(?:AS\s+)?([A-Za-z_]\w*))?/gi)) {
    const table = m[1];
    if (!knownTables.has(table)) continue;
    if (m[2] && !/^(WHERE|GROUP|ORDER|LEFT|INNER|OUTER|JOIN|ON|SET|LIMIT)$/i.test(m[2])) {
      aliases.set(m[2], table);
    }
  }
  return aliases;
}

function stripPrefix(columnRef, aliases) {
  const dot = columnRef.indexOf(".");
  if (dot === -1) return { column: columnRef.trim(), table: null };
  const alias = columnRef.slice(0, dot).trim();
  return { column: columnRef.slice(dot + 1).trim(), table: aliases.get(alias) || null };
}

// Validate one statement; returns a list of { column, table, reason } violations.
export function validateStatement(sql, tables) {
  const violations = [];
  const knownTables = new Set(tables.keys());
  const aliases = resolveAliases(sql, knownTables);
  const joined = aliases.size > 0;

  function checkColumns(rawRef, phase) {
    const { column, table } = stripPrefix(rawRef, aliases);
    const clean = column.replace(/[`"']/g, "").trim();
    if (!clean || clean === "*" || /\W/.test(clean)) return; // expressions, aliases with spaces, etc.
    if (table) {
      const cols = tables.get(table);
      if (cols && !cols.has(clean)) {
        violations.push({ column: `${table}.${clean}`, phase });
      }
      return;
    }
    if (joined) return; // unprefixed column in a multi-table statement: ambiguous, skip
    // Unprefixed in a single-table statement: it must exist in EVERY known
    // table that the statement could target (we check the primary target).
    for (const m of sql.matchAll(/(?:FROM|INTO|UPDATE)\s+([A-Za-z_]\w*)/gi)) {
      const target = tables.get(m[1]);
      if (target && !target.has(clean)) {
        violations.push({ column: `${m[1]}.${clean}`, phase });
      }
      break; // primary target only
    }
  }

  // INSERT INTO t (col, col, ...)
  const insert = sql.match(/INSERT\s+INTO\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/i);
  if (insert) {
    for (const col of insert[2].split(",")) {
      const { column, table } = stripPrefix(col, aliases);
      const cols = tables.get(insert[1]);
      if (cols && column && !cols.has(column.replace(/[`"']/g, "").trim())) {
        violations.push({ column: `${insert[1]}.${column.trim()}`, phase: "insert" });
      }
    }
  }

  // UPDATE t SET col = ?, col2 = ?
  const update = sql.match(/UPDATE\s+([A-Za-z_]\w*)\s+SET\s+([\s\S]*?)(?:\bWHERE\b|$)/i);
  if (update) {
    const setClause = update[2].split(/\bWHERE\b/i)[0];
    for (const m of setClause.matchAll(/([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?)\s*=\s*\?/g)) {
      const { column, table } = stripPrefix(m[1], aliases);
      const cols = tables.get(update[1]);
      if (cols && column && !cols.has(column.replace(/[`"']/g, "").trim())) {
        violations.push({ column: `${update[1]}.${column.trim()}`, phase: "update" });
      }
    }
  }

  // SELECT list (plain columns only; expressions are skipped by checkColumns)
  const select = sql.match(/SELECT\s+([\s\S]*?)\s+FROM\s+([A-Za-z_]\w*)/i);
  if (select && !/\*/.test(select[1])) {
    for (const item of select[1].split(",")) {
      const ref = item.trim();
      if (/\(|\bAS\b/i.test(ref)) continue;
      checkColumns(ref, "select");
    }
  }

  return violations;
}

test("validator catches the exact outage pattern: selecting a phantom auth_users.name", () => {
  const tables = parseSchemaTables(readFileSync(SCHEMA_PATH, "utf8"));
  const bad = "SELECT id, email, name, status FROM auth_users WHERE email = ?1 LIMIT 1";
  const violations = validateStatement(bad, tables);
  assert.ok(
    violations.some((v) => v.column === "auth_users.name" && v.phase === "select"),
    `expected auth_users.name to be flagged, got: ${JSON.stringify(violations)}`,
  );
});

test("validator accepts valid statements", () => {
  const tables = parseSchemaTables(readFileSync(SCHEMA_PATH, "utf8"));
  assert.deepEqual(validateStatement("SELECT id, email, status FROM auth_users WHERE email = ?1 LIMIT 1", tables), []);
  assert.deepEqual(
    validateStatement("UPDATE auth_users SET phone_number = ?1, updated_at = ?2 WHERE id = ?3", tables),
    [],
  );
  assert.deepEqual(
    validateStatement("SELECT id, phone_number FROM auth_users WHERE email = ?1", tables),
    [],
  );
});

test("every Worker SQL statement's columns exist in the schema", () => {
  const tables = parseSchemaTables(readFileSync(SCHEMA_PATH, "utf8"));
  assert.ok(tables.has("auth_users"), "schema file must define auth_users");
  const problems = [];
  for (const file of WORKER_FILES) {
    const source = readFileSync(file, "utf8");
    for (const sql of extractStatements(source)) {
      for (const v of validateStatement(sql, tables)) {
        problems.push(`${file.split(/[\\/]/).pop()}: ${v.phase} references missing column ${v.column}\n    in: ${sql.replace(/\s+/g, " ").slice(0, 140)}`);
      }
    }
  }
  assert.deepEqual(problems, [], `Schema drift detected (mock-backed tests cannot catch this):\n  ${problems.join("\n  ")}`);
});
