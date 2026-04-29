import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";
import path from "node:path";

const runId = Date.now();
const users = {
  free: `smoke-free-${runId}@example.com`,
  premium: `smoke-premium-${runId}@example.com`,
};
const FREE_PASSWORD = "SmokeFree123!";
const PREMIUM_PASSWORD = "SmokePremium123!";
const BOOTSTRAP_ATTEMPTS = 3;

function runBootstrap({ email, password, plan }) {
  const scriptPath = path.resolve("workers/admin-bridge/scripts/bootstrap-legacy-user.mjs");
  return spawnSync(
    process.execPath,
    [
      scriptPath,
      "--email",
      email,
      "--password",
      password,
      "--plan",
      plan,
      "--role",
      "user",
      "--verified",
      "true",
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: process.env,
    },
  );
}

function bootstrapCloudflareUser({ email, password, plan }) {
  let lastResult = null;
  for (let attempt = 1; attempt <= BOOTSTRAP_ATTEMPTS; attempt += 1) {
    const result = runBootstrap({ email, password, plan });
    if (result.status === 0) {
      return;
    }
    lastResult = result;
  }

  const stderr = String(lastResult?.stderr || "").trim();
  const stdout = String(lastResult?.stdout || "").trim();
  throw new Error(
    `Bootstrap failed for ${email} after ${BOOTSTRAP_ATTEMPTS} attempts.\nSTDOUT:\n${stdout || "(empty)"}\nSTDERR:\n${stderr || "(empty)"}`,
  );
}

async function dismissFreeTierModal(page) {
  const modal = page.locator("#freeTierModal");
  if (await modal.isVisible().catch(() => false)) {
    await page.click("#freeTierAcknowledgeBtn");
    await expect(modal).toBeHidden();
  }
}

async function openAuthModal(page) {
  await page.goto("/");
  await expect(page.locator("#appLoadingOverlay")).toHaveClass(/is-hidden/);
  const authModal = page.locator("#authModal");
  if (!(await authModal.isVisible())) {
    await page.locator("#startLearningBtn").dispatchEvent("click");
  }
  await expect(authModal).toBeVisible();
}

async function waitForAuthTransition(page) {
  await page.waitForFunction(() => {
    const topicScreen = document.querySelector("#topicSelectionScreen");
    const authMessage = document.querySelector("#authMessage");
    const topicVisible = topicScreen && !topicScreen.classList.contains("hidden");
    const messageText = authMessage?.textContent?.trim();
    return topicVisible || Boolean(messageText);
  });
}

async function login(page, email, password) {
  await openAuthModal(page);
  await page.click("#authTabLogin");
  await page.fill("#loginEmail", email);
  await page.fill("#loginPassword", password);
  await page.click("#loginForm button[type='submit']");
  await waitForAuthTransition(page);

  if (await page.locator("#topicSelectionScreen").isVisible()) {
    return;
  }

  const messageText = (await page.locator("#authMessage").textContent()) || "Unknown login error";
  throw new Error(`Login did not reach the topic screen for ${email}: ${messageText}`);
}

test("free and premium users load protected topic content through the Worker", async ({ page }) => {
  test.setTimeout(240000);
  test.skip(!process.env.CLOUDFLARE_API_TOKEN, "This smoke test needs CLOUDFLARE_API_TOKEN so it can seed test users in D1.");

  bootstrapCloudflareUser({ email: users.free, password: FREE_PASSWORD, plan: "free" });
  bootstrapCloudflareUser({ email: users.premium, password: PREMIUM_PASSWORD, plan: "premium" });

  const contentResponses = [];
  page.on("response", async (response) => {
    if (!response.url().includes("/content/topic-data")) return;
    const body = await response.text().catch(() => "");
    contentResponses.push({
      status: response.status(),
      url: response.url(),
      body,
    });
  });

  await login(page, users.free, FREE_PASSWORD);
  await dismissFreeTierModal(page);
  await expect(page.locator("#freePlanNotice")).toBeVisible();
  await expect(page.locator("#topicList .topic-card:not(.hidden):not(.locked)")).toHaveCount(3);

  await page.locator("#topicList .topic-card:not(.hidden):not(.locked)").first().click();
  await expect(page.locator("#categorySelectionScreen")).toBeVisible();
  await expect(page.locator("#categoryList .topic-card").first()).toBeVisible();
  await expect(page.locator("#categoryList .topic-card")).toHaveCount(6);
  await expect(page.locator("#categoryList .topic-card").first()).toContainText("20");
  await expect(page.locator("#categoryList .topic-card").last()).toContainText("100");
  await expect.poll(() => contentResponses.length).toBeGreaterThan(0);
  expect(contentResponses.some((entry) => entry.status === 200)).toBe(true);
  expect(contentResponses.at(-1)?.body || "").toContain('"payloads"');

  await page.locator("#backToTopicBtn").click();
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();
  await page.getByRole("button", { name: "Logout" }).click();

  const freeCalls = contentResponses.length;

  await login(page, users.premium, PREMIUM_PASSWORD);
  await expect(page.locator("#freePlanNotice")).toBeHidden();

  const premiumTopic = page.locator("#topicList .topic-card:not(.hidden)").nth(3);
  await expect(premiumTopic).toBeVisible();
  await premiumTopic.click();
  await expect(page.locator("#categorySelectionScreen")).toBeVisible();
  await expect(page.locator("#categoryList .topic-card").first()).toBeVisible();
  await expect.poll(() => contentResponses.length).toBeGreaterThan(freeCalls);
  const premiumSuccesses = contentResponses.slice(freeCalls).filter((entry) => entry.status === 200);
  expect(premiumSuccesses.length).toBeGreaterThan(0);
});
