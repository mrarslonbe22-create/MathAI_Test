const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============= RESULTS.JSON FAYL =============
const resultsFile = path.join(__dirname, 'results.json');

// Natijalarni o'qish
function loadResults() {
    try {
        if (fs.existsSync(resultsFile)) {
            const data = fs.readFileSync(resultsFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Faylni o\'qishda xato:', error);
    }
    return [];
}

// Natijalarni saqlash
function saveResults(results) {
    try {
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        console.log('✅ Natijalar saqlandi');
    } catch (error) {
        console.error('Faylga yozishda xato:', error);
    }
}

// Gemini sozlamalari (agar API key bo'lmasa ishlamaydi)
let genAI = null;
try {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'AIzaSyD7KJk9xP2mR4vL8nQ3wE6rT5yU1iOpL9') {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('✅ Gemini AI ulandi');
    } else {
        console.log('⚠️ API key yo\'q, AI funksiyalari ishlamaydi');
    }
} catch (error) {
    console.log('⚠️ Gemini paketi yuklanmadi');
}

// ============= API 1: AI MASLAHAT =============
app.post('/api/advice', async (req, res) => {
    try {
        const { weakTopics, score } = req.body;
        
        // Agar Gemini ishlamasa, demo javob
        if (!genAI) {
            let advice = "📚 O'qishni davom ettiring! ";
            if (weakTopics && weakTopics.length > 0) {
                advice += `Zaif mavzularingiz: ${weakTopics.join(', ')}. Ushbu mavzularni qayta takrorlang.`;
            } else {
                advice += `Siz ${score}/5 ball to'pladingiz. Yaxshi natija!`;
            }
            return res.json({ success: true, advice });
        }
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `
            O'quvchi matematika testida ${score} ball oldi.
            Zaif mavzulari: ${weakTopics.join(', ') || "Hech qanday zaif mavzu yo'q"}.
            
            Shu natijalarga asoslanib, o'quvchiga qisqa va foydali maslahat bering.
            Faqat 3-4 gap yozing. O'zbek tilida javob bering.
        `;
        
        const result = await model.generateContent(prompt);
        const advice = result.response.text();
        
        res.json({ success: true, advice });
    } catch (error) {
        console.error('Xato:', error);
        res.json({ 
            success: true, 
            advice: "📚 Zaif mavzularingizni aniqlang va ularni qayta takrorlang. Har kuni 15-20 daqiqa matematika bilan shug'ullaning!" 
        });
    }
});

// ============= API 2: SAVOL-JAVOB =============
app.post('/api/ask', async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ success: false, error: 'Savol kiritilmagan' });
        }
        
        // Agar Gemini ishlamasa, demo javob
        if (!genAI) {
            return res.json({ 
                success: true, 
                answer: "💡 Bu savolga hozircha javob bera olmayman. Iltimos, API key ni sozlang." 
            });
        }
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `
            Siz matematika o'qituvchisisiz. Quyidagi savolga aniq va tushunarli javob bering:
            
            Savol: ${question}
            
            Javobingizni o'zbek tilida yozing.
        `;
        
        const result = await model.generateContent(prompt);
        const answer = result.response.text();
        
        res.json({ success: true, answer });
    } catch (error) {
        console.error('Xato:', error);
        res.json({ 
            success: true, 
            answer: "💡 Kechirasiz, hozircha javob bera olmayapman. Iltimos, keyinroq qayta urinib ko'ring." 
        });
    }
});

// ============= API 3: NATIJANI SAQLASH =============
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
        
        saveResults(results);
        res.json({ success: true, message: 'Natija saqlandi' });
    } catch (error) {
        console.error('Saqlash xato:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= API 4: NATIJALARNI OLISH =============
app.get('/api/get-results', (req, res) => {
    try {
        const results = loadResults();
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('O\'qish xato:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= API 5: NATIJALARNI TOZALASH =============
app.delete('/api/clear-results', (req, res) => {
    try {
        saveResults([]);
        res.json({ success: true, message: 'Barcha natijalar o\'chirildi' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= ROOT SAHIFA =============
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============= SERVERNI ISHGA TUSHIRISH =============
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ════════════════════════════════════════════
    🚀 MathAI Server ishga tushdi!
    📡 Port: ${PORT}
    🤖 AI: ${genAI ? 'Gemini AI ulangan' : 'Demo rejim (AI yo\'q)'}
    📁 Admin: /admin.html
    ════════════════════════════════════════════
    `);
});
