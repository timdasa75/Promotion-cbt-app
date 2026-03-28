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
  await expect(page.locator("#appLoadingOverlay")).toHaveClass(/is-hidden/);
  const authModal = page.locator("#authModal");
  if (!(await authModal.isVisible())) {
    await page.locator("#startLearningBtn").dispatchEvent("click");
  }
  await expect(authModal).toBeVisible();
  await page.click("#authTabRegister");
  await page.fill("#registerName", "Test User");
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


test("register screen reminds users to check Spam or Junk for verification email", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#appLoadingOverlay")).toHaveClass(/is-hidden/);
  const authModal = page.locator("#authModal");
  if (!(await authModal.isVisible())) {
    await page.locator("#startLearningBtn").dispatchEvent("click");
  }
  await expect(authModal).toBeVisible();
  await page.click("#authTabRegister");
  await expect(page.locator("#registerForm .auth-helper-text")).toContainText("Spam or Junk");
});
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
  const mockFeature = page.locator("#mockExamFeatureCard .mock-feature-panel");
  await expect(unlockedCards).toHaveCount(3);
  await expect(mockFeature).toBeVisible();
  await expect(mockFeature).toContainText("Directorate Mock Exam");
  await expect(page.locator("#mockExamFeatureCard .topic-icon")).toHaveCount(0);
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

test("user profile shows payment confirmation status after submission", async ({ page }) => {
  await registerAndEnter(page, "upgrade-status@example.com");
  await page.click("#headerProfileBtn");
  await expect(page.locator("#profileScreen")).toBeVisible();

  await page.fill("#upgradePaymentReference", "BANK-12345");
  await page.fill("#upgradeAmountPaid", "5000");
  await page.selectOption("#upgradeBillingCycle", "monthly");
  await page.click("#submitUpgradeEvidenceBtn");

  await expect(page.locator("#profileUpgradeStatus")).toContainText("Pending Admin Review");
  await expect(page.locator("#profileUpgradeStatus")).toContainText("BANK-12345");
});

test("review mode acts as pre-quiz study with answers and explanations visible", async ({ page }) => {
  await registerAndEnter(page, "review@example.com");
  await expect(page.locator("#topicList .topic-card:not(.hidden)").first()).toBeVisible();

  await page.locator("#topicList .topic-card:not(.hidden):not(.locked)").first().click();
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


test("timed topic test lets users end the exam early with warning", async ({ page }) => {
  await registerAndEnter(page, "end-exam@example.com");
  await page.locator("#topicList .topic-card:not(.hidden):not(.locked)").first().click();
  await expect(page.locator("#categorySelectionScreen")).toBeVisible();
  await page.click("#selectAllCategoryBtn");
  await expect(page.locator("#modeSelectionScreen")).toBeVisible();
  await page.click("#examModeCard");
  await expect(page.locator("#quizScreen")).toBeVisible();
  await expect(page.locator("#endExamBtn")).toBeVisible();
  await expect(page.locator("#flagBtn")).toHaveCount(0);

  let dialogMessage = "";
  page.once("dialog", async (dialog) => {
    dialogMessage = dialog.message();
    await dialog.accept();
  });
  await page.evaluate(() => document.getElementById("endExamBtn")?.click());
  await expect.poll(() => dialogMessage).toContain("End this exam now?");
  expect(dialogMessage).toContain("Only use this if you are sure");

  await expect(page.locator("#resultsScreen")).toBeVisible();
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

test("dashboard recommendation carries suggested setup into session setup", async ({ page }) => {
  await page.addInitScript(() => {
    const user = {
      id: "u_dashboard_setup",
      name: "Dashboard Setup User",
      email: "dashboard-setup@example.com",
      passwordHash: "seedhash",
      plan: "free",
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem("cbt_users_v1", JSON.stringify([user]));
    window.localStorage.setItem(
      "cbt_session_v1",
      JSON.stringify({ provider: "local", userId: user.id, createdAt: new Date().toISOString() }),
    );

    const now = Date.now();
    const seeded = {
      attempts: [
        {
          attemptId: "a_financial_followup",
          topicId: "financial_regulations",
          topicName: "Financial Regulations (FR)",
          mode: "exam",
          scorePercentage: 42,
          totalQuestions: 20,
          unansweredCount: 1,
          timeTakenSec: 870,
          createdAt: new Date(now - 10 * 60 * 1000).toISOString(),
          difficultyBreakdown: [
            {
              difficulty: "hard",
              total: 8,
              answered: 8,
              correct: 3,
              wrong: 5,
              unanswered: 0,
              accuracy: 38,
            },
          ],
          subcategoryBreakdown: [
            {
              subcategoryId: "fr_budgetary_control",
              subcategoryName: "Budgetary Control",
              total: 6,
              answered: 6,
              correct: 2,
              wrong: 4,
              unanswered: 0,
              accuracy: 33,
            },
          ],
          sourceTopicBreakdown: [],
        },
        {
          attemptId: "a_mock_setup_seed",
          topicId: "mock_exam",
          topicName: "Directorate Mock Exam",
          mode: "exam",
          scorePercentage: 54,
          totalQuestions: 40,
          unansweredCount: 3,
          timeTakenSec: 2620,
          createdAt: new Date(now).toISOString(),
          templateId: "gl_15_16",
          templateName: "GL 15-16 Mock",
          glBand: "gl_15_16",
          difficultyBreakdown: [
            {
              difficulty: "hard",
              total: 12,
              answered: 12,
              correct: 5,
              wrong: 7,
              unanswered: 0,
              accuracy: 42,
            },
          ],
          subcategoryBreakdown: [
            {
              subcategoryId: "fr_budgetary_control",
              subcategoryName: "Budgetary Control",
              total: 4,
              answered: 4,
              correct: 2,
              wrong: 2,
              unanswered: 0,
              accuracy: 50,
            },
          ],
          sourceTopicBreakdown: [
            {
              topicId: "financial_regulations",
              topicName: "Financial Regulations (FR)",
              total: 6,
              answered: 6,
              correct: 3,
              wrong: 3,
              unanswered: 0,
              accuracy: 50,
            },
          ],
        },
      ],
    };
    window.localStorage.setItem("cbt_progress_summary_v1_u_dashboard_setup", JSON.stringify(seeded));
  });

  await page.goto("/");
  await page.click("#startLearningBtn");
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();
  await expect(page.locator("#recommendedTopicChips")).toBeVisible();
  await expect(page.locator("#recommendedTopicChips")).toContainText("Reinforce Weak Areas");
  await expect(page.locator("#recommendedTopicChips")).toContainText("20 Questions");
  await expect(page.locator("#recommendedTopicChips")).toContainText("Medium");
  await expect(page.locator("#recommendedTopicChips")).toContainText("GL 15-16");
  await expect(page.locator("#recommendedTopicSetupMeta")).toContainText("Suggested setup:");
  await expect(page.locator("#recommendedTopicSetupMeta")).toContainText("finish every question cleanly");
  await expect(page.locator("#recommendedTopicSignalChips")).toContainText("Pace: 3 Unanswered");
  await expect(page.locator("#recommendedTopicConfidence")).toContainText("Confidence:");
  await expect(page.locator("#recommendedTopicConfidence")).toContainText("Building Pattern");
  await expect(page.locator("#recommendedTopicMeta")).toContainText("Latest timed run left 3 question(s) unanswered");

  await page.click("#startRecommendationBtn");
  await expect(page.locator("#categorySelectionScreen")).toBeVisible();
  await page.click("#selectAllCategoryBtn");
  await expect(page.locator("#modeSelectionScreen")).toBeVisible();
  await expect(page.locator("#setupSuggestionStrip")).toBeVisible();
  await expect(page.locator("#setupSuggestionMessage")).toContainText("Budgetary Control");
  await expect(page.locator("#setupSuggestionMessage")).toContainText("finish every question cleanly");
  await expect(page.locator("#setupSuggestionChips")).toContainText("Reinforce Weak Areas");
  await expect(page.locator("#setupSuggestionChips")).toContainText("20 Questions");
  await expect(page.locator("#setupSuggestionChips")).toContainText("Medium");
  await expect(page.locator("#setupSuggestionChips")).toContainText("GL 15-16");
  await expect(page.locator("#setupSuggestionSignalChips")).toContainText("Pace: 3 Unanswered");
  await expect(page.locator("#setupSuggestionConfidence")).toContainText("Confidence:");
  await expect(page.locator("#setupSuggestionConfidence")).toContainText("Building Pattern");
  await expect(page.locator("#studyQuestionFocusSelect")).toHaveValue("weak_areas");
  await expect(page.locator("#studyQuestionCountSelect")).toHaveValue("20");
  await expect(page.locator("#studyDifficultySelect")).toHaveValue("medium");
  await expect(page.locator("#studyTargetGlBandSelect")).toHaveValue("gl_15_16");
});



test("dashboard recommendation escalates confidence when repeated signals align", async ({ page }) => {
  await page.addInitScript(() => {
    const user = {
      id: "u_dashboard_repeated",
      name: "Dashboard Repeated User",
      email: "dashboard-repeated@example.com",
      passwordHash: "seedhash",
      plan: "premium",
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem("cbt_users_v1", JSON.stringify([user]));
    window.localStorage.setItem(
      "cbt_session_v1",
      JSON.stringify({ provider: "local", userId: user.id, createdAt: new Date().toISOString() }),
    );

    const now = Date.now();
    const seeded = {
      attempts: [
        {
          attemptId: "rep_fin_1",
          topicId: "financial_regulations",
          topicName: "Financial Regulations (FR)",
          mode: "exam",
          scorePercentage: 46,
          totalQuestions: 20,
          unansweredCount: 0,
          timeTakenSec: 890,
          createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
          subcategoryBreakdown: [
            {
              subcategoryId: "fr_budgetary_control",
              subcategoryName: "Budgetary Control",
              total: 6,
              answered: 6,
              correct: 2,
              wrong: 4,
              unanswered: 0,
              accuracy: 33,
            },
          ],
          difficultyBreakdown: [],
          sourceTopicBreakdown: [],
        },
        {
          attemptId: "rep_fin_2",
          topicId: "financial_regulations",
          topicName: "Financial Regulations (FR)",
          mode: "exam",
          scorePercentage: 41,
          totalQuestions: 20,
          unansweredCount: 1,
          timeTakenSec: 900,
          createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
          subcategoryBreakdown: [
            {
              subcategoryId: "fr_budgetary_control",
              subcategoryName: "Budgetary Control",
              total: 5,
              answered: 5,
              correct: 2,
              wrong: 3,
              unanswered: 0,
              accuracy: 40,
            },
          ],
          difficultyBreakdown: [],
          sourceTopicBreakdown: [],
        },
        {
          attemptId: "rep_fin_3",
          topicId: "financial_regulations",
          topicName: "Financial Regulations (FR)",
          mode: "exam",
          scorePercentage: 38,
          totalQuestions: 20,
          unansweredCount: 2,
          timeTakenSec: 910,
          createdAt: new Date(now - 10 * 60 * 1000).toISOString(),
          subcategoryBreakdown: [
            {
              subcategoryId: "fr_budgetary_control",
              subcategoryName: "Budgetary Control",
              total: 6,
              answered: 6,
              correct: 2,
              wrong: 4,
              unanswered: 0,
              accuracy: 33,
            },
          ],
          difficultyBreakdown: [],
          sourceTopicBreakdown: [],
        },
        {
          attemptId: "rep_fin_4",
          topicId: "financial_regulations",
          topicName: "Financial Regulations (FR)",
          mode: "exam",
          scorePercentage: 35,
          totalQuestions: 20,
          unansweredCount: 2,
          timeTakenSec: 915,
          createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
          subcategoryBreakdown: [
            {
              subcategoryId: "fr_budgetary_control",
              subcategoryName: "Budgetary Control",
              total: 6,
              answered: 6,
              correct: 1,
              wrong: 5,
              unanswered: 0,
              accuracy: 17,
            },
          ],
          difficultyBreakdown: [],
          sourceTopicBreakdown: [],
        },
        {
          attemptId: "rep_mock_1",
          topicId: "mock_exam",
          topicName: "Directorate Mock Exam",
          mode: "exam",
          scorePercentage: 49,
          totalQuestions: 40,
          unansweredCount: 3,
          timeTakenSec: 2630,
          createdAt: new Date(now).toISOString(),
          templateId: "gl_15_16",
          templateName: "GL 15-16 Mock",
          glBand: "gl_15_16",
          subcategoryBreakdown: [
            {
              subcategoryId: "fr_budgetary_control",
              subcategoryName: "Budgetary Control",
              total: 4,
              answered: 4,
              correct: 1,
              wrong: 3,
              unanswered: 0,
              accuracy: 25,
            },
          ],
          difficultyBreakdown: [],
          sourceTopicBreakdown: [
            {
              topicId: "financial_regulations",
              topicName: "Financial Regulations (FR)",
              total: 6,
              answered: 6,
              correct: 2,
              wrong: 4,
              unanswered: 0,
              accuracy: 33,
            },
          ],
        },
      ],
    };
    window.localStorage.setItem("cbt_progress_summary_v1_u_dashboard_repeated", JSON.stringify(seeded));
  });

  await page.goto("/");
  await page.click("#startLearningBtn");
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();
  await expect(page.locator("#recommendedTopicTitle")).toContainText("Financial Regulations");
  await expect(page.locator("#recommendedTopicConfidence")).toContainText("Repeated Pattern");
  await expect(page.locator("#recommendedTopicConfidence")).toContainText("moved beyond a developing signal");

  await page.click("#startRecommendationBtn");
  await expect(page.locator("#categorySelectionScreen")).toBeVisible();
  await page.click("#selectAllCategoryBtn");
  await expect(page.locator("#modeSelectionScreen")).toBeVisible();
  await expect(page.locator("#setupSuggestionStrip")).toBeVisible();
  await expect(page.locator("#setupSuggestionConfidence")).toContainText("Repeated Pattern");
  await expect(page.locator("#setupSuggestionConfidence")).toContainText("moved beyond a developing signal");
});
test("dashboard recommendation can clear tuned setup guidance without losing the topic recommendation", async ({ page }) => {
  await page.addInitScript(() => {
    const user = {
      id: "u_dashboard_clear",
      name: "Dashboard Clear User",
      email: "dashboard-clear@example.com",
      passwordHash: "seedhash",
      plan: "free",
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem("cbt_users_v1", JSON.stringify([user]));
    window.localStorage.setItem(
      "cbt_session_v1",
      JSON.stringify({ provider: "local", userId: user.id, createdAt: new Date().toISOString() }),
    );

    const now = Date.now();
    const seeded = {
      attempts: [
        {
          attemptId: "clear_financial_followup",
          topicId: "financial_regulations",
          topicName: "Financial Regulations (FR)",
          mode: "exam",
          scorePercentage: 42,
          totalQuestions: 20,
          unansweredCount: 1,
          timeTakenSec: 870,
          createdAt: new Date(now - 10 * 60 * 1000).toISOString(),
          difficultyBreakdown: [
            {
              difficulty: "hard",
              total: 8,
              answered: 8,
              correct: 3,
              wrong: 5,
              unanswered: 0,
              accuracy: 38,
            },
          ],
          subcategoryBreakdown: [
            {
              subcategoryId: "fr_budgetary_control",
              subcategoryName: "Budgetary Control",
              total: 6,
              answered: 6,
              correct: 2,
              wrong: 4,
              unanswered: 0,
              accuracy: 33,
            },
          ],
          sourceTopicBreakdown: [],
        },
        {
          attemptId: "clear_mock_setup_seed",
          topicId: "mock_exam",
          topicName: "Directorate Mock Exam",
          mode: "exam",
          scorePercentage: 54,
          totalQuestions: 40,
          unansweredCount: 3,
          timeTakenSec: 2620,
          createdAt: new Date(now).toISOString(),
          templateId: "gl_15_16",
          templateName: "GL 15-16 Mock",
          glBand: "gl_15_16",
          difficultyBreakdown: [
            {
              difficulty: "hard",
              total: 12,
              answered: 12,
              correct: 5,
              wrong: 7,
              unanswered: 0,
              accuracy: 42,
            },
          ],
          subcategoryBreakdown: [
            {
              subcategoryId: "fr_budgetary_control",
              subcategoryName: "Budgetary Control",
              total: 4,
              answered: 4,
              correct: 2,
              wrong: 2,
              unanswered: 0,
              accuracy: 50,
            },
          ],
          sourceTopicBreakdown: [
            {
              topicId: "financial_regulations",
              topicName: "Financial Regulations (FR)",
              total: 6,
              answered: 6,
              correct: 3,
              wrong: 3,
              unanswered: 0,
              accuracy: 50,
            },
          ],
        },
      ],
    };
    window.localStorage.setItem("cbt_progress_summary_v1_u_dashboard_clear", JSON.stringify(seeded));
  });

  await page.goto("/");
  await page.click("#startLearningBtn");
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();
  await expect(page.locator("#clearRecommendedSetupBtn")).toBeVisible();
  await page.click("#clearRecommendedSetupBtn");
  await expect(page.locator("#recommendedTopicTitle")).toBeVisible();
  await expect(page.locator("#recommendedTopicChips")).toBeHidden();
  await expect(page.locator("#recommendedTopicSetupMeta")).toBeHidden();
  await expect(page.locator("#recommendedTopicSignalChips")).toBeHidden();
  await expect(page.locator("#recommendedTopicConfidence")).toBeHidden();
  await expect(page.locator("#clearRecommendedSetupBtn")).toBeHidden();

  await page.click("#startRecommendationBtn");
  await expect(page.locator("#categorySelectionScreen")).toBeVisible();
  await page.click("#selectAllCategoryBtn");
  await expect(page.locator("#modeSelectionScreen")).toBeVisible();
  await expect(page.locator("#setupSuggestionStrip")).toBeHidden();
});
test("analytics screen renders live progress insights from stored attempts", async ({ page }) => {
  await page.addInitScript(() => {
    const user = {
      id: "u_analytics",
      name: "Analytics User",
      email: "analytics@example.com",
      passwordHash: "seedhash",
      plan: "premium",
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem("cbt_users_v1", JSON.stringify([user]));
    window.localStorage.setItem(
      "cbt_session_v1",
      JSON.stringify({ provider: "local", userId: user.id, createdAt: new Date().toISOString() }),
    );

    const now = Date.now();
    const seeded = {
      attempts: [
        {
          attemptId: "a_psr",
          topicId: "psr",
          topicName: "Public Service Rules & Circulars",
          mode: "practice",
          scorePercentage: 78,
          totalQuestions: 20,
          createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
          subcategoryBreakdown: [
            {
              subcategoryId: "psr_discipline",
              subcategoryName: "Discipline & Misconduct",
              total: 5,
              answered: 5,
              correct: 4,
              wrong: 1,
              unanswered: 0,
              accuracy: 80,
            },
          ],
          difficultyBreakdown: [
            {
              difficulty: "easy",
              total: 5,
              answered: 5,
              correct: 4,
              wrong: 1,
              unanswered: 0,
              accuracy: 80,
            },
          ],
          sourceTopicBreakdown: [],
        },
        {
          attemptId: "a_financial",
          topicId: "financial_regulations",
          topicName: "Financial Regulations",
          mode: "exam",
          scorePercentage: 46,
          totalQuestions: 20,
          createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
          subcategoryBreakdown: [
            {
              subcategoryId: "fr_budgetary_control",
              subcategoryName: "Budgetary Control",
              total: 6,
              answered: 5,
              correct: 2,
              wrong: 3,
              unanswered: 1,
              accuracy: 40,
            },
          ],
          difficultyBreakdown: [
            {
              difficulty: "hard",
              total: 6,
              answered: 5,
              correct: 2,
              wrong: 3,
              unanswered: 1,
              accuracy: 40,
            },
          ],
          sourceTopicBreakdown: [],
        },
        {
          attemptId: "a_mock",
          topicId: "mock_exam",
          topicName: "Directorate Mock Exam",
          mode: "exam",
          scorePercentage: 54,
          totalQuestions: 40,
          createdAt: new Date(now).toISOString(),
          templateId: "gl_16_17",
          templateName: "GL 16-17 Mock",
          glBand: "gl_16_17",
          subcategoryBreakdown: [
            {
              subcategoryId: "fr_budgetary_control",
              subcategoryName: "Budgetary Control",
              total: 4,
              answered: 4,
              correct: 2,
              wrong: 2,
              unanswered: 0,
              accuracy: 50,
            },
          ],
          difficultyBreakdown: [
            {
              difficulty: "hard",
              total: 10,
              answered: 10,
              correct: 5,
              wrong: 5,
              unanswered: 0,
              accuracy: 50,
            },
            {
              difficulty: "medium",
              total: 12,
              answered: 12,
              correct: 8,
              wrong: 4,
              unanswered: 0,
              accuracy: 67,
            },
          ],
          sourceTopicBreakdown: [
            {
              topicId: "financial_regulations",
              topicName: "Financial Regulations",
              total: 6,
              answered: 6,
              correct: 3,
              wrong: 3,
              unanswered: 0,
              accuracy: 50,
            },
            {
              topicId: "policy_analysis",
              topicName: "Policy Analysis",
              total: 5,
              answered: 5,
              correct: 3,
              wrong: 2,
              unanswered: 0,
              accuracy: 60,
            },
          ],
        },
      ],
    };
    window.localStorage.setItem("cbt_progress_summary_v1_u_analytics", JSON.stringify(seeded));
  });

  await page.goto("/");
  await page.click("#startLearningBtn");
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();
  await expect(page.locator("#continueTopicTitle")).toHaveText("GL 16-17 Mock");

  await page.click('button[data-screen-target="analyticsScreen"]');
  await expect(page.locator("#analyticsScreen")).toBeVisible();
  await expect(page.locator("#analyticsTrendList .analytic-item").first()).toContainText("GL 16-17 Mock");
  await expect(page.locator("#analyticsConsistencyList .analytic-item")).toHaveCount(7);
  await expect(page.locator("#analyticsHeatmapGrid")).toContainText("Financial Regulations");
  await expect(page.locator("#analyticsRecommendationTitle")).toContainText("Financial Regulations");
  await expect(page.locator("#analyticsRecommendationMeta")).toContainText("Budgetary Control");
  await expect(page.locator("#analyticsRecommendationMeta")).toContainText("Hard questions are averaging 47% accuracy");
  await expect(page.locator("#analyticsRecommendationMeta")).toContainText("Latest mock profile: GL 16-17");
  await expect(page.locator("#analyticsRecommendationConfidence")).toContainText("Building Pattern");
  await expect(page.locator("#analyticsRecommendationConfidence")).toContainText("still developing");
});
test("premium user can choose a directorate mock template and start without category step", async ({ page }) => {
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

  const mockCard = page.locator("#mockExamFeatureCard .mock-feature-panel", {
    has: page.locator("h3.topic-title", { hasText: "Directorate Mock Exam" }),
  });
  await expect(mockCard).toBeVisible();
  await expect(mockCard).toContainText("40 Questions | 45 Minutes");
  await page.click("#mockExamFeatureCard .mock-exam-cta");

  await expect(page.locator("#modeSelectionScreen")).toBeVisible();
  await expect(page.locator("#mockSetupPanel")).toBeVisible();
  await expect(page.locator("#mockSetupTemplateOptions .mock-template-card")).toHaveCount(4);
  await expect(page.locator("#mockSetupTemplateSummary")).toContainText("40 questions in 45 minutes");
  await expect(page.locator("#backToCategoryBtn")).toContainText("Back to Dashboard");
  await expect(page.locator("#startMockExamBtn")).toBeVisible();

  await expect(page.locator("#mockSetupTemplateOptions .mock-template-card.is-selected")).toContainText("General Mock");
  await expect(page.locator("#startMockExamBtn")).toContainText("Start General Mock");

  await page.click("#startMockExamBtn");
  await expect(page.locator("#quizScreen")).toBeVisible();
  await expect(page.locator("#quizTopicTitle")).toContainText("Directorate Mock Exam - General Mock");});


test("topic session setup filters can cap question count before quiz start", async ({ page }) => {
  await page.addInitScript(() => {
    const user = {
      id: "u_study_filters",
      name: "Study Filters User",
      email: "study-filters@example.com",
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
  await expect(page.locator("#appLoadingOverlay")).toHaveClass(/is-hidden/);
  if (!(await page.locator("#topicSelectionScreen").isVisible())) {
    await page.locator("#startLearningBtn").dispatchEvent("click");
  }
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();

  await page.locator("#topicList .topic-card", { hasText: "Public Service Rules" }).first().click();
  await expect(page.locator("#categorySelectionScreen")).toBeVisible();
  await page.click("#selectAllCategoryBtn");
  await expect(page.locator("#modeSelectionScreen")).toBeVisible();
  await expect(page.locator("#studyFilterPanel")).toBeVisible();
  await expect(page.locator("#studyTargetGlBandField")).toBeVisible();

  await page.selectOption("#studyQuestionCountSelect", "10");
  await expect(page.locator("#examModeCard .meta")).toContainText("Estimated time: 7 min 30 sec for 10 questions");
  await expect(page.locator("#studyFilterSummary")).toContainText("Current timed estimate: 7 min 30 sec for 10 questions.");
  await page.selectOption("#studyTargetGlBandSelect", "gl_15_16");
  await page.click("#examModeCard");

  await expect(page.locator("#quizScreen")).toBeVisible();
  await expect(page.locator("#totalQ")).toHaveText("10");
  await expect(page.locator("#quizSessionEstimate")).toContainText("Allowed: 7 min 30 sec");

  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  await page.click("#endExamBtn");
  await expect(page.locator("#resultsScreen")).toBeVisible();
  await expect(page.locator("#allowedTimeBlock")).toBeVisible();
  await expect(page.locator("#allowedTime")).toHaveText("7:30");
  await expect(page.locator("#timingVerdict")).toContainText("Finished with");
  await expect(page.locator("#scorePacingVerdict")).toContainText("time left");
});

test("quiz supports keyboard option selection and navigation", async ({ page }) => {
  await registerAndEnter(page, "keyboard@example.com");
  await expect(page.locator("#topicList .topic-card:not(.hidden)").first()).toBeVisible();

  await page.locator("#topicList .topic-card:not(.hidden):not(.locked)").first().click();
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

  await page.locator("#topicList .topic-card:not(.hidden):not(.locked)").first().click();
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

test("practice mode does not reveal feedback before submit after refresh restore", async ({ page }) => {
  await registerAndEnter(page, "practice-restore@example.com");
  await expect(page.locator("#topicList .topic-card:not(.hidden)").first()).toBeVisible();

  await page.locator("#topicList .topic-card:not(.hidden):not(.locked)").first().click();
  await expect(page.locator("#categorySelectionScreen")).toBeVisible();
  await page.click("#selectAllCategoryBtn");
  await expect(page.locator("#modeSelectionScreen")).toBeVisible();

  await page.click("#practiceModeCard");
  await expect(page.locator("#quizScreen")).toBeVisible();
  await expect(page.locator("#currentQ")).toHaveText("1");

  await page.locator("#optionsContainer .option-btn").nth(1).click();
  await expect(page.locator("#submitBtn")).toBeVisible();

  await page.reload();
  await expect(page.locator("#quizScreen")).toBeVisible();
  await expect(page.locator("#currentQ")).toHaveText("1");
  await expect(page.locator("#optionsContainer .option-btn.selected").first()).toContainText("B");
  await expect(page.locator("#optionsContainer .option-btn.correct")).toHaveCount(0);
  await expect(page.locator("#optionsContainer .option-btn.incorrect")).toHaveCount(0);
  await expect(page.locator("#optionsContainer .option-feedback-label")).toHaveCount(0);
  await expect(page.locator("#submitBtn")).toBeVisible();
});

test("results show source-topic breakdown for mock exam sessions", async ({ page }) => {
  await page.addInitScript(() => {
    const user = {
      id: "u_mock_results",
      name: "Mock Results User",
      email: "mock-results@example.com",
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
  await expect(page.locator("#appLoadingOverlay")).toHaveClass(/is-hidden/);

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
        sourceSubcategoryId: "psr_appointments",
        sourceSubcategoryName: "Appointments and Confirmation",
      },
      {
        id: "mock_q2",
        question: "Question two",
        options: ["A", "B", "C", "D"],
        correct: 0,
        explanation: "Because",
        sourceTopicId: "financial_regulations",
        sourceTopicName: "Financial Regulations (FR)",
        sourceSubcategoryId: "fr_budgetary_control",
        sourceSubcategoryName: "Budgetary Control",
      },
    ]);
  });

  await expect(page.locator("#quizScreen")).toBeVisible();
  await page.locator("#optionsContainer .option-btn").nth(1).click();
  await page.click("#nextBtn");
  await page.locator("#optionsContainer .option-btn").nth(2).click();
  await page.click("#nextBtn");

  await expect(page.locator("#resultsScreen")).toBeVisible();
  await expect(page.locator("#categoryBreakdown")).toContainText("Mock Exam Topic Breakdown");
  await expect(page.locator("#categoryBreakdown")).toContainText("Public Service Rules (PSR 2021)");
  await expect(page.locator("#categoryBreakdown")).toContainText("Financial Regulations (FR)");
  await expect(page.locator("#categoryBreakdown")).toContainText("Weakest Session Subcategory");
  await expect(page.locator("#categoryBreakdown")).toContainText("Budgetary Control");
await expect(page.locator("#categoryBreakdown")).toContainText("Best Next Step");
  await expect(page.locator("#categoryBreakdown")).toContainText("Confidence:");
  await expect(page.locator("#categoryBreakdown")).toContainText("Early Pattern");
  await expect(page.locator("#retryPathResultsBtn")).toBeVisible();
  await expect(page.locator("#retryPathResultsBtn")).toContainText("Retry Missed (");
});

test("topic results can return to tuned session setup with weak-area emphasis", async ({ page }) => {
  await page.addInitScript(() => {
    const user = {
      id: "u_setup_tune",
      name: "Setup Tune User",
      email: "setup-tune@example.com",
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
  await expect(page.locator("#appLoadingOverlay")).toHaveClass(/is-hidden/);

  await page.evaluate(async () => {
    const quiz = await import("/js/quiz.js");
    quiz.setCurrentTopic({
      id: "policy_analysis",
      name: "Policy Analysis",
      file: "data/policy_analysis.json",
      studyFilters: {
        questionCount: 2,
        questionFocus: "balanced",
        targetGlBand: "general",
      },
      availableStudyFilters: {
        totalQuestions: 2,
        defaultQuestionCount: 2,
        questionCountOptions: [],
        difficulties: ["medium", "hard"],
        sourceDocuments: [],
        questionFocusOptions: ["balanced", "weak_areas"],
        targetGlBandOptions: ["general", "gl_15_16", "gl_16_17"],
        defaults: {
          difficulty: "all",
          sourceDocument: "all",
          questionCount: 2,
          questionFocus: "balanced",
          targetGlBand: "general",
        },
      },
    });
    quiz.setCurrentMode("exam");
    await quiz.loadQuestions([
      {
        id: "setup_tune_q1",
        question: "A director is balancing procurement reform and policy implementation risk. What should happen next?",
        options: ["A", "B", "C", "D"],
        correct: 1,
        explanation: "Because",
        difficulty: "hard",
        questionType: "scenario",
        glBands: ["gl_15_16"],
        sourceTopicId: "policy_analysis",
        sourceTopicName: "Policy Analysis",
        sourceSubcategoryId: "pol_implementation_evaluation",
        sourceSubcategoryName: "Implementation & Evaluation",
      },
      {
        id: "setup_tune_q2",
        question: "Which stage comes before evaluation in the policy cycle?",
        options: ["Agenda", "Implementation", "Sanction", "Closure"],
        correct: 1,
        explanation: "Because",
        difficulty: "medium",
        questionType: "single_best_answer",
        glBands: ["gl_14_15", "gl_15_16"],
        sourceTopicId: "policy_analysis",
        sourceTopicName: "Policy Analysis",
        sourceSubcategoryId: "pol_formulation_cycle",
        sourceSubcategoryName: "Policy Formulation Cycle",
      },
    ]);
  });

  await expect(page.locator("#quizScreen")).toBeVisible();
  await page.locator("#optionsContainer .option-btn").first().click();
  await page.click("#nextBtn");
  await page.locator("#optionsContainer .option-btn").nth(1).click();
  await page.click("#nextBtn");

  await expect(page.locator("#resultsScreen")).toBeVisible();
await expect(page.locator("#categoryBreakdown")).toContainText("Best Next Step");
  await expect(page.locator("#categoryBreakdown")).toContainText("Confidence:");
  await expect(page.locator("#categoryBreakdown")).toContainText("Early Pattern");
  await expect(page.locator("#retryPathResultsBtn")).toContainText("Use Suggested Setup");

  await page.click("#retryPathResultsBtn");
  await expect(page.locator("#modeSelectionScreen")).toBeVisible();
  await expect(page.locator("#setupSuggestionStrip")).toBeVisible();
  await expect(page.locator("#setupSuggestionTitle")).toContainText("Tune the Next Session");
  await expect(page.locator("#setupSuggestionChips")).toContainText("Reinforce Weak Areas");
  await expect(page.locator("#setupSuggestionChips")).toContainText("GL 15-16");
  await expect(page.locator("#studyQuestionFocusSelect")).toHaveValue("weak_areas");
  await expect(page.locator("#studyTargetGlBandSelect")).toHaveValue("gl_15_16");
});

test("topic results can clear tuned setup guidance and still open session setup", async ({ page }) => {
  await page.addInitScript(() => {
    const user = {
      id: "u_setup_tune_clear",
      name: "Setup Tune Clear User",
      email: "setup-tune-clear@example.com",
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
  await expect(page.locator("#appLoadingOverlay")).toHaveClass(/is-hidden/);

  await page.evaluate(async () => {
    const quiz = await import("/js/quiz.js");
    quiz.setCurrentTopic({
      id: "policy_analysis",
      name: "Policy Analysis",
      file: "data/policy_analysis.json",
      studyFilters: {
        questionCount: 2,
        questionFocus: "balanced",
        targetGlBand: "general",
      },
      availableStudyFilters: {
        totalQuestions: 2,
        defaultQuestionCount: 2,
        questionCountOptions: [],
        difficulties: ["medium", "hard"],
        sourceDocuments: [],
        questionFocusOptions: ["balanced", "weak_areas"],
        targetGlBandOptions: ["general", "gl_15_16", "gl_16_17"],
        defaults: {
          difficulty: "all",
          sourceDocument: "all",
          questionCount: 2,
          questionFocus: "balanced",
          targetGlBand: "general",
        },
      },
    });
    quiz.setCurrentMode("exam");
    await quiz.loadQuestions([
      {
        id: "setup_tune_clear_q1",
        question: "A director is balancing procurement reform and policy implementation risk. What should happen next?",
        options: ["A", "B", "C", "D"],
        correct: 1,
        explanation: "Because",
        difficulty: "hard",
        questionType: "scenario",
        glBands: ["gl_15_16"],
        sourceTopicId: "policy_analysis",
        sourceTopicName: "Policy Analysis",
        sourceSubcategoryId: "pol_implementation_evaluation",
        sourceSubcategoryName: "Implementation & Evaluation",
      },
      {
        id: "setup_tune_clear_q2",
        question: "Which stage comes before evaluation in the policy cycle?",
        options: ["Agenda", "Implementation", "Sanction", "Closure"],
        correct: 1,
        explanation: "Because",
        difficulty: "medium",
        questionType: "single_best_answer",
        glBands: ["gl_14_15", "gl_15_16"],
        sourceTopicId: "policy_analysis",
        sourceTopicName: "Policy Analysis",
        sourceSubcategoryId: "pol_formulation_cycle",
        sourceSubcategoryName: "Policy Formulation Cycle",
      },
    ]);
  });

  await expect(page.locator("#quizScreen")).toBeVisible();
  await page.locator("#optionsContainer .option-btn").first().click();
  await page.click("#nextBtn");
  await page.locator("#optionsContainer .option-btn").nth(1).click();
  await page.click("#nextBtn");

  await expect(page.locator("#resultsScreen")).toBeVisible();
  await expect(page.locator("#clearResultsSetupSuggestionBtn")).toBeVisible();
  await page.click("#clearResultsSetupSuggestionBtn");
  await expect(page.locator("#resultsFollowUpSummaryChips")).toBeHidden();
  await expect(page.locator("#resultsFollowUpSignalChips")).toBeHidden();
  await expect(page.locator("#resultsFollowUpConfidence")).toBeHidden();
  await expect(page.locator("#retryPathResultsBtn")).toContainText("Open Session Setup");

  await page.click("#retryPathResultsBtn");
  await expect(page.locator("#modeSelectionScreen")).toBeVisible();
  await expect(page.locator("#setupSuggestionStrip")).toBeHidden();
  await expect(page.locator("#studyQuestionFocusSelect")).toHaveValue("balanced");
  await expect(page.locator("#studyTargetGlBandSelect")).toHaveValue("general");
});

test("retry-missed queue is created from results and can start a focused retry session", async ({ page }) => {
  await page.addInitScript(() => {
    const user = {
      id: "u_retry",
      name: "Retry User",
      email: "retry@example.com",
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

  await page.evaluate(async () => {
    const quiz = await import("/js/quiz.js");
    quiz.setCurrentTopic({
      id: "psr",
      name: "Public Service Rules (PSR 2021)",
      file: "data/psr_rules.json",
    });
    quiz.setCurrentMode("exam");
    await quiz.loadQuestions([
      {
        id: "retry_q1",
        question: "Retry queue test question 1",
        options: ["A", "B", "C", "D"],
        correct: 1,
        explanation: "Because",
      },
      {
        id: "retry_q2",
        question: "Retry queue test question 2",
        options: ["A", "B", "C", "D"],
        correct: 0,
        explanation: "Because",
      },
    ]);
  });

  await expect(page.locator("#quizScreen")).toBeVisible();
  await page.locator("#optionsContainer .option-btn").nth(0).click(); // wrong for q1
  await page.click("#nextBtn");
  await page.locator("#optionsContainer .option-btn").nth(0).click(); // correct for q2
  await page.click("#nextBtn");
  await expect(page.locator("#resultsScreen")).toBeVisible();

  await page.click("#resultsScreen button[data-screen-target='topicSelectionScreen']");
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();

  const retryBtn = page.locator("#retryMissedBtn");
  await expect(retryBtn).toBeEnabled();
  await expect(retryBtn).toContainText("Retry Missed (1)");

  await retryBtn.click();
  await expect(page.locator("#quizScreen")).toBeVisible();
  await expect(page.locator("#quizTopicTitle")).toContainText("Retry Missed Questions");
  await expect(page.locator("#totalQ")).toHaveText("1");
});

test("review mistakes filters and mark-understood flow keep the retry queue in sync", async ({ page }) => {
  await page.addInitScript(() => {
    const now = new Date().toISOString();
    const user = {
      id: "u_review_bank",
      name: "Review Bank User",
      email: "review-bank@example.com",
      passwordHash: "seedhash",
      plan: "premium",
      createdAt: now,
    };
    const queue = [
      {
        id: "retry_psr_hard",
        updatedAt: now,
        sourceTopicId: "psr",
        sourceTopicName: "Public Service Rules (PSR 2021)",
        lastUserAnswerIndex: 0,
        lastOutcome: "incorrect",
        question: {
          id: "review_q1",
          question: "Who authorizes acting appointments under the Public Service Rules?",
          options: ["The line manager", "The Head of Service", "The accounting officer", "The Federal Civil Service Commission"],
          correct: 3,
          explanation: "The Federal Civil Service Commission authorizes appointments in line with the rule set.",
          difficulty: "hard",
          sourceTopicId: "psr",
          sourceTopicName: "Public Service Rules (PSR 2021)",
          sourceSubcategoryName: "Appointments",
          sourceDocument: "PSR 2021",
          sourceSection: "020201",
        },
      },
      {
        id: "retry_psr_medium",
        updatedAt: now,
        sourceTopicId: "psr",
        sourceTopicName: "Public Service Rules (PSR 2021)",
        lastUserAnswerIndex: 2,
        lastOutcome: "incorrect",
        question: {
          id: "review_q2",
          question: "Which record should capture annual leave history for an officer?",
          options: ["Duty roster", "Personal file", "Circular register", "Nominal roll only"],
          correct: 1,
          explanation: "The personal file retains the officer's leave history and supporting documentation.",
          difficulty: "medium",
          sourceTopicId: "psr",
          sourceTopicName: "Public Service Rules (PSR 2021)",
          sourceSubcategoryName: "Leave Records",
          sourceDocument: "PSR 2021",
          sourceSection: "100301",
        },
      },
      {
        id: "retry_finance_hard",
        updatedAt: now,
        sourceTopicId: "financial_regulations",
        sourceTopicName: "Financial Regulations",
        lastUserAnswerIndex: 1,
        lastOutcome: "incorrect",
        question: {
          id: "review_q3",
          question: "Who is the accounting officer in a federal ministry?",
          options: ["Director of finance", "Permanent secretary", "Internal auditor", "Head of procurement"],
          correct: 1,
          explanation: "The permanent secretary serves as accounting officer for the ministry.",
          difficulty: "hard",
          sourceTopicId: "financial_regulations",
          sourceTopicName: "Financial Regulations",
          sourceSubcategoryName: "Accounting Officer",
          sourceDocument: "Financial Regulations",
          sourceSection: "1101",
        },
      },
    ];
    window.localStorage.setItem("cbt_users_v1", JSON.stringify([user]));
    window.localStorage.setItem(
      "cbt_session_v1",
      JSON.stringify({ provider: "local", userId: user.id, createdAt: now }),
    );
    window.localStorage.setItem(`cbt_retry_missed_v1_${user.id}`, JSON.stringify(queue));
  });

  await page.goto("/");
  await expect(page.locator("#appLoadingOverlay")).toHaveClass(/is-hidden/);
  await page.click("#startLearningBtn");
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();

  await page.locator("button[data-screen-target='reviewMistakesScreen']").first().click();
  await expect(page.locator("#reviewMistakesScreen")).toBeVisible();

  const reviewCards = page.locator("#reviewMistakesList .review-mistake-card");
  await expect(reviewCards).toHaveCount(3);
  await expect(page.locator("#reviewMistakesSummaryChips")).toContainText("3 queued");
  await expect(page.locator("#reviewMistakesStartBtn")).toContainText("Start Retry Session (3)");

  await page.selectOption("#reviewMistakesTopicFilter", "psr");
  await expect(reviewCards).toHaveCount(2);
  await expect(page.locator("#reviewMistakesClearFiltersBtn")).toBeVisible();

  await page.selectOption("#reviewMistakesDifficultyFilter", "hard");
  await expect(reviewCards).toHaveCount(1);
  await expect(reviewCards.first()).toContainText("Appointments");

  await reviewCards.first().locator("button[data-review-action='dismiss']").click();
  await expect(page.locator("#reviewMistakesList")).toContainText("No questions match these filters.");
  await expect(page.locator("#reviewMistakesStartBtn")).toContainText("Start Retry Session (2)");

  await page.click("#reviewMistakesClearFiltersBtn");
  await expect(reviewCards).toHaveCount(2);
  await expect(page.locator("#reviewMistakesSummaryChips")).toContainText("2 queued");
});

test("spaced-practice queue shows due count and starts a focused spaced session", async ({ page }) => {
  await page.addInitScript(() => {
    const user = {
      id: "u_spaced",
      name: "Spaced User",
      email: "spaced@example.com",
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

  await page.evaluate(async () => {
    const { getTopics } = await import("/js/data.js");
    const { fetchTopicDataFiles, extractQuestionsByCategory } = await import("/js/topicSources.js");

    const topics = Array.isArray(getTopics()) ? getTopics() : [];
    const sourceTopic = topics.find((topic) => String(topic?.id || "").trim() !== "mock_exam" && topic?.file);
    if (!sourceTopic) throw new Error("Unable to seed spaced-practice queue: no source topic found.");

    const topicDataFiles = await fetchTopicDataFiles(sourceTopic, { tolerateFailures: true });
    let selectedQuestion = null;
    for (const topicData of topicDataFiles) {
      const questions = extractQuestionsByCategory(topicData, "all", {});
      if (Array.isArray(questions) && questions.length) {
        selectedQuestion = questions.find((question) => question && (question.id || question.question)) || null;
      }
      if (selectedQuestion) break;
    }
    if (!selectedQuestion) {
      throw new Error("Unable to seed spaced-practice queue: no questions found.");
    }

    const byId = String(selectedQuestion?.id || "").trim();
    const fingerprint = byId
      ? `id:${byId}`
      : `text:${String(selectedQuestion?.question || "")
          .toLowerCase()
          .replace(/[^a-z0-9\\s]/g, " ")
          .replace(/\\s+/g, " ")
          .trim()}`;
    if (!fingerprint) throw new Error("Unable to seed spaced-practice queue: missing fingerprint.");

    const queueEntry = {
      id: `${sourceTopic.id}|${fingerprint}`,
      sourceTopicId: String(sourceTopic.id || ""),
      sourceTopicName: String(sourceTopic.name || ""),
      questionId: byId,
      fingerprint,
      dueAt: new Date(Date.now() - 60 * 1000).toISOString(),
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0,
      reviewCount: 0,
      lapses: 1,
      lastResult: "incorrect",
      lastReviewedAt: "",
    };

    window.localStorage.setItem("cbt_spaced_practice_v1_u_spaced", JSON.stringify([queueEntry]));
  });

  await page.reload();
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();

  const spacedBtn = page.locator("#spacedPracticeBtn");
  await expect(spacedBtn).toBeEnabled();
  await expect(spacedBtn).toContainText("Spaced Practice (1)");

  await spacedBtn.click();
  await expect(page.locator("#quizScreen")).toBeVisible();
  await expect(page.locator("#quizTopicTitle")).toContainText("Spaced Practice");
  await expect(page.locator("#totalQ")).toHaveText("1");
});

test("admin panel uses Worker admin bridge for live directory and account-state sync", async ({ page }) => {
  let listCalls = 0;
  let setStatusCalls = 0;
  let lastSetStatusPayload = null;
  const corsHeaders = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type",
  };

  await page.route("**/mock-admin-api/adminListUsers*", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: corsHeaders,
        body: "",
      });
      return;
    }
    listCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify({
        ok: true,
        total: 1,
        users: [
          {
            id: "u_target",
            email: "learner@example.com",
            name: "Learner",
            emailVerified: false,
            disabled: false,
            createdAt: new Date().toISOString(),
            lastSignInAt: "",
          },
        ],
      }),
    });
  });

  await page.route("**/mock-admin-api/adminListOperations*", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: corsHeaders,
        body: "",
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify({ ok: true, entries: [] }),
    });
  });

  await page.route("**/mock-admin-api/adminSetUserStatus*", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: corsHeaders,
        body: "",
      });
      return;
    }
    setStatusCalls += 1;
    lastSetStatusPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify({
        ok: true,
        userId: "u_target",
        status: "suspended",
        authDisabledSynced: true,
        warning: "",
      }),
    });
  });

  await page.route("https://firestore.googleapis.com/**", async (route) => {
    await route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ error: { message: "Mocked Firestore unavailable" } }),
    });
  });

  await page.addInitScript(() => {
    window.PROMOTION_CBT_AUTH = {
      firebaseApiKey: "mock-api-key",
      firebaseProjectId: "mock-project-id",
      firebaseAuthDomain: "mock-project-id.firebaseapp.com",
      adminApiBaseUrl: "/mock-admin-api",
    };

    const nowIso = new Date().toISOString();
    window.sessionStorage.setItem(
      "cbt_session_v1",
      JSON.stringify({
        provider: "firebase",
        accessToken: "mock-id-token",
        refreshToken: "mock-refresh-token",
        expiresAt: Date.now() + 60 * 60 * 1000,
        user: {
          id: "u_admin",
          name: "Admin User",
          email: "timdasa75@gmail.com",
          plan: "premium",
          createdAt: nowIso,
          emailVerified: true,
        },
        createdAt: nowIso,
      }),
    );
  });

  page.on("dialog", (dialog) => dialog.accept());

  await page.goto("/");
  await page.click("#startLearningBtn");
  await expect(page.locator("#topicSelectionScreen")).toBeVisible();

  const openAdminBtn = page.locator("#openAdminBtn");
  await expect(openAdminBtn).toBeVisible();
  await openAdminBtn.click();

  await expect(page.locator("#adminScreen")).toBeVisible();
  await expect(page.locator("#adminUserSource")).toContainText("Firebase Auth (live)");
  await expect(page.locator("#adminUserCount")).toContainText("1/1");
  await expect.poll(() => listCalls).toBeGreaterThan(0);

  await expect(page.locator("#adminUserList .admin-user-summary").first()).toBeVisible();
  await page.locator("#adminUserList .admin-user-summary").first().click();
  await expect(page.locator("#adminUserList .directory-action-menu summary").first()).toBeVisible();
  await page.locator("#adminUserList .directory-action-menu summary").first().click();
  await page.locator("button[data-action='set-account-state']").first().click();

  await expect.poll(() => setStatusCalls).toBe(1);
  expect(lastSetStatusPayload?.userId).toBe("u_target");
  expect(lastSetStatusPayload?.status).toBe("suspended");
});































