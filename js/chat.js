// Chat functionality and state management

// Chat State
let chatMessages = [];
let botIsLoading = false;
let rateLimitWarning = false;
let waitingForEmailInput = false;

// Utility functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function validateMessageLength(text) {
  if (!CONFIG?.MAX_MESSAGE_LENGTH) return false;
  return text && text.trim().length > 0 && text.length <= CONFIG.MAX_MESSAGE_LENGTH;
}

function showError(message) {
  const ch = document.getElementById('chat-history');
  if (!ch) return;
  
  const errorDiv = document.createElement('div');
  errorDiv.className = "message-container";
  errorDiv.innerHTML = `<div class="error-message">${escapeHtml(message)}</div>`;
  ch.appendChild(errorDiv);
  ch.scrollTop = ch.scrollHeight;
}

// Simplified quick actions rendering
function renderQuickActions() {
  const qa = document.getElementById('quick-actions');
  if (!qa || !quickActions) return;
  
  qa.innerHTML = "";
  quickActions.forEach(action => {
    // Skip mobile-specific actions since we removed mobile menu complexity
    if (action.text === "mobile news") {
      return;
    }
    
    const btn = document.createElement('button');
    btn.type = "button";
    
    // Styling based on action type
    if (action.text === "email summary") {
      btn.className = "bg-green-100 text-green-800 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors text-sm font-semibold";
    } else {
      btn.className = "bg-blue-100 text-blue-900 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium";
    }
    
    btn.textContent = action.label;
    
    btn.addEventListener('click', () => {
      if (action.text === "email summary") {
        // Check if user has asked at least one question
        const userMessages = chatMessages.filter(msg => msg.sender === "user");
        if (userMessages.length === 0) {
          addInstantBotResponse("Please ask me a question about VA benefits first, then I can email you a summary of our conversation.");
          return;
        }
        
        // Handle email summary button click
        chatMessages.push({ sender: "user", text: "email summary" });
        renderChatHistory();
        addInstantBotResponse("I can email you a summary of our conversation for your records. Please enter your email address:");
        waitingForEmailInput = true;
        const chatInput = document.getElementById('chat-input');
        if (chatInput) chatInput.focus();
      } else {
        // All other actions go directly to AI chat
        addUserMessageToChat(action.text);
      }
    });
    qa.appendChild(btn);
  });
}

// Question counter with magic number fix
function updateQuestionCounter() {
  const userMessageCount = chatMessages.filter(msg => msg.sender === "user").length;
  const questionsLeft = CONFIG.MAX_QUESTIONS - userMessageCount;
  const questionsLeftElement = document.getElementById('questions-left');
  if (!questionsLeftElement) return;
  
  questionsLeftElement.textContent = questionsLeft;
  
  // Change color as questions run out
  const counterElement = document.getElementById('question-counter');
  if (!counterElement) return;
  
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

// Chat history rendering with scroll fix
function renderChatHistory() {
  const ch = document.getElementById('chat-history');
  if (!ch) return;
  
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
  // Fixed scroll with single timeout
  setTimeout(() => {
    ch.scrollTop = ch.scrollHeight;
  }, 30);
}

// API integration with improved error handling
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

    // Rate limiting with retry logic
    if (response.status === 429) {
      if (!rateLimitWarning) {
        rateLimitWarning = true;
        setTimeout(() => { rateLimitWarning = false; }, 60000);
        // One retry after 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
        return getBotReply();
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

    // Improved response validation
    if (!data?.candidates?.length) {
      throw new Error("Empty response from AI.");
    }

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

// Main chat functions
function addUserMessageToChat(text) {
  const trimmedText = text.trim();

  if (!validateMessageLength(trimmedText)) {
    showError(`Message must be between 1 and ${CONFIG.MAX_MESSAGE_LENGTH} characters.`);
    return;
  }

  // Check conversation length using CONFIG constant
  const userMessageCount = chatMessages.filter(msg => msg.sender === "user").length;
  if (userMessageCount >= CONFIG.MAX_QUESTIONS) {
    showError(`That was your ${CONFIG.MAX_QUESTIONS}th question. You can email yourself a summary or refresh to start a new conversation.`);
    return;
  }

  if (botIsLoading) {
    showError('Please wait for the current response to finish.');
    return;
  }

  chatMessages.push({ sender: "user", text: trimmedText });
  
  // Hide welcome message after first message (works on all screen sizes)
  if (userMessageCount === 0) {
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) welcomeMessage.style.display = 'none';
  }
  
  updateQuestionCounter();
  renderChatHistory();
  addBotReplyToChat();
}

async function addBotReplyToChat() {
  botIsLoading = true;
  const sendButton = document.getElementById('send-button');
  const chatInput = document.getElementById('chat-input');

  if (sendButton) sendButton.disabled = true;
  if (chatInput) chatInput.disabled = true;

  renderChatHistory();

  const botReply = await getBotReply();

  botIsLoading = false;
  if (sendButton) sendButton.disabled = false;
  if (chatInput) {
    chatInput.disabled = false;
    chatInput.focus();
  }

  chatMessages.push({ sender: "bot", text: botReply });
  renderChatHistory();
}
