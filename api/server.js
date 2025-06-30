// Importa as bibliotecas necessárias
const express = require('express');
const path = require('path');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');

// --- Configuração Inteligente do Firebase ---
// Tenta carregar as credenciais do ambiente da Vercel primeiro.
// Se não encontrar, carrega do arquivo local (para quando você rodar no seu PC).
const serviceAccount = process.env.FIREBASE_CREDENTIALS_JSON
  ? JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON)
  : require('../firebase-credentials.json'); // O caminho mudou para '../' porque o arquivo está uma pasta acima.

// Inicializa o Firebase apenas se ainda não foi inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// --- Configuração do Gemini ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- Configuração do Express ---
const app = express();
app.use(express.json());

// --- ROTA PRINCIPAL DA API ---
// Agora escutando em '/api/server' para combinar com o frontend
app.post('/api/server', async (req, res) => {
    try {
        const userMessage = req.body.message;
        let context = "";

        // Busca informações do proprietário no Firestore
        const infoSnapshot = await db.collection('informacoes_proprietario').get();
        if (!infoSnapshot.empty) {
            context += "Use as seguintes informações de contexto para responder:\n";
            infoSnapshot.forEach(doc => {
                const data = doc.data();
                context += `- ${data.chave}: ${data.valor}\n`;
            });
            context += "---\n";
        }

        const prompt = `
            ${context}
            Pergunta do usuário: "${userMessage}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const botReply = response.text();

        // Salva a interação no banco de dados
        await db.collection('dialogos_aprendidos').add({
            pergunta: userMessage,
            resposta: botReply,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ reply: botReply });

    } catch (error) {
        console.error("ERRO NA FUNÇÃO DA API:", error);
        res.status(500).json({ error: "Ocorreu um erro interno no servidor." });
    }
});

// Exporta o app para a Vercel usar. A Vercel cuidará do app.listen.
module.exports = app;