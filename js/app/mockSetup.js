/**
 * Build the mock-exam setup controller used by the session-setup screen.
 * It owns the small amount of orchestration needed to keep the selected template, topic metadata, and mock-specific UI in sync.
 */
export function createMockSetupController({
  defaultTemplateId,
  mockExamTopicId,
  getTemplates,
  applySessionSetupCopy,
  escapeHtml,
  formatGlBandLabel,
  getCurrentEntitlement,
  isCurrentUserAdmin,
  getFreeMockExamEligibility,
  formatDateTime,
  getCurrentTopic,
  setCurrentTopicValue,
  getPendingTemplateId,
  setPendingTemplateId,
}) {
  function buildTopicWithSelectedMockTemplate(topic, template) {
    if (!topic || !template) return topic;
    return {
      ...topic,
      selectedTemplateId: String(template.id || defaultTemplateId),
      selectedTemplateName: String(template.name || ""),
      glBand: String(template.glBand || ""),
      examTimeLimitMin: Number(template.timeLimitMin || topic.examTimeLimitMin || 0) || null,
      mockExamQuestionCount: Number(template.totalQuestions || topic.mockExamQuestionCount || 40) || 40,
    };
  }

  function buildMockSetupNoticeItems() {
    const entitlement = getCurrentEntitlement();
    const isAdmin = isCurrentUserAdmin();
    const isPremium = entitlement?.id === "premium";
    const freeStatus = isPremium || isAdmin ? null : getFreeMockExamEligibility();
    const items = [
      "Timed 40-question simulation across the core directorate topics.",
      "Choose General or a GL profile before starting the session.",
      "Results and review appear at the end of the mock.",
    ];

    if (isAdmin) {
      items.unshift("Admin access includes unlimited mock exam attempts.");
    } else if (isPremium) {
      items.unshift("Premium access includes unlimited mock exam attempts.");
    } else if (freeStatus?.allowed) {
      items.unshift("Your weekly free mock exam is available right now.");
    } else {
      const nextLabel = formatDateTime(freeStatus?.nextEligibleAt);
      items.unshift(
        nextLabel && nextLabel !== "-"
          ? `Weekly free mock exam already used. Next attempt starts ${nextLabel}.`
          : "Weekly free mock exam already used. Next attempt will be available soon.",
      );
    }

    return items;
  }

  function renderMockExamSetupPanel(topic) {
    const panel = document.getElementById("mockSetupPanel");
    const optionsContainer = document.getElementById("mockSetupTemplateOptions");
    const summary = document.getElementById("mockSetupTemplateSummary");
    const summaryTitle = document.getElementById("mockSetupTemplateSummaryTitle");
    const summaryMeta = document.getElementById("mockSetupTemplateSummaryMeta");
    const noticeList = document.getElementById("mockSetupNoticeList");
    const startMockExamBtn = document.getElementById("startMockExamBtn");
    if (!panel || !optionsContainer || !summary || !summaryTitle || !summaryMeta || !noticeList) {
      return null;
    }

    const templates = getTemplates();
    const selectedTemplateId = String(
      topic?.selectedTemplateId || getPendingTemplateId() || templates[0]?.id || defaultTemplateId,
    );
    setPendingTemplateId(selectedTemplateId);

    function syncSelectedTemplate(templateId) {
      setPendingTemplateId(String(templateId || defaultTemplateId));
      const selected = templates.find((template) => template?.id === getPendingTemplateId()) || templates[0] || null;
      if (!selected) return null;
      const nextTopic = buildTopicWithSelectedMockTemplate(getCurrentTopic() || topic, selected);
      setCurrentTopicValue(nextTopic);
      const totalQuestions = Number(selected.totalQuestions || 40) || 40;
      const timeLimitMin = Number(selected.timeLimitMin || 45) || 45;
      summaryTitle.textContent = String(selected.name || "Mock Template");
      summary.textContent = `${selected.description || "Directorate mock template."} ${totalQuestions} questions in ${timeLimitMin} minutes.`;
      summaryMeta.innerHTML = `
        <span class="chip">${totalQuestions} Questions</span>
        <span class="chip">${timeLimitMin} Minutes</span>
        <span class="chip">${escapeHtml(formatGlBandLabel(selected.glBand || "general"))}</span>
      `;
      if (startMockExamBtn) {
        startMockExamBtn.textContent = selected?.name
          ? `Start ${selected.name}`
          : "Start Directorate Mock";
      }
      return selected;
    }

    optionsContainer.innerHTML = templates
      .map((template) => {
        const templateId = escapeHtml(template.id || defaultTemplateId);
        const templateName = escapeHtml(template.name || "Mock Template");
        const templateBand = escapeHtml(formatGlBandLabel(template.glBand || "general"));
        const templateDescription = escapeHtml(template.description || "Directorate mock template.");
        const isSelected = String(template.id || defaultTemplateId) === selectedTemplateId;
        const selectedClass = isSelected ? " is-selected" : "";
        const pressed = isSelected ? "true" : "false";
        const totalQuestions = Number(template.totalQuestions || 40) || 40;
        const timeLimitMin = Number(template.timeLimitMin || 45) || 45;
        const selectionMeta = escapeHtml(
          template.selectionMode === "sections" ? "Balanced Coverage" : "GL-weighted Coverage",
        );
        return `
          <button class="mode-card mock-template-card${selectedClass}" type="button" data-template-id="${templateId}" aria-pressed="${pressed}">
            <div class="mock-template-card-body">
              <p class="mock-template-card-band">${templateBand}</p>
              <h3>${templateName}</h3>
              <p class="mock-template-card-copy">${templateDescription}</p>
            </div>
            <div class="mock-template-card-footer">
              <span class="chip">${totalQuestions} Questions</span>
              <span class="chip">${timeLimitMin} Minutes</span>
              <span class="chip">${selectionMeta}</span>
            </div>
          </button>
        `;
      })
      .join("");

    noticeList.innerHTML = buildMockSetupNoticeItems()
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");

    optionsContainer.querySelectorAll("[data-template-id]").forEach((button) => {
      button.addEventListener("click", () => {
        syncSelectedTemplate(button.dataset.templateId);
        configureSessionSetup(getCurrentTopic());
      });
    });

    return syncSelectedTemplate(selectedTemplateId);
  }

  function configureSessionSetup(topic) {
    applySessionSetupCopy(topic);

    const modeGrid = document.getElementById("sessionModeGrid");
    const practiceModeCard = document.getElementById("practiceModeCard");
    const examModeCard = document.getElementById("examModeCard");
    const reviewModeCard = document.getElementById("reviewModeCard");
    const backToCategoryBtn = document.getElementById("backToCategoryBtn");
    const startMockExamBtn = document.getElementById("startMockExamBtn");
    const mockSetupPanel = document.getElementById("mockSetupPanel");
    const setupActionRow = document.getElementById("sessionSetupActionRow");
    const isMockExam = topic?.id === mockExamTopicId;

    if (modeGrid) modeGrid.classList.toggle("hidden", isMockExam);
    if (practiceModeCard) practiceModeCard.classList.toggle("hidden", isMockExam);
    if (examModeCard) examModeCard.classList.toggle("hidden", isMockExam);
    if (reviewModeCard) reviewModeCard.classList.toggle("hidden", isMockExam);
    if (mockSetupPanel) mockSetupPanel.classList.toggle("hidden", !isMockExam);
    if (startMockExamBtn) startMockExamBtn.classList.toggle("hidden", !isMockExam);
    if (setupActionRow) setupActionRow.classList.toggle("is-mock-setup", isMockExam);
    if (backToCategoryBtn) {
      backToCategoryBtn.textContent = isMockExam ? "Back to Dashboard" : "Back to Categories";
    }

    if (isMockExam) {
      renderMockExamSetupPanel(topic);
      return;
    }

    if (startMockExamBtn) {
      startMockExamBtn.textContent = "Start Directorate Mock";
    }

    if (examModeCard) {
      const heading = examModeCard.querySelector("h3");
      const description = examModeCard.querySelector("p");
      const meta = examModeCard.querySelector(".meta");
      if (heading) heading.textContent = "Timed Topic Test";
      if (description) description.textContent = "Timed assessment with feedback and grading at the end.";
      if (meta) meta.textContent = "Time adjusts to your selected question count.";
    }
  }

  return {
    buildTopicWithSelectedMockTemplate,
    configureSessionSetup,
  };
}


