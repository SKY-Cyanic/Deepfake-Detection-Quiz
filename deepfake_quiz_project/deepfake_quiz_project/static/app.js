let questions = [];
let idx = 0;
let score = 0;
let timeUpdateHandler = null; // 비디오 시간 업데이트 핸들러 참조

const scoreValue = document.getElementById("score-value");
const qTitle = document.getElementById("question-title");
const qImage = document.getElementById("quiz-image");
const qVideo = document.getElementById("quiz-video"); // 비디오 요소 추가
const highlightsContainer = document.getElementById("highlights-container");
const trueBtn = document.getElementById("true-btn");
const fakeBtn = document.getElementById("fake-btn");
const feedback = document.getElementById("feedback");
const feedbackMsg = document.getElementById("feedback-msg");
const feedbackTech = document.getElementById("feedback-tech");
const feedbackHints = document.getElementById("feedback-hints");
const nextBtn = document.getElementById("next-btn");
const finalArea = document.getElementById("final-area");
const finalScore = document.getElementById("final-score");
const finalRemark = document.getElementById("final-remark");
const restartBtn = document.getElementById("restart-btn");

async function loadQuestions() {
  const res = await fetch("/api/questions");
  const data = await res.json();
  questions = data.questions;
  showQuestion();
}

function clearHighlights() {
  highlightsContainer.innerHTML = "";
}

function renderHighlights(highlights = []) {
  clearHighlights();
  highlights.forEach(h => {
    const box = document.createElement("div");
    box.className = "highlight-box";
    box.style.left = h.x + "%";
    box.style.top = h.y + "%";
    box.style.width = h.w + "%";
    box.style.height = h.h + "%";
    highlightsContainer.appendChild(box);
  });
}

function showQuestion() {
  clearHighlights();
  if (idx >= questions.length) {
    finishQuiz();
    return;
  }

  const q = questions[idx];
  qTitle.textContent = `문제 ${idx + 1}. ${q.title}`;
  feedback.classList.add("hidden");
  
  // 이전 비디오 이벤트 리스너 제거
  if (timeUpdateHandler) {
    qVideo.removeEventListener("timeupdate", timeUpdateHandler);
    timeUpdateHandler = null;
  }
  qVideo.pause();

  if (q.type === 'video') {
    qImage.classList.add("hidden");
    qVideo.classList.remove("hidden");
    if (qVideo.src !== window.location.origin + q.path) {
        qVideo.src = q.path;
    }
    qVideo.currentTime = q.time_range[0];
    
    // 시간 범위 반복 재생을 위한 핸들러
    timeUpdateHandler = () => {
        if (qVideo.currentTime >= q.time_range[1]) {
            qVideo.currentTime = q.time_range[0];
        }
    };
    qVideo.addEventListener("timeupdate", timeUpdateHandler);
    qVideo.play();
    
  } else { // 'image' or default
    qVideo.classList.add("hidden");
    qImage.classList.remove("hidden");
    qImage.src = q.path;
  }
  
  trueBtn.disabled = false;
  fakeBtn.disabled = false;
}

async function submitAnswer(userAns) {
  trueBtn.disabled = true;
  fakeBtn.disabled = true;

  const q = questions[idx];
  const payload = { id: q.id, answer: userAns };
  const res = await fetch("/api/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (data.error) {
    alert("서버 에러: " + data.error);
    trueBtn.disabled = false;
    fakeBtn.disabled = false;
    return;
  }
  score += data.delta;
  scoreValue.textContent = score;
  feedbackMsg.textContent = `${data.message} (정답: ${data.answer})`;
  feedbackTech.textContent = data.technique;
  feedbackHints.innerHTML = "";
  data.hints.forEach(h => {
    const li = document.createElement("li");
    li.textContent = h;
    feedbackHints.appendChild(li);
  });
  
  renderHighlights(data.highlights);
  feedback.classList.remove("hidden");
}

function finishQuiz() {
  document.getElementById("quiz-area").classList.add("hidden");
  finalArea.classList.remove("hidden");
  qVideo.pause();
  finalScore.textContent = `최종 점수: ${score}점`;
  if (score >= 60) {
    finalRemark.textContent = "딥페이크 탐지 전문가! 당신의 눈은 디지털 위변조를 꿰뚫어 봅니다. 👁️‍🗨️";
  } else if (score >= 25) {
    finalRemark.textContent = "좋은 판별 능력입니다! 이미지와 영상의 미세한 '오류'에 좀 더 주목해보세요. 👍";
  } else {
    finalRemark.textContent = "주의 깊은 관찰이 필요합니다. 미디어를 볼 때 비판적인 시각을 유지하는 연습을 해보세요. 🤔";
  }
}

trueBtn.addEventListener("click", () => submitAnswer("진짜"));
fakeBtn.addEventListener("click", () => submitAnswer("가짜"));

nextBtn.addEventListener("click", () => {
  idx += 1;
  showQuestion();
});

restartBtn.addEventListener("click", () => {
  idx = 0;
  score = 0;
  scoreValue.textContent = score;
  finalArea.classList.add("hidden");
  document.getElementById("quiz-area").classList.remove("hidden");
  showQuestion();
});

loadQuestions();