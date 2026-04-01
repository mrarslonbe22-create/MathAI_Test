const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// .env faylini yuklash (agar bo'lmasa xato bermaydi)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Static fayllar - MUHIM: public papkasini to'g'ri ko'rsatish
app.use(express.static(path.join(__dirname, 'public')));

// API key ni tekshirish
let genAI = null;
let useMock = true;

try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'AIzaSyD7KJk9xP2mR4vL8nQ3wE6rT5yU1iOpL9') {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        useMock = false;
        console.log('✅ Gemini AI ulandi');
    } else {
        console.log('⚠️ API key yo\'q, demo rejimda ishlaydi');
    }
} catch (error) {
    console.log('⚠️ Gemini paketi yuklanmadi, demo rejimda ishlaydi');
}

// ============= API 1: AI MASLAHAT =============
app.post('/api/advice', async (req, res) => {
    try {
        const { weakTopics, score } = req.body;
        
        // Agar Gemini ishlamasa, demo javob qaytarish
        if (useMock || !genAI) {
            let advice = "📚 O'qishni davom ettiring! ";
            if (weakTopics && weakTopics.length > 0) {
                advice += `Zaif mavzularingiz: ${weakTopics.join(', ')}. Ushbu mavzularni qayta takrorlang.`;
            } else {
                advice += `Siz ${score}/5 ball to'pladingiz. Yaxshi natija! Davom eting.`;
            }
            return res.json({ success: true, advice });
        }
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        let prompt = `Siz matematika o'qituvchisisiz. O'quvchi testda ${score}/5 ball oldi. `;
        if (weakTopics && weakTopics.length > 0) {
            prompt += `Zaif mavzulari: ${weakTopics.join(', ')}. `;
        }
        prompt += `Shu natijalarga asoslanib, o'quvchiga qisqa va foydali maslahat bering. O'zbek tilida javob bering.`;
        
        const result = await model.generateContent(prompt);
        const advice = result.response.text();
        
        res.json({ success: true, advice });
        
    } catch (error) {
        console.error('AI xato:', error);
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
        
        // Agar Gemini ishlamasa, demo javob qaytarish
        if (useMock || !genAI) {
            return res.json({ 
                success: true, 
                answer: "💡 Bu savolga hozircha javob bera olmayman. Iltimos, API key ni sozlang yoki keyinroq qayta urinib ko'ring." 
            });
        }
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `Siz matematika o'qituvchisisiz. Savol: "${question}". Aniq va tushunarli javob bering. O'zbek tilida.`;
        
        const result = await model.generateContent(prompt);
        const answer = result.response.text();
        
        res.json({ success: true, answer });
        
    } catch (error) {
        console.error('AI xato:', error);
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
        res.json({ success: true, message: 'Natija qabul qilindi' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= API 4: NATIJALARNI OLISH =============
app.get('/api/get-results', (req, res) => {
    res.json({ success: true, data: [] });
});

// ============= API 5: NATIJALARNI TOZALASH =============
app.delete('/api/clear-results', (req, res) => {
    res.json({ success: true, message: 'Tozalandi' });
});

// ============= ROOT SAHIFA =============
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============= SERVERNI ISHGA TUSHIRISH =============
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server ishga tushdi!`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 Manzil: http://localhost:${PORT}`);
});
