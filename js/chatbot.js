(function () {
  // Prevent duplicate initialization
  if (window.CredifyChatbotInitialized) return;
  window.CredifyChatbotInitialized = true;

  // Add supporting CSS styles for animations and layout resilience
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    @keyframes credify-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    @keyframes credify-pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 168, 89, 0.4); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(0, 168, 89, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 168, 89, 0); }
    }
    @keyframes credify-fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .credify-chatbot-container {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .credify-chat-bubble-user {
      background-color: #002e5b; /* primary color */
      color: #ffffff;
      border-radius: 16px 16px 4px 16px;
      align-self: flex-end;
    }
    .credify-chat-bubble-bot {
      background-color: #f1f5f9;
      color: #1e293b;
      border-radius: 16px 16px 16px 4px;
      align-self: flex-start;
      border: 1px solid #e2e8f0;
    }
    .credify-launcher-pulse {
      animation: credify-pulse 2s infinite;
    }
    .credify-dot-bounce {
      animation: credify-bounce 1.4s infinite ease-in-out both;
    }
    .credify-dot-bounce:nth-child(1) { animation-delay: -0.32s; }
    .credify-dot-bounce:nth-child(2) { animation-delay: -0.16s; }
  `;
  document.head.appendChild(styleEl);

  // Constants
  const STORAGE_KEY = 'credify_chat_history_v1';
  const IS_OPEN_KEY = 'credify_chat_is_open_v1';

  // State
  let messages = [];
  let isOpen = false;

  // Load state from sessionStorage (preserves chat across page navigations)
  function loadState() {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        messages = JSON.parse(stored);
      } else {
        // Default initial welcome message
        messages = [
          {
            role: 'model',
            text: 'Hello! I am your **Credify Capital Assistant**. 🙋‍♂️ How can I help you today?\n\nYou can ask me about our loan offerings, eligibility, interest rates, documentation, or let me guide you to our EMI calculators!'
          }
        ];
      }
      isOpen = sessionStorage.getItem(IS_OPEN_KEY) === 'true';
    } catch (e) {
      console.error('Chatbot: failed to load state', e);
    }
  }

  // Save state to sessionStorage
  function saveState() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      sessionStorage.setItem(IS_OPEN_KEY, String(isOpen));
    } catch (e) {
      console.error('Chatbot: failed to save state', e);
    }
  }

  // Create UI Elements
  const chatbotWrapper = document.createElement('div');
  chatbotWrapper.id = 'credify-chatbot-root';
  chatbotWrapper.className = 'fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4';
  document.body.appendChild(chatbotWrapper);

  // Launcher Button
  const launcher = document.createElement('button');
  launcher.id = 'credify-chat-launcher';
  launcher.className = 'w-14 h-14 rounded-full bg-[#00a859] hover:bg-[#00904c] text-white flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none credify-launcher-pulse';
  launcher.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  `;
  chatbotWrapper.appendChild(launcher);

  // Chat Window Container
  const chatWindow = document.createElement('div');
  chatWindow.id = 'credify-chat-window';
  chatWindow.className = 'credify-chatbot-container w-[360px] h-[480px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 hidden';
  chatWindow.style.transformOrigin = 'bottom right';
  chatbotWrapper.appendChild(chatWindow);

  // Build Header
  const header = document.createElement('div');
  header.className = 'bg-[#002e5b] text-white px-4 py-3 flex items-center justify-between shadow-sm';
  header.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm text-white border border-white/20">
        CC
        <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00a859] border-2 border-[#002e5b]"></span>
      </div>
      <div>
        <h4 class="text-xs font-bold leading-none mb-0.5">Credify Support AI</h4>
        <p class="text-[10px] text-[#00a859] font-medium leading-none">Online &bull; Ready to help</p>
      </div>
    </div>
    <button id="credify-chat-close" class="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 focus:outline-none">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
  `;
  chatWindow.appendChild(header);

  // Messages Area
  const messagesArea = document.createElement('div');
  messagesArea.className = 'flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 flex flex-col';
  chatWindow.appendChild(messagesArea);

  // Footer / Input Area
  const footer = document.createElement('form');
  footer.className = 'border-t p-3 bg-white flex items-center gap-2';
  footer.innerHTML = `
    <input type="text" id="credify-chat-input" placeholder="Type a message..." class="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002e5b]/40 focus:border-[#002e5b] bg-gray-50/50" required autocomplete="off">
    <button type="submit" id="credify-chat-send" class="bg-[#002e5b] hover:bg-[#001f3f] text-white rounded-xl p-2 flex items-center justify-center transition-all duration-150 transform active:scale-95 focus:outline-none">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
      </svg>
    </button>
  `;
  chatWindow.appendChild(footer);

  // Powered By footer text
  const poweredBy = document.createElement('div');
  poweredBy.className = 'bg-gray-50 px-4 py-1.5 border-t border-gray-100 text-center text-[9px] text-gray-400 font-medium tracking-wide';
  poweredBy.innerHTML = '⚡ Powered by Gemini 3.5 AI';
  chatWindow.appendChild(poweredBy);

  // Toggle Chat View
  function toggleChat() {
    isOpen = !isOpen;
    saveState();
    updateView();
  }

  function updateView() {
    if (isOpen) {
      chatWindow.classList.remove('hidden');
      chatWindow.style.animation = 'credify-fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      launcher.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      `;
      // Auto focus input
      setTimeout(() => document.getElementById('credify-chat-input')?.focus(), 100);
      scrollToBottom();
    } else {
      chatWindow.classList.add('hidden');
      launcher.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
      `;
    }
  }

  // Format Helper to render simple markdown links, bolds, and list bullets
  function formatMessageText(text) {
    if (!text) return '';
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold replacement
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Bullet list formatting
    formatted = formatted.replace(/^\s*[-*]\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>');

    // Link/URL formatting
    formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-emerald-600 font-semibold underline hover:text-emerald-700">$1</a>');
    
    // Relative link conversion e.g. /calculator.html
    formatted = formatted.replace(/(?:\s|^)(\/[a-zA-Z0-9_-]+\.html)/g, ' <a href="$1" class="text-emerald-600 font-semibold underline hover:text-emerald-700">$1</a>');

    return formatted;
  }

  // Render Messages
  function renderMessages() {
    messagesArea.innerHTML = '';
    messages.forEach((msg) => {
      const bubble = document.createElement('div');
      bubble.className = `max-w-[80%] p-3 text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${
        msg.role === 'user' ? 'credify-chat-bubble-user animate-none' : 'credify-chat-bubble-bot'
      }`;
      bubble.style.animation = 'credify-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      bubble.innerHTML = formatMessageText(msg.text);
      messagesArea.appendChild(bubble);
    });
    scrollToBottom();
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }, 50);
  }

  // Add Typing Indicator
  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'credify-chat-typing';
    indicator.className = 'credify-chat-bubble-bot max-w-[60px] p-3 text-sm shadow-sm flex items-center justify-center gap-1 self-start';
    indicator.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-full bg-gray-500 credify-dot-bounce"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-gray-500 credify-dot-bounce"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-gray-500 credify-dot-bounce"></span>
    `;
    messagesArea.appendChild(indicator);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('credify-chat-typing');
    if (indicator) indicator.remove();
  }

  // Handle Send Message
  async function handleSend(e) {
    e.preventDefault();
    const input = document.getElementById('credify-chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';

    // Append User Message
    messages.push({ role: 'user', text });
    renderMessages();
    saveState();

    // Show Typing
    showTypingIndicator();

    try {
      // API request to server-side Gemini Proxy
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(0, -1) // Send context, skip current message
        })
      });

      const data = await response.json();
      removeTypingIndicator();

      if (response.ok && data.text) {
        messages.push({ role: 'model', text: data.text });
      } else {
        messages.push({
          role: 'model',
          text: 'Sorry, I am having trouble connecting to my brain right now. 🧠 Please feel free to try again or contact us directly at **+91 9931372218**!'
        });
      }
    } catch (err) {
      console.error('Chatbot request failed', err);
      removeTypingIndicator();
      messages.push({
        role: 'model',
        text: 'Oops! A network connection error occurred. 🌐 Please check your connection and try again.'
      });
    }

    renderMessages();
    saveState();
  }

  // Event Listeners
  launcher.addEventListener('click', toggleChat);
  document.getElementById('credify-chat-close').addEventListener('click', toggleChat);
  footer.addEventListener('submit', handleSend);

  // Initialize
  loadState();
  renderMessages();
  updateView();
})();
