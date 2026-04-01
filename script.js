let questions = [];
let answers = [];
let userName = "";
let timeLeft = 60;
let timerInterval;

// Random son
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Trigonometriya
function randomTrig() {
  const funcs = ["sin", "cos", "tan", "cot"];
  return funcs[randomInt(0, funcs.length - 1)];
}

// Savollar
function generateQuestions() {
  questions = [];
  answers = [];

  let a = randomInt(10, 100);
  let b = randomInt(10, 100);
  questions.push(`${a} + ${b}`);
  answers.push(a + b);

  a = randomInt(5, 20);
  b = randomInt(2, 10);
  questions.push(`${a} * ${b}`);
  answers.push(a * b);

  a = randomInt(2, 10);
  let power = randomInt(2, 3);
  questions.push(`${a}^${power}`);
  answers.push(a ** power);

  a = randomInt(4, 400);
  questions.push(`√${a}`);
  answers.push(Math.round(Math.sqrt(a)));

  let trigFunc = randomTrig();
  let angle = [0, 30, 45, 60][randomInt(0, 3)];
  let rad = angle * Math.PI / 180;

  let trig;
  if (trigFunc === "sin") trig = Math.sin(rad);
  if (trigFunc === "cos") trig = Math.cos(rad);
  if (trigFunc === "tan") trig = Math.tan(rad);
  if (trigFunc === "cot") trig = 1 / Math.tan(rad);

  questions.push(`${trigFunc}(${angle}°)`);
  answers.push(Math.round(trig * 100) / 100);
}

// Timer
function startTimer() {
  timeLeft = 60;
  timerInterval = setInterval(() => {
    document.getElementById("timer").innerText = "⏱ " + timeLeft;
    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(timerInterval);
      checkTest();
    }
  }, 1000);
}

// Start
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

  for (let i = 1; i <= 5; i++) {
    let questionSpan = document.getElementById("q" + i).previousElementSibling;
    if (questionSpan) {
      questionSpan.innerText = questions[i - 1];
    }
    document.getElementById("q" + i).value = "";
  }

  startTimer();
}

// ============= ZAIF MAVZULARNI ANIQLASH (TO'G'RILANGAN) =============
function getWeakTopicsFromTest(wrongTopics) {
  let userData = JSON.parse(localStorage.getItem("userData")) || {};
  
  wrongTopics.forEach(topic => {
    if (!userData[topic]) {
      userData[topic] = { correct: 0, wrong: 0 };
    }
    userData[topic].wrong++;
  });
  
  localStorage.setItem("userData", JSON.stringify(userData));
  
  // Barcha zaif mavzularni qaytarish
  let weak = [];
  for (let topic in userData) {
    if (userData[topic].wrong > (userData[topic].correct || 0)) {
      weak.push(topic);
    }
  }
  return weak;
}

// ============= AI ADVICE (Gemini API orqali) =============
async function getAIAdvice(weakTopics, score) {
  const adviceResult = document.getElementById("aiAdvice");
  const adviceBtn = document.getElementById("adviceBtn");
  
  if (adviceBtn) {
    adviceBtn.disabled = true;
    adviceBtn.textContent = "⏳ Maslahat olinmoqda...";
  }
  
  if (adviceResult) {
    adviceResult.innerHTML = '<p style="color: blue;">🤖 AI dan maslahat olinyapti...</p>';
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/advice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        weakTopics: weakTopics,
        score: score
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (adviceResult) {
        adviceResult.innerHTML = `
          <div style="background: #e3f2fd; padding: 15px; border-radius: 10px; margin-top: 10px;">
            <h3>📚 AI Tavsiyasi</h3>
            <p>${data.advice}</p>
          </div>
        `;
      }
    } else {
      throw new Error(data.error);
    }
    
  } catch (error) {
    console.error('Xato:', error);
    if (adviceResult) {
      adviceResult.innerHTML = `
        <div style="background: #ffebee; padding: 15px; border-radius: 10px; margin-top: 10px; color: red;">
          ❌ Xatolik: ${error.message}<br>
          ⚠️ Server ishlayotganligini tekshiring: <strong>npm start</strong>
        </div>
      `;
    }
  } finally {
    if (adviceBtn) {
      adviceBtn.disabled = false;
      adviceBtn.textContent = "🤖 AI dan maslahat olish";
    }
  }
}

// ============= AI ASK (Savol-javob) =============
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
    answerResult.innerHTML = '<p style="color: blue;">🤔 AI javob yozyapti...</p>';
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: question })
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (answerResult) {
        answerResult.innerHTML = `
          <div style="background: #f1f8e9; padding: 15px; border-radius: 10px; margin-top: 10px;">
            <h3>💡 Javob:</h3>
            <p>${data.answer}</p>
          </div>
        `;
      }
      questionInput.value = "";
    } else {
      throw new Error(data.error);
    }
    
  } catch (error) {
    console.error('Xato:', error);
    if (answerResult) {
      answerResult.innerHTML = `
        <div style="background: #ffebee; padding: 15px; border-radius: 10px; margin-top: 10px; color: red;">
          ❌ Xatolik: ${error.message}<br>
          ⚠️ Server ishlayotganligini tekshiring: <strong>npm start</strong>
        </div>
      `;
    }
  } finally {
    if (askBtn) {
      askBtn.disabled = false;
      askBtn.textContent = "❓ Savol berish";
    }
  }
}

// ============= TESTNI TEKSHIRISH (AI QO'SHILGAN) =============
async function checkTest() {
  clearInterval(timerInterval);

  let score = 0;
  let wrongTopics = [];

  for (let i = 1; i <= 5; i++) {
    let user = parseFloat(document.getElementById("q" + i).value);

    if (Math.abs(user - answers[i - 1]) < 0.1) {
      score++;
    } else {
      // Mavzu nomlarini aniqlash
      if (i === 1 || i === 2) wrongTopics.push("asosiy amallar");
      if (i === 3) wrongTopics.push("daraja");
      if (i === 4) wrongTopics.push("ildiz");
      if (i === 5) wrongTopics.push("trigonometriya");
    }
  }

  // Natijalarni saqlash
  saveResult(userName, score);
  
  // Zaif mavzularni saqlash
  let weakTopics = getWeakTopicsFromTest(wrongTopics);

  // Natijalarni ko'rsatish
  document.getElementById("greeting").innerText = "Salom " + userName;
  document.getElementById("score").innerText = "Ball: " + score + "/5";
  
  let recommendationText = wrongTopics.length 
    ? "📖 O'rganishingiz kerak: " + wrongTopics.join(", ") 
    : "🎉 A'lo! Barcha savollarga to'g'ri javob berdingiz!";
  
  document.getElementById("recommendation").innerText = recommendationText;

  // Mavzular bo'yicha tugmalar
  let html = '<div style="margin-top: 15px;">';
  wrongTopics.forEach(t => {
    html += `<button onclick="openLesson('${t}')" style="margin: 5px; padding: 8px 15px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">📘 ${t} ni o'rganish</button>`;
  });
  html += '</div>';
  
  document.getElementById("topicButtons").innerHTML = html;

  // AI maslahat qismini ko'rsatish
  let aiSection = `
    <div style="margin-top: 20px; padding: 15px; border-top: 2px solid #ddd;">
      <button onclick="getAIAdvice(${JSON.stringify(weakTopics)}, ${score})" id="adviceBtn" style="padding: 10px 20px; background: #9C27B0; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
        🤖 AI dan maslahat olish
      </button>
      <div id="aiAdvice" style="margin-top: 10px;"></div>
    </div>
  `;
  
  document.getElementById("aiSection").innerHTML = aiSection;

  document.getElementById("test-section").style.display = "none";
  document.getElementById("result-section").style.display = "block";
}

// Lesson ochish
function openLesson(topic) {
  localStorage.setItem("topic", topic);
  window.location.href = "lesson.html";
}

// Natijalarni saqlash
function saveResult(name, score) {
  let data = JSON.parse(localStorage.getItem("results")) || [];
  data.push({ name, score, date: new Date().toLocaleString() });
  localStorage.setItem("results", JSON.stringify(data));
}

// Qayta boshlash
function restartTest() {
  location.reload();
}