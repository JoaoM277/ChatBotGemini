document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');

    // Navegação pelas abas
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            menuItems.forEach(link => link.classList.remove('active'));
            item.classList.add('active');

            const targetId = item.getAttribute('href').substring(1);
            pages.forEach(page => {
                if (page.id === targetId) {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });
        });
    });

    // Lógica do Chatbot
    const sendMessage = async () => {
        const messageText = userInput.value.trim();
        if (messageText === '') return;

        // Adiciona a mensagem do usuário à janela do chat
        addMessage(messageText, 'user-message');
        userInput.value = '';
        
        try {
            // Envia a mensagem para o seu backend
            const response = await fetch('/api/server', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: messageText }),
            });

            if (!response.ok) {
                throw new Error('Falha na comunicação com o servidor.');
            }

            const data = await response.json();
            const botReply = data.reply;

            // Adiciona a resposta do bot à janela do chat
            addMessage(botReply, 'bot-message');

        } catch (error) {
            console.error('Erro:', error);
            addMessage('Desculpe, estou com problemas para me conectar. Tente novamente mais tarde.', 'bot-message');
        }
    };

    function addMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Rola para a última mensagem
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

// Função para abrir/fechar o chat
function toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    const chatIcon = document.getElementById('chat-toggle-icon');
    if (chatWindow.style.display === 'none' || chatWindow.style.display === '') {
        chatWindow.style.display = 'flex';
        chatIcon.textContent = '-';
    } else {
        chatWindow.style.display = 'none';
        chatIcon.textContent = '+';
    }
}