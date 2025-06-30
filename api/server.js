// Conteúdo para api/server.js - APENAS PARA TESTE DE DIAGNÓSTICO

// Esta é a forma como a Vercel lida com funções de servidor nativamente.
// Note que não estamos usando Express aqui para simplificar ao máximo.
export default function handler(request, response) {

  // Log para termos certeza ABSOLUTA de que a função foi executada.
  console.log("--- PING RECEBIDO! A FUNÇÃO FOI EXECUTADA COM SUCESSO! ---");

  // Enviamos uma resposta JSON simples.
  response.status(200).json({
    message: 'PONG! A comunicação básica com o servidor está funcionando.',
    timestamp: new Date().toISOString()
  });
}