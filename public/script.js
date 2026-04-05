let questions = [];
let answers = [];
let userName = "";
let timeLeft = 60;
let timerInterval;
let startTime; // Test boshlangan vaqt

// Random son
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random amal (qo'shish yoki ayirish)
function randomAddSub() {
  const ops = ["+", "-"];
  return ops[randomInt(0, 1)];
}

// Random amal (ko'paytirish yoki bo'lish)
function randomMulDiv() {
  const ops = ["×", "÷"];
  return ops[randomInt(0, 1)];
}

// Trigonometriya
function randomTrig() {
  const funcs = ["sin", "cos", "tan", "cot"];
  return funcs[randomInt(0, funcs.length - 1)];
}

// Savollar (6 ta)
function generateQuestions() {
  questions = [];
  answers = [];

  // 1-savol: Qo'shish yoki Ayirish
  let a = randomInt(10, 100);
  let b = randomInt(10, 100);
  let op = randomAddSub();
  if (op === "+") {
    questions.push(`${a} + ${b}`);
    answers.push(a + b);
  } else {
    if (a < b) { let temp = a; a = b; b = temp; }
    questions.push(`${a} - ${b}`);
    answers.push(a - b);
  }

  // 2-savol: Ko'paytirish yoki Bo'lish
  a = randomInt(5, 20);
  b = randomInt(2, 10);
  op = randomMulDiv();
  if (op === "×") {
    questions.push(`${a} × ${b}`);
    answers.push(a * b);
  } else {
    let product = a * b;
    questions.push(`${product} ÷ ${a}`);
    answers.push(b);
  }

  // 3-savol: Daraja
  a = randomInt(2, 10);
  let power = randomInt(2, 3);
  questions.push(`${a}^${power}`);
  answers.push(Math.pow(a, power));

  // 4-savol: Ildiz
  a = randomInt(4, 400);
  questions.push(`√${a}`);
  answers.push(Math.round(Math.sqrt(a)));

  // 5-savol: Logarifm
  let logBase = randomInt(2, 5);
  let logValue = randomInt(2, 4);
  let logNumber = Math.pow(logBase, logValue);
  questions.push(`log${logBase}(${logNumber})`);
  answers.push(logValue);

  // 6-savol: Trigonometriya
  let trigFunc = randomTrig();
  let angles = [0, 30, 45, 60];
  let angle = angles[randomInt(0, angles.length - 1)];
  let rad = angle * Math.PI / 180;

  let trig;
  switch(trigFunc) {
    case "sin": trig = Math.sin(rad); break;
    case "cos": trig = Math.cos(rad); break;
    case "tan": trig = Math.tan(rad); break;
    case "cot": trig = 1 / Math.tan(rad); break;
  }
  
  questions.push(`${trigFunc}(${angle}°)`);
  answers.push(Math.round(trig * 100) / 100);
}

// Timer
function startTimer() {
  timeLeft = 60;
  startTime = Date.now(); // Test boshlangan vaqtni saqlash
  const timerElement = document.getElementById("timer");
  
  timerInterval = setInterval(() => {
    if (timerElement) {
      timerElement.innerText = timeLeft;
    }
    timeLeft--;

    let progress = ((60 - timeLeft - 1) / 60) * 100;
    updateProgress(progress);

    if (timeLeft < 0) {
      clearInterval(timerInterval);
      checkTest();
    }
  }, 1000);
}

function updateProgress(percent) {
  const progressBar = document.getElementById("progress-bar");
  if (progressBar) {
    let p = Math.min(100, Math.max(0, percent));
    progressBar.style.width = p + "%";
    progressBar.innerText = Math.round(p) + "%";
  }
}

function startTest() {
  const first = document.getElementById("firstName").value;
  const last = document.getElementById("lastName").value;

  if (!first || !last) {
    alert("Ism va familiya kiriting!");
    return;
  }

  userName = first + " " + last;

  document.getElementById("start-section").style.display = "none";
  document.getElementById("test-section").style.display = "block";

  generateQuestions();

  for (let i = 1; i <= 6; i++) {
    const questionSpan = document.getElementById(`q${i}-text`);
    if (questionSpan) {
      questionSpan.innerText = questions[i - 1];
    }
    const inputField = document.getElementById(`q${i}`);
    if (inputField) {
      inputField.value = "";
    }
  }

  updateProgress(0);
  startTimer();
}

function getWeakTopicsFromTest(wrongTopics) {
  let userData = JSON.parse(localStorage.getItem("userData")) || {};
  
  wrongTopics.forEach(topic => {
    if (!userData[topic]) {
      userData[topic] = { correct: 0, wrong: 0 };
    }
    userData[topic].wrong++;
  });
  
  localStorage.setItem("userData", JSON.stringify(userData));
  
  let weak = [];
  for (let topic in userData) {
    if (userData[topic].wrong > (userData[topic].correct || 0)) {
      weak.push(topic);
    }
  }
  return weak;
}

// ============= NATIJALARNI SAQLASH (VAQT BILAN) =============
async function saveResult(name, score, weakTopics, timeSpent) {
  // Vaqtni hisoblash (agar timeSpent berilmagan bo'lsa, 60 - timeLeft)
  const spentTime = timeSpent || (60 - timeLeft);
  
  const resultData = {
    id: Date.now(),
    name: name,
    score: score,
    maxScore: 6,
    weakTopics: weakTopics || [],
    timeSpent: spentTime,  // Qancha vaqt sarflangan (soniya)
    date: new Date().toLocaleString('uz-UZ'),
    timestamp: new Date().toISOString()
  };
  
  // 1. LocalStorage ga saqlash
  let data = JSON.parse(localStorage.getItem("results")) || [];
  data.push(resultData);
  localStorage.setItem("results", JSON.stringify(data));
  console.log("✅ LocalStorage ga saqlandi:", resultData);
  
  // 2. Serverga saqlash
  try {
    const response = await fetch('/api/save-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultData)
    });
    const result = await response.json();
    if (result.success) {
      console.log("✅ Serverga saqlandi");
    }
  } catch (error) {
    console.log("⚠️ Serverga saqlashda xato");
  }
}

// ============= AI ADVICE =============
async function getAIAdvice(weakTopics, score) {
  const adviceResult = document.getElementById("aiAdvice");
  const adviceBtn = document.getElementById("adviceBtn");
  
  if (adviceBtn) {
    adviceBtn.disabled = true;
    adviceBtn.textContent = "⏳ Maslahat olinmoqda...";
  }
  
  if (adviceResult) {
    adviceResult.innerHTML = '<p>🤖 AI dan maslahat olinyapti...</p>';
  }
  
  try {
    const response = await fetch('/api/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weakTopics: weakTopics, score: score })
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (adviceResult) {
        adviceResult.innerHTML = `
          <div class="ai-advice-box">
            <h3>📚 AI Tavsiyasi</h3>
            <p>${data.advice}</p>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Xato:', error);
    if (adviceResult) {
      adviceResult.innerHTML = `<div class="error-box">❌ Xatolik yuz berdi</div>`;
    }
  } finally {
    if (adviceBtn) {
      adviceBtn.disabled = false;
      adviceBtn.textContent = "🤖 AI dan maslahat olish";
    }
  }
}

// ============= AI ASK =============
async function askAI() {
  const questionInput = document.getElementById("questionInput");
  const question = questionInput?.value.trim();
  
  if (!question) {
    alert("Iltimos, savolingizni yozing!");
    return;
  }
  
  const askBtn = document.getElementById("askBtn");
  const answerResult = document.getElementById("answerResult");
  
  if (askBtn) {
    askBtn.disabled = true;
    askBtn.textContent = "⏳ Javob olinmoqda...";
  }
  
  if (answerResult) {
    answerResult.innerHTML = '<p>🤔 AI javob yozyapti...</p>';
  }
  
  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: question })
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (answerResult) {
        answerResult.innerHTML = `
          <div class="answer-box">
            <h3>💡 Javob:</h3>
            <p>${data.answer}</p>
          </div>
        `;
      }
      questionInput.value = "";
    }
  } catch (error) {
    console.error('Xato:', error);
    if (answerResult) {
      answerResult.innerHTML = `<div class="error-box">❌ Xatolik yuz berdi</div>`;
    }
  } finally {
    if (askBtn) {
      askBtn.disabled = false;
      askBtn.textContent = "❓ Savol berish";
    }
  }
}

// ============= TESTNI TEKSHIRISH =============
async function checkTest() {
  clearInterval(timerInterval);

  let score = 0;
  let wrongTopics = [];

  for (let i = 1; i <= 6; i++) {
    let user = parseFloat(document.getElementById("q" + i).value);
    let answer = answers[i - 1];
    
    if (isNaN(user)) user = 0;

    if (Math.abs(user - answer) < 0.1) {
      score++;
    } else {
      if (i === 1) wrongTopics.push("qo'shish");
      if (i === 2) wrongTopics.push("ko'paytirish");
      if (i === 3) wrongTopics.push("daraja");
      if (i === 4) wrongTopics.push("ildiz");
      if (i === 5) wrongTopics.push("logarifm");
      if (i === 6) wrongTopics.push("trigonometriya");
    }
  }

  // Sarflangan vaqtni hisoblash (60 - qolgan vaqt)
  const timeSpent = 60 - timeLeft;
  
  // Natijalarni saqlash (vaqt bilan birga)
  await saveResult(userName, score, wrongTopics, timeSpent);
  
  let weakTopics = getWeakTopicsFromTest(wrongTopics);

  document.getElementById("greeting").innerHTML = `👋 Salom, <strong>${userName}</strong>!`;
  
  const scoreElement = document.getElementById("score");
  if (scoreElement) {
    scoreElement.innerHTML = `${score}<span style="font-size: 18px;">/6</span>`;
  }
  
  // Vaqtni ko'rsatish
  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;
  const timeText = minutes > 0 ? `${minutes} daqiqa ${seconds} soniya` : `${seconds} soniya`;
  
  let recommendationText = wrongTopics.length 
    ? `📖 O'rganishingiz kerak bo'lgan mavzular: <strong>${wrongTopics.join(", ")}</strong><br>⏱ Sarflangan vaqt: ${timeText}`
    : `🎉 A'lo! Barcha savollarga to'g'ri javob berdingiz!<br>⏱ Sarflangan vaqt: ${timeText}`;
  
  document.getElementById("recommendation").innerHTML = recommendationText;

  let html = '<div style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">';
  if (wrongTopics.length > 0) {
    wrongTopics.forEach(t => {
      html += `<button onclick="openLesson('${t}')" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer;">📘 ${t} ni o'rganish</button>`;
    });
  } else {
    html += `<button onclick="restartTest()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer;">🎯 Yangi test topshirish</button>`;
  }
  html += '</div>';
  
  document.getElementById("topicButtons").innerHTML = html;

  let aiSectionHtml = `
    <div style="margin-top: 20px; padding: 15px; border-top: 2px solid #e0e0e0;">
      <button onclick="getAIAdvice(${JSON.stringify(weakTopics)}, ${score})" id="adviceBtn" style="padding: 12px 25px; background: #9C27B0; color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 16px;">
        🤖 AI dan maslahat olish
      </button>
      <div id="aiAdvice" style="margin-top: 15px;"></div>
    </div>
  `;
  
  const aiSectionElement = document.getElementById("aiSection");
  if (aiSectionElement) {
    aiSectionElement.innerHTML = aiSectionHtml;
  }

  document.getElementById("test-section").style.display = "none";
  document.getElementById("result-section").style.display = "block";
}

function openLesson(topic) {
  localStorage.setItem("topic", topic);
  window.location.href = "lesson.html";
}

function restartTest() {
  location.reload();
}

document.addEventListener('DOMContentLoaded', function() {
  console.log("🧠 MathAI tayyor!");
});
