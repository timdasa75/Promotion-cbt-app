#!/usr/bin/env node

/**
 * clean_test_data.mjs
 * 
 * Removes test/example users from the Cloudflare D1 database.
 * Run with: node scripts/clean_test_data.mjs [--dry-run]
 */

import { execSync } from "child_process";

const D1_DATABASE = "AUTH_DB";
const WORKER_PATH = "workers/admin-bridge";

function runWranglerCommand(command, options = {}) {
  try {
    const result = execSync(`cd ${WORKER_PATH} && ${command}`, {
      encoding: "utf8",
      timeout: 30000,
      ...options,
    });
    return result.trim();
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    return null;
  }
}

function extractJson(raw) {
  // Find the first '[' or '{' and last ']' or '}'
  const firstBracket = raw.indexOf('[');
  const lastBracket = raw.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1) {
    return raw.substring(firstBracket, lastBracket + 1);
  }
  return raw;
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
  };
}

async function main() {
  const { dryRun } = parseArgs();
  
  console.log("=== Test Data Cleanup ===");
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes)" : "LIVE (will delete data)"}`);
  console.log("");

  // Fetch all users
  console.log("Fetching user list...");
  const usersJson = runWranglerCommand(
    `npx wrangler d1 execute ${D1_DATABASE} --remote --command "SELECT id, email, plan, status, created_at FROM auth_users ORDER BY created_at DESC"`
  );

  if (!usersJson) {
    console.error("Failed to fetch users");
    process.exit(1);
  }

  let users;
  try {
    const parsed = JSON.parse(extractJson(usersJson));
    users = parsed[0]?.results || [];
  } catch (e) {
    console.error("Failed to parse user data");
    console.log("Raw output:", usersJson);
    process.exit(1);
  }

  console.log(`Found ${users.length} total users`);
  console.log("");

  // Identify test users
  const testUsers = users.filter((user) => {
    const email = (user.email || "").toLowerCase();
    return (
      email.includes("test") ||
      email.includes("example.com") ||
      email.includes("flw-sandbox") ||
      email.startsWith("test")
    );
  });

  if (testUsers.length === 0) {
    console.log("No test users found. Database is clean!");
    return;
  }

  console.log("Test users to delete:");
  console.log("-".repeat(60));
  testUsers.forEach((user) => {
    console.log(`  ${user.email} (plan: ${user.plan}, status: ${user.status}, created: ${user.created_at})`);
  });
  console.log("-".repeat(60));
  console.log("");

  // Count associated data
  const testIds = testUsers.map(u => `'${u.id}'`).join(",");
  
  const tokenResult = runWranglerCommand(
    `npx wrangler d1 execute ${D1_DATABASE} --remote --command "SELECT COUNT(*) as cnt FROM auth_email_tokens WHERE user_id IN (${testIds})"`
  );
  const sessionResult = runWranglerCommand(
    `npx wrangler d1 execute ${D1_DATABASE} --remote --command "SELECT COUNT(*) as cnt FROM auth_sessions WHERE user_id IN (${testIds})"`
  );
  const auditResult = runWranglerCommand(
    `npx wrangler d1 execute ${D1_DATABASE} --remote --command "SELECT COUNT(*) as cnt FROM auth_audit_log WHERE actor_user_id IN (${testIds}) OR target_user_id IN (${testIds})"`
  );
  const feedbackResult = runWranglerCommand(
    `npx wrangler d1 execute ${D1_DATABASE} --remote --command "SELECT COUNT(*) as cnt FROM feedback_submissions WHERE user_id IN (${testIds})"`
  );

  let tokenCount = 0, sessionCount = 0, auditCount = 0, feedbackCount = 0;
  try { tokenCount = JSON.parse(extractJson(tokenResult))[0]?.results[0]?.cnt || 0; } catch {}
  try { sessionCount = JSON.parse(extractJson(sessionResult))[0]?.results[0]?.cnt || 0; } catch {}
  try { auditCount = JSON.parse(extractJson(auditResult))[0]?.results[0]?.cnt || 0; } catch {}
  try { feedbackCount = JSON.parse(extractJson(feedbackResult))[0]?.results[0]?.cnt || 0; } catch {}

  console.log("Associated data to delete:");
  console.log(`  Email tokens:    ${tokenCount}`);
  console.log(`  Sessions:        ${sessionCount}`);
  console.log(`  Audit log entries: ${auditCount}`);
  console.log(`  Feedback entries: ${feedbackCount}`);
  console.log("");

  if (dryRun) {
    console.log(`[DRY RUN] Would delete ${testUsers.length} test users and ${tokenCount + sessionCount + auditCount + feedbackCount} associated records.`);
    return;
  }

  // Delete associated data first (foreign keys)
  for (const user of testUsers) {
    console.log(`Deleting user: ${user.email} (${user.id})...`);
    
    runWranglerCommand(
      `npx wrangler d1 execute ${D1_DATABASE} --remote --command "DELETE FROM auth_email_tokens WHERE user_id = '${user.id}'"`
    );
    runWranglerCommand(
      `npx wrangler d1 execute ${D1_DATABASE} --remote --command "DELETE FROM auth_sessions WHERE user_id = '${user.id}'"`
    );
    runWranglerCommand(
      `npx wrangler d1 execute ${D1_DATABASE} --remote --command "DELETE FROM auth_audit_log WHERE actor_user_id = '${user.id}' OR target_user_id = '${user.id}'"`
    );
    runWranglerCommand(
      `npx wrangler d1 execute ${D1_DATABASE} --remote --command "DELETE FROM feedback_submissions WHERE user_id = '${user.id}'"`
    );
    runWranglerCommand(
      `npx wrangler d1 execute ${D1_DATABASE} --remote --command "DELETE FROM auth_users WHERE id = '${user.id}'"`
    );

    console.log(`  ✓ Deleted ${user.email}`);
  }

  console.log("");
  console.log(`Cleanup complete! Deleted ${testUsers.length} test users.`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
