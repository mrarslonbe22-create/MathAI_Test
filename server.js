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
app.use(express.static(path.join(__dirname, 'public')));

// ============= RESULTS.JSON =============
const resultsFile = path.join(__dirname, 'results.json');

function loadResults() {
    try {
        if (fs.existsSync(resultsFile)) {
            return JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
        }
    } catch (error) {}
    return [];
}

function saveResults(results) {
    try {
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        console.log('✅ Natijalar saqlandi. Jami:', results.length);
        return true;
    } catch (error) {
        return false;
    }
}

// ============= NATIJALAR API =============
app.post('/api/save-result', (req, res) => {
    console.log('📥 So\'rov keldi:', req.body);
    try {
        const { name, score, weakTopics } = req.body;
        if (!name) return res.json({ success: false, error: 'Name required' });
        
        let results = loadResults();
        results.push({
            id: Date.now(),
            name: name || 'Noma\'lum',
            score: score || 0,
            weakTopics: weakTopics || [],
            date: new Date().toLocaleString('uz-UZ')
        });
        
        if (saveResults(results)) {
            res.json({ success: true, message: 'Natija saqlandi' });
        } else {
            res.json({ success: false, error: 'Faylga yozishda xatolik' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/get-results', (req, res) => {
    try {
        res.json({ success: true, data: loadResults() });
    } catch (error) {
        res.json({ success: true, data: [] });
    }
});

app.delete('/api/clear-results', (req, res) => {
    try {
        saveResults([]);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false });
    }
});

// ============= GROQ AI API (BEPUL VA TEZ) =============
let groqAI = null;
let useMock = true;

try {
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 5) {
        const Groq = require('groq-sdk');
        groqAI = new Groq({ apiKey: process.env.GROQ_API_KEY });
        useMock = false;
        console.log('✅ Groq AI ulandi (bepul)');
    } else {
        console.log('⚠️ GROQ_API_KEY yo\'q, demo rejim');
    }
} catch (error) {
    console.log('⚠️ Groq ulashda xato');
}

// AI MASLAHAT
app.post('/api/advice', async (req, res) => {
    try {
        const { weakTopics, score } = req.body;
        
        if (useMock || !groqAI) {
            let advice = "📚 O'qishni davom ettiring! ";
            advice += weakTopics?.length > 0 
                ? `Zaif mavzularingiz: ${weakTopics.join(', ')}.`
                : `Siz ${score}/6 ball to'pladingiz. Yaxshi natija!`;
            return res.json({ success: true, advice });
        }
        
        const prompt = `Siz matematika o'qituvchisisiz. O'quvchi testda ${score}/6 ball oldi. Zaif mavzulari: ${weakTopics?.join(', ') || "Yo'q"}. Qisqa maslahat bering (3-4 gap). O'zbek tilida javob bering. Maslahatni "📚" bilan boshlang.`;
        
        const completion = await groqAI.chat.completions.create({
            messages: [
                { role: 'system', content: 'Siz matematika o\'qituvchisisiz. Javoblaringiz qisqa, aniq va foydali bo\'lsin.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 300,
        });
        
        const advice = completion.choices[0]?.message?.content || "📚 Zaif mavzularingizni qayta takrorlang!";
        res.json({ success: true, advice });
        
    } catch (error) {
        console.error('AI xato:', error);
        res.json({ success: true, advice: "📚 Zaif mavzularingizni aniqlab, ularni qayta takrorlang!" });
    }
});

// AI SAVOL-JAVOB
app.post('/api/ask', async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ success: false, error: 'Savol kiritilmagan' });
        }
        
        if (useMock || !groqAI) {
            return res.json({ success: true, answer: "💡 Matematikani o'rganishni davom ettiring! Savolingizni aniqroq yozing." });
        }
        
        const prompt = `Siz matematika o'qituvchisisiz. Savol: ${question}. Aniq, tushunarli va batafsil javob bering. O'zbek tilida. Javobni "💡" bilan boshlang.`;
        
        const completion = await groqAI.chat.completions.create({
            messages: [
                { role: 'system', content: 'Siz matematika o\'qituvchisisiz. Javoblaringiz aniq, tushunarli va o\'zbek tilida bo\'lsin.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 500,
        });
        
        const answer = completion.choices[0]?.message?.content || "💡 Kechirasiz, hozircha javob bera olmayman.";
        res.json({ success: true, answer });
        
    } catch (error) {
        console.error('AI xato:', error);
        res.json({ success: true, answer: "💡 Kechirasiz, keyinroq qayta urinib ko'ring." });
    }
});

// ============= SAHIFALAR =============
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/lesson.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'lesson.html'));
});

// ============= SERVERNI ISHGA TUSHIRISH =============
app.listen(PORT, () => {
    console.log(`
    ════════════════════════════════════════════
    🚀 MathAI Server ishga tushdi!
    📡 Port: ${PORT}
    🤖 AI: ${useMock ? 'Demo rejim' : 'Groq AI (Llama 3.3) ulangan'}
    📁 Admin panel: /admin.html
    ════════════════════════════════════════════
    `);
});

module.exports = app;
