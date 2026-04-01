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
  questions.push(`${a} × ${b}`);
  answers.push(a * b);

  a = randomInt(2, 10);
  let power = randomInt(2, 3);
  questions.push(`${a}^${power}`);
  answers.push(Math.pow(a, power));

  a = randomInt(4, 400);
  questions.push(`√${a}`);
  answers.push(Math.round(Math.sqrt(a)));

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
  const timerElement = document.getElementById("timer");
  
  timerInterval = setInterval(() => {
    if (timerElement) {
      timerElement.innerText = timeLeft;
    }
    timeLeft--;

    // Progress barni yangilash
    let progress = ((60 - timeLeft - 1) / 60) * 100;
    updateProgress(progress);

    if (timeLeft < 0) {
      clearInterval(timerInterval);
      checkTest();
    }
  }, 1000);
}

// Progress barni yangilash
function updateProgress(percent) {
  const progressBar = document.getElementById("progress-bar");
  if (progressBar) {
    let p = Math.min(100, Math.max(0, percent));
    progressBar.style.width = p + "%";
    progressBar.innerText = Math.round(p) + "%";
  }
}

// Testni boshlash
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

  // Savollarni HTML ga joylashtirish
  for (let i = 1; i <= 5; i++) {
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

// Zaif mavzularni aniqlash
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

// ============= AI ADVICE (Vercel uchun tuzatilgan) =============
async function getAIAdvice(weakTopics, score) {
  const adviceResult = document.getElementById("aiAdvice");
  const adviceBtn = document.getElementById("adviceBtn");
  
  if (adviceBtn) {
    adviceBtn.disabled = true;
    adviceBtn.textContent = "⏳ Maslahat olinmoqda...";
  }
  
  if (adviceResult) {
    adviceResult.innerHTML = '<p style="color: #667eea;">🤖 AI dan maslahat olinyapti...</p>';
  }
  
  try {
    // MUHIM: localhost emas, relative path!
    const response = await fetch('/api/advice', {
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
          <div class="ai-advice-box" style="background: #e3f2fd; padding: 15px; border-radius: 10px; margin-top: 10px;">
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
          ⚠️ Internet ulanishini tekshiring
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

// ============= AI ASK (Vercel uchun tuzatilgan) =============
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
    answerResult.innerHTML = '<p style="color: #667eea;">🤔 AI javob yozyapti...</p>';
  }
  
  try {
    // MUHIM: localhost emas, relative path!
    const response = await fetch('/api/ask', {
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
          ⚠️ Internet ulanishini tekshiring
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

// ============= TESTNI TEKSHIRISH =============
async function checkTest() {
  clearInterval(timerInterval);

  let score = 0;
  let wrongTopics = [];

  for (let i = 1; i <= 5; i++) {
    let user = parseFloat(document.getElementById("q" + i).value);
    let answer = answers[i - 1];
    
    if (isNaN(user)) {
      user = 0;
    }

    if (Math.abs(user - answer) < 0.1) {
      score++;
    } else {
      if (i === 1) wrongTopics.push("qo'shish");
      if (i === 2) wrongTopics.push("ko'paytirish");
      if (i === 3) wrongTopics.push("daraja");
      if (i === 4) wrongTopics.push("ildiz");
      if (i === 5) wrongTopics.push("trigonometriya");
    }
  }

  // Natijalarni saqlash (serverga yuborish)
  await saveResult(userName, score, wrongTopics);
  
  let weakTopics = getWeakTopicsFromTest(wrongTopics);

  document.getElementById("greeting").innerHTML = `👋 Salom, <strong>${userName}</strong>!`;
  
  const scoreElement = document.getElementById("score");
  if (scoreElement) {
    scoreElement.innerHTML = `${score}<span style="font-size: 18px;">/5</span>`;
  }
  
  let recommendationText = wrongTopics.length 
    ? `📖 O'rganishingiz kerak bo'lgan mavzular: <strong>${wrongTopics.join(", ")}</strong>` 
    : "🎉 A'lo! Barcha savollarga to'g'ri javob berdingiz! Tabriklaymiz!";
  
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

// Natijalarni saqlash (serverga yuborish)
async function saveResult(name, score, weakTopics) {
  // LocalStorage ga saqlash
  let data = JSON.parse(localStorage.getItem("results")) || [];
  data.push({ 
    name, 
    score, 
    weakTopics: weakTopics || [],
    date: new Date().toLocaleString('uz-UZ') 
  });
  localStorage.setItem("results", JSON.stringify(data));
  
  // Serverga saqlash
  try {
    await fetch('/api/save-result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, score, weakTopics: weakTopics || [] })
    });
    console.log("✅ Natija serverga saqlandi");
  } catch (error) {
    console.log("⚠️ Serverga saqlashda xato, faqat lokal saqlandi");
  }
}

function restartTest() {
  location.reload();
}

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', function() {
  console.log("🧠 MathAI tayyor!");
});
