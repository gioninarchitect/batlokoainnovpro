/**
 * Smart AI Chat Widget - fig3.online
 * Embeddable version - add to any website with a single script tag
 *
 * Usage: <script src="embed.js"></script>
 */

(function() {
    'use strict';

    // Inject styles
    const styles = `
        /* fig3.online Design System */
        .fig3-chat-bubble {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 60px;
            height: 60px;
            background: #0099FF;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 20px rgba(0, 153, 255, 0.4);
            transition: all 0.3s ease;
            z-index: 9999;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .fig3-chat-bubble:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 30px rgba(0, 153, 255, 0.5);
        }
        .fig3-chat-bubble svg {
            width: 28px;
            height: 28px;
            fill: white;
        }
        .fig3-chat-bubble .notification {
            position: absolute;
            top: -4px;
            right: -4px;
            width: 20px;
            height: 20px;
            background: #ff9800;
            border-radius: 50%;
            font-size: 12px;
            font-weight: 600;
            display: none;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .fig3-chat-container {
            position: fixed;
            bottom: 100px;
            right: 24px;
            width: 380px;
            max-height: 550px;
            background: #0F1419;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
            display: none;
            flex-direction: column;
            overflow: hidden;
            z-index: 9998;
            border: 1px solid rgba(255, 255, 255, 0.1);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .fig3-chat-container.open {
            display: flex;
            animation: fig3SlideUp 0.3s ease;
        }
        @keyframes fig3SlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .fig3-chat-header {
            background: #1a2633;
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .fig3-chat-header-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .fig3-chat-avatar {
            width: 40px;
            height: 40px;
            background: #0099FF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .fig3-chat-avatar svg {
            width: 20px;
            height: 20px;
            fill: white;
        }
        .fig3-chat-title {
            font-weight: 600;
            color: #ffffff;
            font-size: 15px;
        }
        .fig3-chat-status {
            font-size: 12px;
            color: #4caf50;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .fig3-chat-status::before {
            content: "";
            width: 8px;
            height: 8px;
            background: #4caf50;
            border-radius: 50%;
        }
        .fig3-chat-close {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            transition: all 0.2s;
        }
        .fig3-chat-close:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
        }
        .fig3-chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            max-height: 320px;
        }
        .fig3-message {
            max-width: 85%;
            padding: 12px 16px;
            border-radius: 16px;
            font-size: 15px;
            line-height: 1.5;
        }
        .fig3-message.bot {
            background: #1a2633;
            color: #ffffff;
            border-bottom-left-radius: 4px;
            align-self: flex-start;
        }
        .fig3-message.user {
            background: #0099FF;
            color: white;
            border-bottom-right-radius: 4px;
            align-self: flex-end;
        }
        .fig3-typing {
            display: flex;
            gap: 4px;
            padding: 12px 16px;
            background: #1a2633;
            border-radius: 16px;
            border-bottom-left-radius: 4px;
            align-self: flex-start;
        }
        .fig3-typing span {
            width: 8px;
            height: 8px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            animation: fig3Typing 1.4s infinite ease-in-out;
        }
        .fig3-typing span:nth-child(2) { animation-delay: 0.2s; }
        .fig3-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes fig3Typing {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-6px); }
        }
        .fig3-quick-actions {
            padding: 12px 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .fig3-quick-btn {
            background: #1a2633;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #ffffff;
            padding: 8px 14px;
            border-radius: 20px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .fig3-quick-btn:hover {
            background: #0099FF;
            border-color: #0099FF;
        }
        .fig3-chat-input-container {
            padding: 16px 20px;
            background: #1a2633;
            display: flex;
            gap: 12px;
            align-items: center;
        }
        .fig3-chat-input {
            flex: 1;
            background: #0F1419;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 12px 20px;
            color: #ffffff;
            font-size: 15px;
            outline: none;
            transition: border-color 0.2s;
        }
        .fig3-chat-input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }
        .fig3-chat-input:focus {
            border-color: #0099FF;
        }
        .fig3-chat-send {
            width: 44px;
            height: 44px;
            background: #0099FF;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        .fig3-chat-send:hover {
            background: #007acc;
            transform: scale(1.05);
        }
        .fig3-chat-send svg {
            width: 20px;
            height: 20px;
            fill: white;
        }
        .fig3-powered {
            padding: 8px;
            text-align: center;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .fig3-powered a {
            color: #0099FF;
            text-decoration: none;
        }
        @media (max-width: 480px) {
            .fig3-chat-container {
                right: 0;
                bottom: 0;
                width: 100%;
                max-height: 100%;
                height: 100%;
                border-radius: 0;
            }
            .fig3-chat-bubble {
                bottom: 16px;
                right: 16px;
            }
        }
    `;

    // Inject CSS
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // Create widget HTML
    const widgetHTML = `
        <div class="fig3-chat-bubble" id="fig3ChatBubble">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
            <div class="notification" id="fig3Notification">1</div>
        </div>
        <div class="fig3-chat-container" id="fig3ChatContainer">
            <div class="fig3-chat-header">
                <div class="fig3-chat-header-info">
                    <div class="fig3-chat-avatar">
                        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    </div>
                    <div>
                        <div class="fig3-chat-title">Smart Assistant</div>
                        <div class="fig3-chat-status">Online</div>
                    </div>
                </div>
                <button class="fig3-chat-close" id="fig3ChatClose">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="fig3-chat-messages" id="fig3ChatMessages">
                <div class="fig3-message bot">Welcome! I'm your Smart Assistant. I can help with product info, pricing, and compliance questions. How can I assist you today?</div>
            </div>
            <div class="fig3-quick-actions" id="fig3QuickActions">
                <button class="fig3-quick-btn" data-message="Show me products">Products</button>
                <button class="fig3-quick-btn" data-message="Get a quote">Get Quote</button>
                <button class="fig3-quick-btn" data-message="Check compliance">Compliance</button>
                <button class="fig3-quick-btn" data-message="Contact sales">Contact</button>
            </div>
            <div class="fig3-chat-input-container">
                <input type="text" class="fig3-chat-input" id="fig3ChatInput" placeholder="Type your message...">
                <button class="fig3-chat-send" id="fig3ChatSend">
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </div>
            <div class="fig3-powered">Powered by <a href="https://fig3.online" target="_blank">fig3.online</a></div>
        </div>
    `;

    // Inject widget
    const container = document.createElement('div');
    container.innerHTML = widgetHTML;
    document.body.appendChild(container);

    // Pattern matching knowledge base
    const patterns = {
        greeting: {
            regex: /^(hi|hello|hey|good\s*(morning|afternoon|evening)|howzit|sawubona|goeie\s*dag)/i,
            responses: [
                "Hello! How can I help you today?",
                "Hi there! What can I assist you with?",
                "Welcome! I'm here to help with products, pricing, or compliance questions."
            ]
        },
        products: {
            regex: /(product|item|stock|inventory|what.*sell|show.*products)/i,
            responses: [
                "We offer a wide range of industrial products including PPE, safety equipment, tools, and more. Would you like me to help you find something specific?",
                "Our product catalog includes safety gear, industrial tools, and equipment. What category are you interested in?"
            ]
        },
        pricing: {
            regex: /(price|cost|how much|quote|pricing|rate)/i,
            responses: [
                "I can help with pricing! For accurate quotes, I'll need to know which products you're interested in and the quantity. What are you looking for?",
                "Our pricing depends on quantity and delivery requirements. Tell me what you need and I'll get you a quote."
            ]
        },
        compliance: {
            regex: /(compliance|sans|ohsa|safety\s*standard|regulation|certificate|dmr)/i,
            responses: [
                "We take compliance seriously. Our products meet SANS, OHSA, and DMR standards where applicable. Which specific compliance requirements do you need information about?",
                "All our safety products are compliant with South African regulations including SANS and OHSA standards. Need details on a specific product?"
            ]
        },
        contact: {
            regex: /(contact|call|email|phone|speak.*human|sales\s*team)/i,
            responses: [
                "You can reach our sales team at hello@fig3.online or WhatsApp us at +27 79 406 8239. We're happy to help!",
                "Our team is available via email (hello@fig3.online) or WhatsApp (+27 79 406 8239). Would you like me to arrange a callback?"
            ]
        },
        delivery: {
            regex: /(deliver|shipping|courier|how\s*long|lead\s*time)/i,
            responses: [
                "We deliver nationwide! Standard delivery is 3-5 business days in Gauteng, 5-7 days to other provinces. Express options available.",
                "Delivery times vary by location. Gauteng: 3-5 days, Other provinces: 5-7 days. Need a specific delivery quote?"
            ]
        },
        thanks: {
            regex: /(thank|cheers|appreciate|awesome|great)/i,
            responses: [
                "You're welcome! Is there anything else I can help with?",
                "Happy to help! Let me know if you need anything else."
            ]
        },
        fallback: {
            responses: [
                "I understand you're asking about something specific. Could you tell me more, or would you like to speak with our sales team?",
                "Let me connect you with someone who can help better. Would you like to contact our team directly?",
                "I want to make sure I help you correctly. Could you rephrase that, or shall I get a team member to assist?"
            ]
        }
    };

    // Widget functionality
    const bubble = document.getElementById('fig3ChatBubble');
    const chatContainer = document.getElementById('fig3ChatContainer');
    const closeBtn = document.getElementById('fig3ChatClose');
    const input = document.getElementById('fig3ChatInput');
    const sendBtn = document.getElementById('fig3ChatSend');
    const messages = document.getElementById('fig3ChatMessages');
    const quickActions = document.getElementById('fig3QuickActions');
    const notification = document.getElementById('fig3Notification');

    bubble.addEventListener('click', function() {
        chatContainer.classList.toggle('open');
        notification.style.display = 'none';
        if (chatContainer.classList.contains('open')) {
            input.focus();
        }
    });

    closeBtn.addEventListener('click', function() {
        chatContainer.classList.remove('open');
    });

    quickActions.addEventListener('click', function(e) {
        if (e.target.classList.contains('fig3-quick-btn')) {
            sendMessage(e.target.dataset.message);
        }
    });

    function sendMessage(text) {
        if (!text.trim()) return;
        addMessage(text, 'user');
        input.value = '';
        showTyping();
        setTimeout(function() {
            hideTyping();
            addMessage(getResponse(text), 'bot');
        }, 800 + Math.random() * 700);
    }

    function addMessage(text, type) {
        const msg = document.createElement('div');
        msg.className = 'fig3-message ' + type;
        msg.textContent = text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
        const typing = document.createElement('div');
        typing.className = 'fig3-typing';
        typing.id = 'fig3TypingIndicator';
        typing.innerHTML = '<span></span><span></span><span></span>';
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
        const typing = document.getElementById('fig3TypingIndicator');
        if (typing) typing.remove();
    }

    function getResponse(text) {
        for (var key in patterns) {
            if (key === 'fallback') continue;
            if (patterns[key].regex && patterns[key].regex.test(text)) {
                var responses = patterns[key].responses;
                return responses[Math.floor(Math.random() * responses.length)];
            }
        }
        var fallback = patterns.fallback.responses;
        return fallback[Math.floor(Math.random() * fallback.length)];
    }

    sendBtn.addEventListener('click', function() { sendMessage(input.value); });
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage(input.value);
    });

    setTimeout(function() {
        if (!chatContainer.classList.contains('open')) {
            notification.style.display = 'flex';
        }
    }, 5000);

})();
