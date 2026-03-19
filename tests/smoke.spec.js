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
    await page.click("#startLearningBtn");
  }
  await expect(authModal).toBeVisible();
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

test("user profile shows payment confirmation status after submission", async ({ page }) => {
  await registerAndEnter(page, "upgrade-status@example.com");
  await page.click("#headerProfileBtn");
  await expect(page.locator("#profileScreen")).toBeVisible();

  await page.fill("#upgradePaymentReference", "BANK-12345");
  await page.fill("#upgradeAmountPaid", "5000");
  await page.click("#submitUpgradeEvidenceBtn");

  await expect(page.locator("#profileUpgradeStatus")).toContainText("Pending Admin Review");
  await expect(page.locator("#profileUpgradeStatus")).toContainText("BANK-12345");
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

test("practice mode does not reveal feedback before submit after refresh restore", async ({ page }) => {
  await registerAndEnter(page, "practice-restore@example.com");
  await expect(page.locator("#topicList .topic-card:not(.hidden)").first()).toBeVisible();

  await page.locator("#topicList .topic-card:not(.hidden)").first().click();
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

  await page.locator(".directory-action-menu summary").first().click();
  await page.locator("button[data-action='set-account-state']").first().click();

  await expect.poll(() => setStatusCalls).toBe(1);
  expect(lastSetStatusPayload?.userId).toBe("u_target");
  expect(lastSetStatusPayload?.status).toBe("suspended");
});
