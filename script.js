const QUIZ_DURATION_SECONDS = 45 * 60;
const STORAGE_KEYS = {
  theme: "eti-ut2-theme",
  history: "eti-ut2-history",
  lastResult: "eti-ut2-last-result",
  wrongIds: "eti-ut2-wrong-ids"
};

const state = {
  quizQuestions: [...questions],
  quizAnswers: {},
  quizIndex: 0,
  timerId: null,
  timeLeft: QUIZ_DURATION_SECONDS,
  practiceTopic: "",
  practiceQuestions: [],
  practiceIndex: 0,
  practiceAnswered: false,
  retryMode: false
};

const screenIds = ["homeScreen", "quizScreen", "practiceScreen", "resultScreen"];

const elements = {
  body: document.body,
  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.getElementById("themeIcon"),
  themeLabel: document.getElementById("themeLabel"),
  homeQuestionCount: document.getElementById("homeQuestionCount"),
  homeTopicCount: document.getElementById("homeTopicCount"),
  latestScoreSummary: document.getElementById("latestScoreSummary"),
  startQuizBtn: document.getElementById("startQuizBtn"),
  practiceModeBtn: document.getElementById("practiceModeBtn"),
  viewScoreBtn: document.getElementById("viewScoreBtn"),
  homeFromQuizBtn: document.getElementById("homeFromQuizBtn"),
  backHomeFromPracticeBtn: document.getElementById("backHomeFromPracticeBtn"),
  backHomeFromResultBtn: document.getElementById("backHomeFromResultBtn"),
  submitQuizBtn: document.getElementById("submitQuizBtn"),
  nextQuestionBtn: document.getElementById("nextQuestionBtn"),
  prevQuestionBtn: document.getElementById("prevQuestionBtn"),
  quizProgressText: document.getElementById("quizProgressText"),
  quizAnsweredCount: document.getElementById("quizAnsweredCount"),
  timerDisplay: document.getElementById("timerDisplay"),
  quizProgressBar: document.getElementById("quizProgressBar"),
  quizQuestionCard: document.getElementById("quizQuestionCard"),
  quizTopicBadge: document.getElementById("quizTopicBadge"),
  quizQuestionText: document.getElementById("quizQuestionText"),
  quizOptions: document.getElementById("quizOptions"),
  quizPalette: document.getElementById("quizPalette"),
  topicButtons: document.getElementById("topicButtons"),
  practiceTopicSummary: document.getElementById("practiceTopicSummary"),
  practiceTopicBadge: document.getElementById("practiceTopicBadge"),
  practiceCounter: document.getElementById("practiceCounter"),
  practiceQuestionText: document.getElementById("practiceQuestionText"),
  practiceOptions: document.getElementById("practiceOptions"),
  practiceFeedback: document.getElementById("practiceFeedback"),
  prevPracticeBtn: document.getElementById("prevPracticeBtn"),
  nextPracticeBtn: document.getElementById("nextPracticeBtn"),
  scoreValue: document.getElementById("scoreValue"),
  scoreCaption: document.getElementById("scoreCaption"),
  accuracyValue: document.getElementById("accuracyValue"),
  bestScoreValue: document.getElementById("bestScoreValue"),
  weakTopicLabel: document.getElementById("weakTopicLabel"),
  topicAnalysis: document.getElementById("topicAnalysis"),
  historyList: document.getElementById("historyList"),
  retryWrongBtn: document.getElementById("retryWrongBtn")
};

function showScreen(screenId) {
  screenIds.forEach((id) => {
    document.getElementById(id).classList.toggle("active", id === screenId);
  });
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getTopics() {
  return [...new Set(questions.map((item) => item.topic))];
}

function setTheme(theme) {
  elements.body.dataset.theme = theme;
  elements.themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  elements.themeLabel.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function loadTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme) || "light";
  setTheme(saved);
}

function buildTopicButtons() {
  elements.topicButtons.innerHTML = "";

  getTopics().forEach((topic) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "topic-button";
    button.textContent = topic;
    button.addEventListener("click", () => selectPracticeTopic(topic));
    elements.topicButtons.appendChild(button);
  });
}

function renderQuizPalette() {
  elements.quizPalette.innerHTML = "";

  state.quizQuestions.forEach((question, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "palette-button";
    button.textContent = index + 1;

    if (index === state.quizIndex) {
      button.classList.add("current");
    } else if (state.quizAnswers[question.id]) {
      button.classList.add("answered");
    }

    button.addEventListener("click", () => {
      state.quizIndex = index;
      renderQuizQuestion();
    });

    elements.quizPalette.appendChild(button);
  });
}

function renderQuizQuestion() {
  const current = state.quizQuestions[state.quizIndex];
  const selectedAnswer = state.quizAnswers[current.id];
  const answeredCount = Object.keys(state.quizAnswers).length;
  const progress = ((state.quizIndex + 1) / state.quizQuestions.length) * 100;

  elements.quizQuestionCard.style.animation = "none";
  requestAnimationFrame(() => {
    elements.quizQuestionCard.style.animation = "";
  });

  elements.quizProgressText.textContent = `${state.quizIndex + 1} / ${state.quizQuestions.length}`;
  elements.quizAnsweredCount.textContent = `${answeredCount} answered`;
  elements.quizProgressBar.style.width = `${progress}%`;
  elements.quizTopicBadge.textContent = current.topic;
  elements.quizQuestionText.textContent = current.question;
  elements.quizOptions.innerHTML = "";

  current.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    let className = "option-button";

    if (selectedAnswer === option) {
      className += " selected";
    }

    if (selectedAnswer) {
      if (option === current.answer) {
        className += " correct";
      } else if (selectedAnswer === option && selectedAnswer !== current.answer) {
        className += " wrong";
      }
    }

    button.className = className;
    button.textContent = option;
    button.disabled = Boolean(selectedAnswer);
    button.addEventListener("click", () => {
      state.quizAnswers[current.id] = option;
      renderQuizQuestion();
    });
    elements.quizOptions.appendChild(button);
  });

  elements.prevQuestionBtn.disabled = state.quizIndex === 0;
  elements.nextQuestionBtn.textContent = state.quizIndex === state.quizQuestions.length - 1 ? "Review End" : "Next";
  renderQuizPalette();
}

function startTimer() {
  stopTimer();
  elements.timerDisplay.textContent = formatTime(state.timeLeft);

  state.timerId = window.setInterval(() => {
    state.timeLeft -= 1;
    elements.timerDisplay.textContent = formatTime(state.timeLeft);

    if (state.timeLeft <= 0) {
      stopTimer();
      submitQuiz();
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function startQuiz(questionSet = questions, options = {}) {
  state.retryMode = Boolean(options.retryMode);
  state.quizQuestions = [...questionSet];
  state.quizAnswers = {};
  state.quizIndex = 0;
  state.timeLeft = options.retryMode ? Math.max(10 * 60, questionSet.length * 45) : QUIZ_DURATION_SECONDS;

  showScreen("quizScreen");
  startTimer();
  renderQuizQuestion();
}

function computeTopicStats(questionSet, answers) {
  const stats = {};

  questionSet.forEach((question) => {
    if (!stats[question.topic]) {
      stats[question.topic] = { total: 0, correct: 0 };
    }

    stats[question.topic].total += 1;
    if (answers[question.id] === question.answer) {
      stats[question.topic].correct += 1;
    }
  });

  return stats;
}

function saveResult(result) {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || "[]");
  history.unshift(result);
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history.slice(0, 10)));
  localStorage.setItem(STORAGE_KEYS.lastResult, JSON.stringify(result));
  localStorage.setItem(STORAGE_KEYS.wrongIds, JSON.stringify(result.wrongQuestionIds));
}

function submitQuiz() {
  stopTimer();

  const total = state.quizQuestions.length;
  const correctAnswers = state.quizQuestions.filter(
    (question) => state.quizAnswers[question.id] === question.answer
  );
  const score = correctAnswers.length;
  const wrongQuestionIds = state.quizQuestions
    .filter((question) => state.quizAnswers[question.id] !== question.answer)
    .map((question) => question.id);
  const topicStats = computeTopicStats(state.quizQuestions, state.quizAnswers);
  const weakTopics = Object.entries(topicStats)
    .map(([topic, values]) => ({
      topic,
      accuracy: values.total ? Math.round((values.correct / values.total) * 100) : 0,
      ...values
    }))
    .sort((left, right) => left.accuracy - right.accuracy);

  const result = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    score,
    total,
    accuracy: Math.round((score / total) * 100),
    answered: Object.keys(state.quizAnswers).length,
    weakTopics,
    topicStats,
    wrongQuestionIds,
    retryMode: state.retryMode
  };

  saveResult(result);
  renderDashboard(result);
  updateHomeSummary();
  showScreen("resultScreen");
}

function renderDashboard(latestResult = null) {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || "[]");
  const result = latestResult || JSON.parse(localStorage.getItem(STORAGE_KEYS.lastResult) || "null");
  const bestScore = history.reduce((highest, item) => Math.max(highest, item.score || 0), 0);

  if (!result) {
    elements.scoreValue.textContent = `0/${questions.length}`;
    elements.scoreCaption.textContent = "No quiz submitted yet.";
    elements.accuracyValue.textContent = "0%";
    elements.bestScoreValue.textContent = `0/${questions.length}`;
    elements.weakTopicLabel.textContent = "Take a quiz to unlock weak-topic analysis.";
    elements.topicAnalysis.innerHTML = '<div class="result-item"><p>No analysis available yet.</p></div>';
    elements.historyList.innerHTML = '<div class="result-item"><p>No attempts stored in localStorage yet.</p></div>';
    return;
  }

  elements.scoreValue.textContent = `${result.score}/${result.total}`;
  elements.scoreCaption.textContent = `${result.answered} answered on the latest attempt.`;
  elements.accuracyValue.textContent = `${result.accuracy}%`;
  elements.bestScoreValue.textContent = `${bestScore}/${result.total}`;
  elements.weakTopicLabel.textContent = result.weakTopics.length
    ? `Focus more on ${result.weakTopics[0].topic}.`
    : "Great work across all topics.";

  elements.topicAnalysis.innerHTML = "";
  result.weakTopics.forEach((topicItem) => {
    const item = document.createElement("div");
    item.className = "result-item";
    item.innerHTML = `
      <div class="result-bar-row">
        <strong>${topicItem.topic}</strong>
        <span>${topicItem.correct}/${topicItem.total} correct</span>
      </div>
      <div class="mini-progress">
        <div class="mini-progress-fill" style="width:${topicItem.accuracy}%"></div>
      </div>
      <p>${topicItem.accuracy}% accuracy</p>
    `;
    elements.topicAnalysis.appendChild(item);
  });

  elements.historyList.innerHTML = "";
  history.forEach((item) => {
    const card = document.createElement("div");
    card.className = "history-item";
    card.innerHTML = `
      <div>
        <strong>${item.score}/${item.total}</strong>
        <p>${item.date}</p>
      </div>
      <div>
        <strong>${item.accuracy}%</strong>
        <p>${item.retryMode ? "Retry wrong mode" : "Full quiz"}</p>
      </div>
    `;
    elements.historyList.appendChild(card);
  });
}

function updateHomeSummary() {
  const topicCount = getTopics().length;
  const latest = JSON.parse(localStorage.getItem(STORAGE_KEYS.lastResult) || "null");

  elements.homeQuestionCount.textContent = `${questions.length} MCQs`;
  elements.homeTopicCount.textContent = `${topicCount} Topics`;
  elements.latestScoreSummary.textContent = latest
    ? `${latest.score}/${latest.total} (${latest.accuracy}%)`
    : "No attempt yet";
}

function renderPracticeQuestion() {
  const current = state.practiceQuestions[state.practiceIndex];

  if (!current) {
    elements.practiceTopicBadge.textContent = "Practice";
    elements.practiceCounter.textContent = "0 / 0";
    elements.practiceQuestionText.textContent = "Pick a topic to load practice questions.";
    elements.practiceOptions.innerHTML = "";
    elements.practiceFeedback.className = "feedback-card hidden";
    return;
  }

  elements.practiceTopicBadge.textContent = current.topic;
  elements.practiceCounter.textContent = `${state.practiceIndex + 1} / ${state.practiceQuestions.length}`;
  elements.practiceQuestionText.textContent = current.question;
  elements.practiceOptions.innerHTML = "";
  elements.practiceFeedback.className = "feedback-card hidden";
  elements.practiceFeedback.innerHTML = "";
  state.practiceAnswered = false;

  current.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.textContent = option;
    button.addEventListener("click", () => {
      if (state.practiceAnswered) {
        return;
      }

      state.practiceAnswered = true;
      const isCorrect = option === current.answer;

      [...elements.practiceOptions.children].forEach((child) => {
        child.disabled = true;
        if (child.textContent === current.answer) {
          child.classList.add("correct");
        }
        if (child.textContent === option && !isCorrect) {
          child.classList.add("wrong");
        }
      });

      elements.practiceFeedback.className = `feedback-card ${isCorrect ? "correct" : "wrong"}`;
      elements.practiceFeedback.innerHTML = `
        <p class="feedback-title">${isCorrect ? "Correct answer" : "Not quite"}</p>
        <p class="feedback-text">Answer: <strong>${current.answer}</strong></p>
        <p class="feedback-text">${current.explanation}</p>
      `;
    });
    elements.practiceOptions.appendChild(button);
  });
}

function selectPracticeTopic(topic) {
  state.practiceTopic = topic;
  state.practiceQuestions = questions.filter((item) => item.topic === topic);
  state.practiceIndex = 0;
  elements.practiceTopicSummary.textContent = `${state.practiceQuestions.length} questions loaded for ${topic}.`;

  [...elements.topicButtons.children].forEach((button) => {
    button.classList.toggle("active", button.textContent === topic);
  });

  renderPracticeQuestion();
}

function loadRetryWrongQuestions() {
  const wrongIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.wrongIds) || "[]");
  const retryQuestions = questions.filter((question) => wrongIds.includes(question.id));

  if (!retryQuestions.length) {
    window.alert("No wrong questions saved yet. Complete a quiz first.");
    return;
  }

  startQuiz(retryQuestions, { retryMode: true });
}

function bindEvents() {
  elements.themeToggle.addEventListener("click", () => {
    const nextTheme = elements.body.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  });

  elements.startQuizBtn.addEventListener("click", () => startQuiz(questions));
  elements.practiceModeBtn.addEventListener("click", () => showScreen("practiceScreen"));
  elements.viewScoreBtn.addEventListener("click", () => {
    renderDashboard();
    showScreen("resultScreen");
  });

  elements.homeFromQuizBtn.addEventListener("click", () => {
    stopTimer();
    showScreen("homeScreen");
  });
  elements.backHomeFromPracticeBtn.addEventListener("click", () => showScreen("homeScreen"));
  elements.backHomeFromResultBtn.addEventListener("click", () => showScreen("homeScreen"));

  elements.nextQuestionBtn.addEventListener("click", () => {
    if (state.quizIndex < state.quizQuestions.length - 1) {
      state.quizIndex += 1;
      renderQuizQuestion();
    }
  });

  elements.prevQuestionBtn.addEventListener("click", () => {
    if (state.quizIndex > 0) {
      state.quizIndex -= 1;
      renderQuizQuestion();
    }
  });

  elements.submitQuizBtn.addEventListener("click", submitQuiz);
  elements.retryWrongBtn.addEventListener("click", loadRetryWrongQuestions);

  elements.prevPracticeBtn.addEventListener("click", () => {
    if (state.practiceIndex > 0) {
      state.practiceIndex -= 1;
      renderPracticeQuestion();
    }
  });

  elements.nextPracticeBtn.addEventListener("click", () => {
    if (state.practiceIndex < state.practiceQuestions.length - 1) {
      state.practiceIndex += 1;
      renderPracticeQuestion();
    }
  });
}

function init() {
  loadTheme();
  buildTopicButtons();
  updateHomeSummary();
  renderPracticeQuestion();
  renderDashboard();
  bindEvents();
}

init();
