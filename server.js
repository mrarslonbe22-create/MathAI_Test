const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Static fayllar - MUHIM!
app.use(express.static(path.join(__dirname, 'public')));

// Gemini AI sozlamalari
let genAI = null;
let useMock = true;

try {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        useMock = false;
        console.log('✅ Gemini AI ulandi');
    } else {
        console.log('⚠️ API key yo\'q, demo rejim');
    }
} catch (error) {
    console.log('⚠️ Gemini ulashda xato');
}

// ============= API 1: AI MASLAHAT =============
app.post('/api/advice', async (req, res) => {
    try {
        const { weakTopics, score } = req.body;
        
        if (useMock || !genAI) {
            let advice = "📚 O'qishni davom ettiring! ";
            if (weakTopics && weakTopics.length > 0) {
                advice += `Zaif mavzularingiz: ${weakTopics.join(', ')}. Ushbu mavzularni qayta takrorlang.`;
            } else {
                advice += `Siz ${score}/5 ball to'pladingiz. Yaxshi natija!`;
            }
            return res.json({ success: true, advice });
        }
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `O'quvchi matematika testida ${score}/5 ball oldi. Zaif mavzulari: ${weakTopics?.join(', ') || "Yo'q"}. Qisqa maslahat bering. O'zbek tilida.`;
        const result = await model.generateContent(prompt);
        const advice = result.response.text();
        
        res.json({ success: true, advice });
    } catch (error) {
        res.json({ success: true, advice: "📚 Zaif mavzularingizni aniqlang va ularni qayta takrorlang!" });
    }
});

// ============= API 2: SAVOL-JAVOB =============
app.post('/api/ask', async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ success: false, error: 'Savol kiritilmagan' });
        }
        
        if (useMock || !genAI) {
            return res.json({ 
                success: true, 
                answer: "💡 Bu savolga hozircha javob bera olmayman. API key ni tekshiring." 
            });
        }
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Siz matematika o'qituvchisisiz. Savol: ${question}. Aniq javob bering. O'zbek tilida.`;
        const result = await model.generateContent(prompt);
        const answer = result.response.text();
        
        res.json({ success: true, answer });
    } catch (error) {
        res.json({ success: true, answer: "💡 Kechirasiz, hozircha javob bera olmayman." });
    }
});

// ============= API 3: NATIJANI SAQLASH =============
const resultsFile = path.join(__dirname, 'results.json');

function loadResults() {
    try {
        if (fs.existsSync(resultsFile)) {
            return JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
        }
    } catch (error) {}
    return [];
}

app.post('/api/save-result', (req, res) => {
    try {
        const { name, score, weakTopics } = req.body;
        let results = loadResults();
        results.push({
            name: name || 'Noma\'lum',
            score: score || 0,
            weakTopics: weakTopics || [],
            date: new Date().toLocaleString('uz-UZ')
        });
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false });
    }
});

// ============= API 4: NATIJALARNI OLISH =============
app.get('/api/get-results', (req, res) => {
    try {
        const results = loadResults();
        res.json({ success: true, data: results });
    } catch (error) {
        res.json({ success: true, data: [] });
    }
});

// ============= API 5: NATIJALARNI TOZALASH =============
app.delete('/api/clear-results', (req, res) => {
    try {
        fs.writeFileSync(resultsFile, JSON.stringify([], null, 2));
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false });
    }
});

// ============= BARCHA SAHIFALAR =============
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/lesson.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'lesson.html'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'script.js'));
});

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'style.css'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============= SERVER =============
app.listen(PORT, () => {
    console.log(`🚀 Server ${PORT}-portda ishga tushdi`);
});

module.exports = app;
