import { test, expect } from "@playwright/test";

async function registerAndEnter(page, email = "testuser@example.com") {
  await page.addInitScript(() => {
    window.PROMOTION_CBT_AUTH = {
      firebaseApiKey: "",
      firebaseProjectId: "",
      firebaseAuthDomain: "",
    };
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
  await expect(page.locator("#explanation")).toContainText("Rationale");
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
      JSON.stringify({ provider: "local", userId: user.id, createdAt: new Date().toISOString() }),
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

test("premium user can start cross-topic mock exam without category step", async ({ page }) => {
  await page.addInitScript(() => {
    const user = {
      id: "u_premium",
      name: "Premium User",
      email: "premium@example.com",
      passwordHash: "seedhash",
      plan: "premium",
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem("cbt_users_v1", JSON.stringify([user]));
    window.localStorage.setItem(
      "cbt_session_v1",
      JSON.stringify({ provider: "local", userId: user.id, createdAt: new Date().toISOString() }),
    );
  });

  await page.goto("/");
  await page.click("#startLearningBtn");
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();

  const mockCard = page.locator("#topicList .topic-card", {
    has: page.locator("h3.topic-title", { hasText: "Directorate Mock Exam" }),
  });
  await expect(mockCard).toBeVisible();
  await expect(mockCard).toContainText("Featured Mock Exam");
  await mockCard.click();

  await expect(page.locator("#modeSelectionScreen")).toBeVisible();
  await expect(page.locator("#categorySelectionScreen")).toHaveClass(/hidden/);
  await page.click("#examModeCard");
  await expect(page.locator("#quizScreen")).toBeVisible();
  await expect(page.locator("#quizTopicTitle")).toContainText("Directorate Mock Exam");
});

test("quiz supports keyboard option selection and navigation", async ({ page }) => {
  await registerAndEnter(page, "keyboard@example.com");
  await expect(page.locator("#topicList .topic-card:not(.hidden)").first()).toBeVisible();

  await page.locator("#topicList .topic-card:not(.hidden)").first().click();
  await expect(page.locator("#categorySelectionScreen")).toBeVisible();
  await page.click("#selectAllCategoryBtn");
  await expect(page.locator("#modeSelectionScreen")).toBeVisible();

  await page.click("#examModeCard");
  await expect(page.locator("#quizScreen")).toBeVisible();
  await expect(page.locator("#currentQ")).toHaveText("1");

  await page.keyboard.press("b");
  await expect(page.locator("#optionsContainer .option-btn.selected").first()).toContainText("B");

  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#optionsContainer .option-btn.selected").first()).toContainText("C");

  await page.keyboard.press("Enter");
  await expect(page.locator("#currentQ")).toHaveText("2");
});

test("in-progress quiz state restores after refresh", async ({ page }) => {
  await registerAndEnter(page, "resume@example.com");
  await expect(page.locator("#topicList .topic-card:not(.hidden)").first()).toBeVisible();

  await page.locator("#topicList .topic-card:not(.hidden)").first().click();
  await expect(page.locator("#categorySelectionScreen")).toBeVisible();
  await page.click("#selectAllCategoryBtn");
  await expect(page.locator("#modeSelectionScreen")).toBeVisible();

  await page.click("#examModeCard");
  await expect(page.locator("#quizScreen")).toBeVisible();
  await expect(page.locator("#currentQ")).toHaveText("1");

  await page.locator("#optionsContainer .option-btn").nth(2).click();
  await page.click("#nextBtn");
  await expect(page.locator("#currentQ")).toHaveText("2");
  await page.locator("#optionsContainer .option-btn").nth(0).click();

  await page.reload();
  await expect(page.locator("#quizScreen")).toBeVisible();
  await expect(page.locator("#currentQ")).toHaveText("2");
  await expect(page.locator("#optionsContainer .option-btn.selected").first()).toContainText("A");
});

test("results show source-topic breakdown for mock exam sessions", async ({ page }) => {
  await page.goto("/");

  await page.evaluate(async () => {
    const quiz = await import("/js/quiz.js");
    quiz.setCurrentTopic({
      id: "mock_exam",
      name: "Directorate Mock Exam",
      type: "mock_exam",
      mockExamQuestionCount: 2,
    });
    quiz.setCurrentMode("exam");
    await quiz.loadQuestions([
      {
        id: "mock_q1",
        question: "Question one",
        options: ["A", "B", "C", "D"],
        correct: 1,
        explanation: "Because",
        sourceTopicId: "psr",
        sourceTopicName: "Public Service Rules (PSR 2021)",
      },
      {
        id: "mock_q2",
        question: "Question two",
        options: ["A", "B", "C", "D"],
        correct: 0,
        explanation: "Because",
        sourceTopicId: "financial_regulations",
        sourceTopicName: "Financial Regulations (FR)",
      },
    ]);
  });

  await expect(page.locator("#quizScreen")).toBeVisible();
  await page.locator("#optionsContainer .option-btn").nth(1).click();
  await page.click("#nextBtn");
  await page.locator("#optionsContainer .option-btn").nth(0).click();
  await page.click("#nextBtn");

  await expect(page.locator("#resultsScreen")).toBeVisible();
  await expect(page.locator("#categoryBreakdown")).toContainText("Mock Exam Topic Breakdown");
  await expect(page.locator("#categoryBreakdown")).toContainText("Public Service Rules (PSR 2021)");
  await expect(page.locator("#categoryBreakdown")).toContainText("Financial Regulations (FR)");
});
