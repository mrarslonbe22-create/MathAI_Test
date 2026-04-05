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

// ============= RESULTS.JSON FAJL =============
const resultsFile = path.join(__dirname, 'results.json');

// Natijalarni o'qish
function loadResults() {
    try {
        if (fs.existsSync(resultsFile)) {
            const data = fs.readFileSync(resultsFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Load error:', error.message);
    }
    return [];
}

// Natijalarni saqlash
function saveResults(results) {
    try {
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        console.log('✅ Natijalar saqlandi. Jami:', results.length);
        return true;
    } catch (error) {
        console.error('Save error:', error.message);
        return false;
    }
}

// ============= API: NATIJANI SAQLASH =============
app.post('/api/save-result', (req, res) => {
    console.log('📥 So\'rov keldi:', req.body);
    
    try {
        const { name, score, weakTopics } = req.body;
        
        // Ma'lumotlarni tekshirish
        if (!name) {
            return res.json({ success: false, error: 'Name required' });
        }
        
        let results = loadResults();
        
        const newResult = {
            id: Date.now(),
            name: name || 'Noma\'lum',
            score: score || 0,
            weakTopics: weakTopics || [],
            date: new Date().toLocaleString('uz-UZ')
        };
        
        results.push(newResult);
        
        if (saveResults(results)) {
            console.log('✅ Natija saqlandi:', newResult);
            res.json({ success: true, message: 'Natija saqlandi', data: newResult });
        } else {
            res.json({ success: false, error: 'Faylga yozishda xatolik' });
        }
        
    } catch (error) {
        console.error('Save error:', error);
        res.json({ success: false, error: error.message });
    }
});

// ============= API: NATIJALARNI OLISH =============
app.get('/api/get-results', (req, res) => {
    try {
        const results = loadResults();
        console.log('📊 Natijalar o\'qildi. Jami:', results.length);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Load error:', error);
        res.json({ success: true, data: [] });
    }
});

// ============= API: NATIJALARNI TOZALASH =============
app.delete('/api/clear-results', (req, res) => {
    try {
        saveResults([]);
        res.json({ success: true, message: 'Barcha natijalar o\'chirildi' });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// ============= AI API =============
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

app.post('/api/advice', async (req, res) => {
    try {
        const { weakTopics, score } = req.body;
        
        if (useMock || !genAI) {
            let advice = "📚 O'qishni davom ettiring! ";
            if (weakTopics && weakTopics.length > 0) {
                advice += `Zaif mavzularingiz: ${weakTopics.join(', ')}.`;
            } else {
                advice += `Siz ${score}/6 ball to'pladingiz. Yaxshi natija!`;
            }
            return res.json({ success: true, advice });
        }
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `O'quvchi matematika testida ${score}/6 ball oldi. Zaif mavzulari: ${weakTopics?.join(', ') || "Yo'q"}. Qisqa maslahat bering. O'zbek tilida.`;
        const result = await model.generateContent(prompt);
        const advice = result.response.text();
        
        res.json({ success: true, advice });
    } catch (error) {
        res.json({ success: true, advice: "📚 Zaif mavzularingizni qayta takrorlang!" });
    }
});

app.post('/api/ask', async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ success: false, error: 'Savol kiritilmagan' });
        }
        
        if (useMock || !genAI) {
            return res.json({ 
                success: true, 
                answer: "💡 Bu savolga javob: Matematikani o'rganishni davom ettiring!" 
            });
        }
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Siz matematika o'qituvchisisiz. Savol: ${question}. Aniq javob bering. O'zbek tilida.`;
        const result = await model.generateContent(prompt);
        const answer = result.response.text();
        
        res.json({ success: true, answer });
    } catch (error) {
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
    🤖 AI: ${useMock ? 'Demo rejim' : 'Gemini AI ulangan'}
    📁 Natijalar fayli: ${resultsFile}
    ════════════════════════════════════════════
    `);
});

module.exports = app;
