import { test, expect } from "@playwright/test";

test("dashboard filters and action buttons are interactive", async ({ page }) => {
  await page.goto("/");
  await page.click("#startLearningBtn");
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();
  await expect(page.locator("#topicList .topic-card:not(.hidden)").first()).toBeVisible();

  const allCards = page.locator("#topicList .topic-card:not(.hidden)");
  const totalCards = await allCards.count();
  expect(totalCards).toBeGreaterThan(0);

  await page.click("#filterRecentBtn");
  const visibleRecent = await page.locator("#topicList .topic-card:not(.hidden)").count();
  expect(visibleRecent).toBeGreaterThan(0);

  await page.click("#filterDocumentBtn");
  const visibleDocument = await page.locator("#topicList .topic-card:not(.hidden)").count();
  expect(visibleDocument).toBeGreaterThan(0);

  await page.click("#startRecommendationBtn");
  await expect(page.locator("#categorySelectionScreen")).toBeVisible();
});

test("review mode acts as pre-quiz study with answers and explanations visible", async ({ page }) => {
  await page.goto("/");
  await page.click("#startLearningBtn");
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();
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
    window.localStorage.setItem("cbt_progress_summary_v1", JSON.stringify(seeded));
  });

  await page.goto("/");
  await page.click("#startLearningBtn");
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();
  await expect(page.locator("#totalAttemptsStat")).toHaveText("2");
  await expect(page.locator("#averageScoreStat")).toHaveText("65%");
  await expect(page.locator("#continueTopicTitle")).toContainText("Financial Regulations");
});
