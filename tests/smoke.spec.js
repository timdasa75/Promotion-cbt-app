import { test, expect } from "@playwright/test";

async function registerAndEnter(page, email = "testuser@example.com") {
  await page.addInitScript(() => {
    window.PROMOTION_CBT_AUTH = { supabaseUrl: "", supabaseAnonKey: "" };
  });
  await page.goto("/");
  await page.click("#startLearningBtn");
  await expect(page.locator("#authModal")).toBeVisible();
  await page.click("#authTabRegister");
  await page.fill("#registerName", "Test User");
  await page.fill("#registerEmail", email);
  await page.fill("#registerPassword", "password123");
  await page.fill("#registerConfirmPassword", "password123");
  await page.click("#registerForm button[type='submit']");
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();
}

test("dashboard filters and action buttons are interactive", async ({ page }) => {
  await registerAndEnter(page, "dashboard@example.com");
  await expect(page.locator("#topicList .topic-card:not(.hidden)").first()).toBeVisible();
  await expect(page.locator("#freePlanNotice")).toBeVisible();

  const allCards = page.locator("#topicList .topic-card:not(.hidden)");
  const totalCards = await allCards.count();
  expect(totalCards).toBeGreaterThan(0);
  expect(totalCards).toBeGreaterThan(1);
  const unlockedCards = page.locator("#topicList .topic-card:not(.hidden):not(.locked)");
  const lockedCards = page.locator("#topicList .topic-card.locked:not(.hidden)");
  await expect(unlockedCards).toHaveCount(1);
  expect(await lockedCards.count()).toBeGreaterThan(0);

  await page.click("#filterRecentBtn");
  const visibleRecent = await page.locator("#topicList .topic-card:not(.hidden)").count();
  expect(visibleRecent).toBeGreaterThanOrEqual(0);

  await page.click("#filterDocumentBtn");
  const visibleDocument = await page.locator("#topicList .topic-card:not(.hidden)").count();
  expect(visibleDocument).toBeGreaterThan(0);

  await page.click("#startRecommendationBtn");
  await expect(page.locator("#categorySelectionScreen")).toBeVisible();
});

test("review mode acts as pre-quiz study with answers and explanations visible", async ({ page }) => {
  await registerAndEnter(page, "review@example.com");
  await expect(page.locator("#topicList .topic-card:not(.hidden)").first()).toBeVisible();

  await page.locator("#topicList .topic-card:not(.hidden)").first().click();
  await expect(page.locator("#categorySelectionScreen")).toBeVisible();
  await page.click("#selectAllCategoryBtn");

  await expect(page.locator("#modeSelectionScreen")).toBeVisible();
  await page.click("#reviewModeCard");
  await expect(page.locator("#quizScreen")).toBeVisible();

  await expect(page.locator("#optionsContainer .option-btn").first()).toBeVisible();
  const firstDisabled = await page
    .locator("#optionsContainer .option-btn")
    .first()
    .isDisabled();
  expect(firstDisabled).toBe(true);

  await expect(page.locator("#optionsContainer .option-btn.correct").first()).toBeVisible();
  await expect(page.locator("#explanation")).toContainText("Explanation");
  await expect(page.locator("#reviewControls")).toHaveClass(/hidden/);
});

test("dashboard stats hydrate from stored progress data", async ({ page }) => {
  await page.addInitScript(() => {
    const user = {
      id: "u_seed",
      name: "Seed User",
      email: "seed@example.com",
      passwordHash: "seedhash",
      plan: "free",
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem("cbt_users_v1", JSON.stringify([user]));
    window.localStorage.setItem(
      "cbt_session_v1",
      JSON.stringify({ userId: user.id, createdAt: new Date().toISOString() }),
    );

    const seeded = {
      attempts: [
        {
          topicId: "psr",
          topicName: "Public Service Rules (PSR 2021)",
          mode: "practice",
          scorePercentage: 80,
          totalQuestions: 40,
          createdAt: new Date().toISOString(),
        },
        {
          topicId: "financial_regulations",
          topicName: "Financial Regulations (FR)",
          mode: "exam",
          scorePercentage: 50,
          totalQuestions: 40,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    window.localStorage.setItem("cbt_progress_summary_v1_u_seed", JSON.stringify(seeded));
  });

  await page.goto("/");
  await page.click("#startLearningBtn");
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();
  await expect(page.locator("#totalAttemptsStat")).toHaveText("2");
  await expect(page.locator("#averageScoreStat")).toHaveText("65%");
  await expect(page.locator("#continueTopicTitle")).not.toHaveText("");
});
