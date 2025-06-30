const express = require('express');
const path = require('path');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- NOVA CONFIGURAÇÃO DO FIREBASE (INÍCIO) ---
const admin = require('firebase-admin');
// Carrega as credenciais que você baixou
const serviceAccount = require('./firebase-credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Pega uma referência ao nosso banco de dados Firestore
const db = admin.firestore();
// --- NOVA CONFIGURAÇÃO DO FIREBASE (FIM) ---

const app = express();
const port = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/server', async (req, res) => {
    try {
        const userMessage = req.body.message;

        // --- LÓGICA DE BANCO DE DADOS (INÍCIO) ---
        let context = ""; // Contexto inicial vazio

        // 1. Buscar informações do proprietário no Firestore
        const infoSnapshot = await db.collection('informacoes_proprietario').get();
        if (!infoSnapshot.empty) {
            context += "Aqui estão algumas informações importantes que você deve saber sobre a empresa:\n";
            infoSnapshot.forEach(doc => {
                const data = doc.data();
                // Adiciona cada informação ao contexto do prompt
                context += `- ${data.chave}: ${data.valor}\n`;
            });
        }

        // 2. Buscar diálogos aprendidos (opcional, mais avançado)
        // (Esta parte pode ser implementada depois para buscar diálogos similares)

        // --- LÓGICA DE BANCO DE DADOS (FIM) ---

        const prompt = `
            Você é um assistente virtual para um website. Seja amigável e prestativo.
            Você é capaz de entender gírias, abreviações, erros ortográficos e diferentes idiomas.
            Use as informações de contexto abaixo para responder de forma precisa.

            --- INÍCIO DO CONTEXTO ---
            ${context}
            --- FIM DO CONTEXTO ---

            Pergunta do usuário: "${userMessage}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const botReply = response.text();

        // --- SALVANDO A CONVERSA NO BANCO DE DADOS ---
        // Vamos salvar cada nova interação para análise futura
        await db.collection('dialogos_aprendidos').add({
            pergunta: userMessage,
            resposta: botReply,
            timestamp: admin.firestore.FieldValue.serverTimestamp() // Adiciona data e hora
        });
        // --- FIM DO SALVAMENTO ---

        res.json({ reply: botReply });

    } catch (error) {
        console.error("Erro no servidor ou API:", error);
        res.status(500).json({ error: "Não foi possível obter uma resposta da IA." });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});