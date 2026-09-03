import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Stage 6 — responsive matrix. Runs the primary surfaces at the four agreed
// viewports, asserts there is no horizontal page overflow and no visible
// control is clipped by the viewport, and saves screenshots under
// artifacts/responsive/ for visual review.
//
// Coverage notes: learner screens that need a completed scored session
// (results, quiz mid-session) are not driven here because that would require
// a full quiz run per viewport; the surfaces that contain the widest grids,
// toolbars, and modal layouts (splash, auth modal, dashboard, category/setup,
// help, profile, pricing modal) are covered instead. Admin is admin-gated and
// intentionally excluded from automated mobile coverage.

const VIEWPORTS = [
  { width: 375, height: 812, label: "mobile" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 1280, height: 900, label: "desktop" },
  { width: 1920, height: 1080, label: "wide" },
];

const SHOT_DIR = path.resolve("artifacts", "responsive");
fs.mkdirSync(SHOT_DIR, { recursive: true });

const OVERFLOW_TOLERANCE = 2;

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    docScroll: document.documentElement.scrollWidth,
    docClient: document.documentElement.clientWidth,
    bodyScroll: document.body.scrollWidth,
  }));
  const message = `${label}: doc ${metrics.docScroll}<=${metrics.docClient}+tol, body ${metrics.bodyScroll}<=${metrics.docClient}+tol`;
  expect(metrics.docScroll, message).toBeLessThanOrEqual(metrics.docClient + OVERFLOW_TOLERANCE);
  expect(metrics.bodyScroll, message).toBeLessThanOrEqual(metrics.docClient + OVERFLOW_TOLERANCE);
}

async function assertNoClippedVisibleButtons(page, label) {
  const clipped = await page.evaluate(() => {
    const viewport = window.innerWidth;
    const results = [];
    document.querySelectorAll("button, .btn").forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      // Ignore full-bleed stretched grid cells and offscreen-but-fine rows:
      // only flag items whose box overflows the viewport horizontally.
      if (rect.left < -1 || rect.right > viewport + 2) {
        results.push({
          cls: String(el.className || el.id || el.tagName).slice(0, 60),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          vw: viewport,
        });
      }
    });
    return results;
  });
  expect(clipped, `${label} clipped controls: ${JSON.stringify(clipped.slice(0, 8))}`).toEqual([]);
}

async function shot(page, label) {
  await page.screenshot({
    path: path.join(SHOT_DIR, `${label}.png`),
    fullPage: false,
  });
}

async function openAuthIfNeeded(page) {
  const authModal = page.locator("#authModal");
  if (!(await authModal.isVisible())) {
    await page.locator("#startLearningBtn").dispatchEvent("click");
  }
  await expect(authModal).toBeVisible();
}

async function registerDemoUser(page, email) {
  await openAuthIfNeeded(page);
  await page.click("#authTabRegister");
  await page.fill("#registerName", "Responsive Check");
  await page.fill("#registerEmail", email);
  await page.fill("#registerPassword", "password123");
  await page.fill("#registerConfirmPassword", "password123");
  await page.click("#registerForm button[type='submit']");
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();
  const freeTierModal = page.locator("#freeTierModal");
  if (await freeTierModal.isVisible()) {
    await page.click("#freeTierAcknowledgeBtn");
    await expect(freeTierModal).toBeHidden();
  }
}

// The same browser context is reused across viewport iterations, so after the
// first registration the demo session persists: subsequent loads restore the
// dashboard directly without an auth prompt.
async function ensureSignedIn(page, email) {
  await page.goto("/");
  await expect(page.locator("#appLoadingOverlay")).toHaveClass(/is-hidden/);
  if (!(await page.locator("#topicSelectionScreen").isVisible().catch(() => false))) {
    await registerDemoUser(page, email);
  }
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();
}

async function measureVisibleExtents(page, selector) {
  return page.evaluate((sel) => {
    const els = [...document.querySelectorAll(sel)]
      .filter((el) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
      })
      .map((el) => el.getBoundingClientRect());
    if (!els.length) return null;
    return {
      minLeft: Math.min(...els.map((r) => r.left)),
      maxRight: Math.max(...els.map((r) => r.right)),
      vw: window.innerWidth,
    };
  }, selector);
}

async function assertAuthModalFits(page) {
  await openAuthIfNeeded(page);
  await assertNoHorizontalOverflow(page, "auth");
  const extents = await measureVisibleExtents(page, "#authModal *");
  expect(extents, "auth modal extents").not.toBeNull();
  expect(extents.minLeft, "auth modal starts inside viewport").toBeGreaterThanOrEqual(-1);
  expect(extents.maxRight, "auth modal fits width").toBeLessThanOrEqual(extents.vw + OVERFLOW_TOLERANCE);
}

test.beforeEach(async ({ page }) => {
  await page.route("**/config/runtime-auth.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "window.PROMOTION_CBT_AUTH = window.PROMOTION_CBT_AUTH || {};",
    }),
  );
  await page.addInitScript(() => {
    window.PROMOTION_CBT_AUTH = {
      firebaseApiKey: "",
      firebaseProjectId: "",
      firebaseAuthDomain: "",
      paymentProvider: "flutterwave",
    };
  });
});

test("public surfaces fit the responsive matrix", async ({ page }) => {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const tag = `splash-${vp.label}`;
    await page.goto("/");
    await expect(page.locator("#appLoadingOverlay")).toHaveClass(/is-hidden/);
    await assertNoHorizontalOverflow(page, tag);
    await assertNoClippedVisibleButtons(page, tag);
    await shot(page, tag);

    // Auth modal fits and its close control stays inside the viewport.
    await assertAuthModalFits(page);
    await assertNoHorizontalOverflow(page, `auth-${vp.label}`);
    await shot(page, `auth-${vp.label}`);

    // Help is public and must not overflow at any width.
    await page.locator("#headerHelpBtn").dispatchEvent("click");
    await expect(page.locator("#helpScreen")).toBeVisible();
    await assertNoHorizontalOverflow(page, `help-${vp.label}`);
    await assertNoClippedVisibleButtons(page, `help-${vp.label}`);
    await shot(page, `help-${vp.label}`);
  }
});

test("learner surfaces fit the responsive matrix", async ({ page }) => {
  test.setTimeout(240_000);
  for (const vp of VIEWPORTS) {
    const email = `responsive-${Date.now()}@example.com`;
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await ensureSignedIn(page, email);

    const tag = (name) => `${name}-${vp.label}`;

    // Dashboard: topic grid, quick actions, first-session panel.
    await expect(page.locator("#topicList .topic-card").first()).toBeVisible();
    await assertNoHorizontalOverflow(page, tag("dashboard"));
    await assertNoClippedVisibleButtons(page, tag("dashboard"));
    await shot(page, tag("dashboard"));

    // Help via header (data-screen-target works at every width).
    await page.locator("#headerHelpBtn").dispatchEvent("click");
    await expect(page.locator("#helpScreen")).toBeVisible();
    await assertNoHorizontalOverflow(page, tag("help"));
    await shot(page, tag("help"));

    // Profile settings screen.
    await page.locator("#headerProfileBtn").dispatchEvent("click");
    await expect(page.locator("#profileScreen")).toBeVisible();
    await assertNoHorizontalOverflow(page, tag("profile"));
    await assertNoClippedVisibleButtons(page, tag("profile"));
    await shot(page, tag("profile"));

    // Session setup: open the first unlocked topic's categories, then modes.
    await page.locator("[data-screen-target='topicSelectionScreen']").first().dispatchEvent("click");
    await expect(page.locator("#topicSelectionScreen")).toBeVisible();
    const firstUnlocked = page.locator(".topic-card:not(.locked)").first();
    await expect(firstUnlocked).toBeVisible();
    await firstUnlocked.click();
    const modeScreen = page.locator("#modeSelectionScreen");
    const reachedMode = await modeScreen
      .waitFor({ state: "visible", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (!reachedMode) {
      await expect(page.locator("#categorySelectionScreen")).toBeVisible({ timeout: 30_000 });
      const categoryCards = page.locator("#categoryList .topic-card");
      await expect(categoryCards.first()).toBeVisible({ timeout: 30_000 });
      await assertNoHorizontalOverflow(page, tag("category"));
      await assertNoClippedVisibleButtons(page, tag("category"));
      await shot(page, tag("category"));
      await page.locator("#categoryList .topic-card:not(.locked)").first().click();
      await modeScreen.waitFor({ state: "visible", timeout: 30_000 });
    }
    await expect(modeScreen).toBeVisible();
    await assertNoHorizontalOverflow(page, tag("setup"));
    await assertNoClippedVisibleButtons(page, tag("setup"));
    await shot(page, tag("setup"));

    // Pricing modal from a locked premium topic chip stays on-screen.
    await page.locator("[data-screen-target='topicSelectionScreen']").first().dispatchEvent("click");
    await expect(page.locator("#topicSelectionScreen")).toBeVisible();
    const premiumAction = page.locator(".topic-card.locked button[data-open-pricing]").first();
    await expect(premiumAction).toBeVisible();
    await premiumAction.click();
    await expect(page.locator("#pricingModal")).toBeVisible();
    const pricingBox = await page.locator("#pricingModal > *").last().boundingBox();
    expect(pricingBox, "pricing modal within viewport").toBeDefined();
    expect(pricingBox.width).toBeLessThanOrEqual(vp.width + OVERFLOW_TOLERANCE);
    await shot(page, tag("pricing"));
  }
});
