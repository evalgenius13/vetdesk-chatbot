// Chat functions
function addUserMessageToChat(text) {
  const trimmedText = text.trim();

  if (!validateMessageLength(trimmedText)) {
    showError(`Message must be between 1 and ${CONFIG.MAX_MESSAGE_LENGTH} characters.`);
    return;
  }

  // Check conversation length - count user messages only
  const userMessageCount = chatMessages.filter(msg => msg.sender === "user").length;
  if (userMessageCount >= 12) {
    showError('That was your 12th question. You can email yourself a summary or refresh to start a new conversation.');
    return;
  }

  if (botIsLoading) {
    showError('Please wait for the current response to finish.');
    return;
  }

  chatMessages.push({ sender: "user", text: trimmedText });
  
  // Hide welcome message and quick actions on mobile after first message, add toggle
  if (window.innerWidth <= 768 && userMessageCount === 0) {
    const welcomeMessage = document.getElementById('welcome-message');
    const quickActions = document.getElementById('quick-actions');
    
    if (welcomeMessage) welcomeMessage.style.display = 'none';
    if (quickActions) {
      quickActions.style.display = 'none';
      
      // Add quick actions toggle button
      const toggleButton = document.createElement// Chat functionality and state management

// Chat State
let chatMessages = [];
let botIsLoading = false;
let rateLimitWarning = false;

// Utility functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function validateMessageLength(text) {
  return text && text.trim().length > 0 && text.length <= CONFIG.MAX_MESSAGE_LENGTH;
}

function showError(message) {
  const ch = document.getElementById('chat-history');
  const errorDiv = document.createElement('div');
  errorDiv.className = "message-container";
  errorDiv.innerHTML = `<div class="error-message">${escapeHtml(message)}</div>`;
  ch.appendChild(errorDiv);
  ch.scrollTop = ch.scrollHeight;
}

// Rate detection
function detectRateQuestion(message) {
  const msg = message.toLowerCase();
  
  // Must contain rate-related keywords
  const rateKeywords = ['how much', 'rate', 'payment', 'compensation', 'amount', 'pay', 'money', 'receive', 'get paid'];
  const hasRateKeyword = rateKeywords.some(keyword => msg.includes(keyword));
  
  // Exclude complex scenarios - if it mentions these terms, send to AI instead
  const complexKeywords = ['reduce', 'surgery', 'repair', 'increase', 'appeal', 'exam', 'c&p', 'rating', 'condition', 'cut', 'lower', 'lose', 'decrease', 'change', 'affect', 'impact', 'medical', 'doctor', 'treatment'];
  const isComplex = complexKeywords.some(keyword => msg.includes(keyword));
  
  // If no rate keywords or if it's a complex question, don't trigger instant response
  if (!hasRateKeyword || isComplex) {
    return null;
  }
  
  // Look for specific percentages in simple rate queries only
  const percentMatches = [
    msg.match(/(\d{1,3})%/),  // "70%"
    msg.match(/(\d{1,3})\s*percent/), // "70 percent"
    msg.match(/\b(\d{1,3})\b/), // "what about 70"
  ];
  
  for (const match of percentMatches) {
    if (match && match[1]) {
      const num = parseInt(match[1]);
      if (num >= 10 && num <= 100 && num % 10 === 0) {
        return num.toString();
      }
    }
  }
  
  // Word-based percentages
  const wordMatch = msg.match(/\b(ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|one hundred|hundred)\b/);
  if (wordMatch) {
    const wordToNum = {
      'ten': '10', 'twenty': '20', 'thirty': '30', 'forty': '40', 'fifty': '50',
      'sixty': '60', 'seventy': '70', 'eighty': '80', 'ninety': '90', 
      'hundred': '100', 'one hundred': '100'
    };
    const percentage = wordToNum[wordMatch[1]];
    if (percentage) return percentage;
  }
  
  // General rate inquiry (only if simple)
  if ((msg.includes('rates') || msg.includes('compensation')) && !isComplex) {
    return 'general';
  }
  
  return null;
}

// Quick actions
function renderQuickActions() {
  const qa = document.getElementById('quick-actions');
  qa.innerHTML = "";
  quickActions.forEach(action => {
    const btn = document.createElement('button');
    btn.type = "button";
    btn.className = "bg-blue-100 text-blue-900 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium";
    btn.textContent = action.label;
    btn.onclick = () => {
      // Check if it's the rates quick action
      if (action.text === "What are the current VA disability compensation rates?") {
        chatMessages.push({ sender: "user", text: action.text });
        renderChatHistory();
        addInstantBotResponse(INSTANT_RATE_RESPONSES["general"]);
      } else {
        addUserMessageToChat(action.text);
      }
    };
    qa.appendChild(btn);
  });
}

// Question counter
function updateQuestionCounter() {
  const userMessageCount = chatMessages.filter(msg => msg.sender === "user").length;
  const questionsLeft = 12 - userMessageCount;
  document.getElementById('questions-left').textContent = questionsLeft;
  
  // Change color as questions run out
  const counterElement = document.getElementById('question-counter');
  if (questionsLeft <= 3) {
    counterElement.className = 'text-xs text-red-500 mt-2';
  } else if (questionsLeft <= 6) {
    counterElement.className = 'text-xs text-orange-500 mt-2';
  } else {
    counterElement.className = 'text-xs text-gray-500 mt-2';
  }
}

// Message formatting
function formatBotMessage(text) {
  const sanitized = escapeHtml(text);
  const paragraphs = sanitized.split('\n\n').filter(p => p.trim());
  if (paragraphs.length > 1) {
    return paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
  }
  return sanitized;
}

function addInstantBotResponse(text) {
  chatMessages.push({ sender: "bot", text: text, streaming: false });
  renderChatHistory();
}

// Chat history rendering
function renderChatHistory() {
  const ch = document.getElementById('chat-history');
  ch.innerHTML = "";
  for (let i = 0; i < chatMessages.length; i++) {
    const msg = chatMessages[i];
    const messageDiv = document.createElement('div');
    messageDiv.className = "message-container";
    if (msg.sender === "user") {
      messageDiv.className += " flex justify-end";
      messageDiv.innerHTML = `<div class="chat-bubble-user">${escapeHtml(msg.text)}</div>`;
      ch.appendChild(messageDiv);
    } else if (msg.sender === "bot") {
      messageDiv.className += " flex justify-start";
      const formattedText = formatBotMessage(msg.text);
      messageDiv.innerHTML = `<div class="chat-bubble-bot">${formattedText}</div>`;
      ch.appendChild(messageDiv);
    }
  }
  // Loading spinner for pending bot reply
  if (botIsLoading) {
    const spinnerDiv = document.createElement('div');
    spinnerDiv.className = "message-container flex justify-center";
    spinnerDiv.innerHTML = `<div class="chat-bubble-bot flex items-center justify-center py-4"><div class="spinner" role="status" aria-label="Loading"></div></div>`;
    ch.appendChild(spinnerDiv);
  }
  // Robust scroll-to-bottom: immediate and after DOM paints
  ch.scrollTop = ch.scrollHeight;
  setTimeout(() => {
    ch.scrollTop = ch.scrollHeight;
  }, 0);
}

// Streaming effect
function streamBotText(text, container) {
  return new Promise(resolve => {
    const formattedText = formatBotMessage(text);
    let i = 0;
    const delay = 3;

    function typeChar() {
      if (formattedText.includes('<p>')) {
        container.innerHTML = formattedText;
        resolve();
      } else {
        container.textContent = text.slice(0, i + 1);
        i++;
        if (i < text.length) {
          setTimeout(typeChar, delay);
        } else {
          resolve();
        }
      }
    }
    typeChar();
  });
}

// API integration
async function getBotReply() {
  try {
    if (chatMessages.length > CONFIG.MAX_CONVERSATION_LENGTH) {
      throw new Error('Conversation too long. Please start a new conversation.');
    }

    const history = chatMessages.map(m => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.FRONTEND_SECRET}`
      },
      body: JSON.stringify({ chatHistory: history })
    });

    if (response.status === 429) {
      if (!rateLimitWarning) {
        rateLimitWarning = true;
        setTimeout(() => { rateLimitWarning = false; }, 60000);
      }
      throw new Error('Too many requests. Please wait a moment before trying again.');
    }

    if (response.status === 401) {
      throw new Error('Authentication failed. Please refresh the page.');
    }

    if (!response.ok) {
      throw new Error(`Server error (${response.status}). Please try again later.`);
    }

    const data = await response.json();

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't get an answer right now."
    );
  } catch (e) {
    console.error('API Error:', e);

    if (e.message.includes('fetch')) {
      return "Sorry, I'm having trouble connecting. Please check your internet connection and try again.";
    }

    return e.message || "Sorry, something went wrong. Please try again later.";
  }
}

// Chat functions
function addUserMessageToChat(text) {
  const trimmedText = text.trim();

  if (!validateMessageLength(trimmedText)) {
    showError(`Message must be between 1 and ${CONFIG.MAX_MESSAGE_LENGTH} characters.`);
    return;
  }

  // Check conversation length - count user messages only
  const userMessageCount = chatMessages.filter(msg => msg.sender === "user").length;
  if (userMessageCount >= 12) {
    showError('That was your 12th question. You can email yourself a summary or refresh to start a new conversation.');
    return;
  }

  if (botIsLoading) {
    showError('Please wait for the current response to finish.');
    return;
  }

  chatMessages.push({ sender: "user", text: trimmedText });
  
  // Hide welcome message and quick actions on mobile after first message
  if (window.innerWidth <= 768 && userMessageCount === 0) {
    const welcomeMessage = document.getElementById('welcome-message');
    const quickActions = document.getElementById('quick-actions');
    
    if (welcomeMessage) welcomeMessage.style.display = 'none';
    if (quickActions) quickActions.style.display = 'none';
  }
  
  updateQuestionCounter();
  renderChatHistory();
  addBotReplyToChat();
}text) {
  const trimmedText = text.trim();

  if (!validateMessageLength(trimmedText)) {
    showError(`Message must be between 1 and ${CONFIG.MAX_MESSAGE_LENGTH} characters.`);
    return;
  }

  // Check conversation length - count user messages only
  const userMessageCount = chatMessages.filter(msg => msg.sender === "user").length;
  if (userMessageCount >= 12) {
    showError('That was your 12th question. You can email yourself a summary or refresh to start a new conversation.');
    return;
  }

  if (botIsLoading) {
    showError('Please wait for the current response to finish.');
    return;
  }

  chatMessages.push({ sender: "user", text: trimmedText });
  updateQuestionCounter();
  renderChatHistory();
  addBotReplyToChat();
}

async function addBotReplyToChat() {
  botIsLoading = true;
  const sendButton = document.getElementById('send-button');
  const chatInput = document.getElementById('chat-input');

  sendButton.disabled = true;
  chatInput.disabled = true;

  renderChatHistory();

  const botReply = await getBotReply();

  botIsLoading = false;
  sendButton.disabled = false;
  chatInput.disabled = false;

  chatInput.focus();

  chatMessages.push({ sender: "bot", text: botReply });
  renderChatHistory();
}
