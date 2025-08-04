// Chat functionality and state management

// Chat State
let chatMessages = [];
let botIsLoading = false;
let rateLimitWarning = false;
let waitingForEmailInput = false;

// NEW: Auto-resizing textarea functionality
function setupAutoResize() {
  const textarea = document.getElementById('chat-input');
  if (!textarea) return;

  function resizeTextarea() {
    // Reset height to get accurate scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height within constraints
    const minHeight = 44; // Minimum touch target
    const maxHeight = window.innerWidth < 768 ? 100 : 120; // Mobile vs desktop
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    
    textarea.style.height = newHeight + 'px';
  }

  textarea.addEventListener('input', function() {
    resizeTextarea();
    updateCharacterCounter();
  });

  // Handle paste events
  textarea.addEventListener('paste', function() {
    setTimeout(() => {
      resizeTextarea();
      updateCharacterCounter();
    }, 0);
  });

  // Reset height when form is submitted
  window.resetTextareaHeight = function() {
    textarea.style.height = 'auto';
    textarea.style.height = '44px';
  };
}

// NEW: Character counter functionality
function updateCharacterCounter() {
  const textarea = document.getElementById('chat-input');
  const charCount = document.getElementById('char-count');
  const charLimit = document.getElementById('char-limit');
  const counter = document.getElementById('char-counter');
  const sendButton = document.getElementById('send-button');
  
  if (!textarea || !charCount || !charLimit || !counter) return;

  const currentLength = textarea.value.length;
  const maxLength = CONFIG.MAX_MESSAGE_LENGTH;
  
  charCount.textContent = currentLength;
  charLimit.textContent = maxLength;
  
  // Update counter styling based on character count
  counter.classList.remove('warning', 'danger');
  
  if (currentLength > maxLength * 0.9) {
    counter.classList.add('danger');
  } else if (currentLength > maxLength * 0.8) {
    counter.classList.add('warning');
  }
  
  // Update send button state
  if (sendButton) {
    const isEmpty = textarea.value.trim().length === 0;
    const isOverLimit = currentLength > maxLength;
    sendButton.disabled = isEmpty || window.botIsLoading || isOverLimit;
  }
}

// NEW: Scroll to bottom functionality
function setupScrollToBottom() {
  const chatHistory = document.getElementById('chat-history');
  const scrollButton = document.getElementById('scroll-to-bottom');
  
  if (!chatHistory || !scrollButton) return;

  // Monitor scroll position
  chatHistory.addEventListener('scroll', function() {
    const isAtBottom = this.scrollTop + this.clientHeight >= this.scrollHeight - 10;
    
    if (isAtBottom) {
      scrollButton.classList.remove('visible');
    } else {
      scrollButton.classList.add('visible');
    }
  });

  // Scroll to bottom when button is clicked
  scrollButton.addEventListener('click', function() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
  });
}

// Simple auto-scroll function
window.autoScrollToBottom = function() {
  const chatHistory = document.getElementById('chat-history');
  if (chatHistory) {
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
};

// NEW: Enhanced loading states
function setLoadingState(loading) {
  const sendButton = document.getElementById('send-button');
  const sendButtonText = document.getElementById('send-button-text');
  const sendButtonSpinner = document.getElementById('send-button-spinner');
  const chatInput = document.getElementById('chat-input');
  const loadingOverlay = document.getElementById('input-loading-overlay');
  
  botIsLoading = loading;
  window.botIsLoading = loading; // Make it globally accessible
  
  if (loading) {
    // Disable input
    if (chatInput) {
      chatInput.disabled = true;
      chatInput.classList.add('input-disabled');
    }
    
    // Show loading overlay
    if (loadingOverlay) {
      loadingOverlay.classList.remove('hidden');
    }
    
    // Update send button
    if (sendButton) {
      sendButton.disabled = true;
      sendButton.classList.add('send-button-loading');
    }
    if (sendButtonText) {
      sendButtonText.classList.add('hidden');
    }
    if (sendButtonSpinner) {
      sendButtonSpinner.classList.remove('hidden');
    }
  } else {
    // Enable input
    if (chatInput) {
      chatInput.disabled = false;
      chatInput.classList.remove('input-disabled');
    }
    
    // Hide loading overlay
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
    
    // Update send button
    if (sendButton) {
      sendButton.classList.remove('send-button-loading');
    }
    if (sendButtonText) {
      sendButtonText.classList.remove('hidden');
    }
    if (sendButtonSpinner) {
      sendButtonSpinner.classList.add('hidden');
    }
    
    // Re-focus input
    if (chatInput) {
      chatInput.focus();
    }
    
    // Update send button state based on input
    updateCharacterCounter();
  }
}

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
  if (!ch) return;
  
  const errorDiv = document.createElement('div');
  errorDiv.className = "message-container";
  errorDiv.innerHTML = `<div class="error-message">${escapeHtml(message)}</div>`;
  ch.appendChild(errorDiv);
  window.autoScrollToBottom(); // NEW: Use new scroll function
}

// Quick actions rendering
function renderQuickActions() {
  const qa = document.getElementById('quick-actions');
  if (!qa) return;
  
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
    
    btn.onclick = () => {
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
    };
    qa.appendChild(btn);
  });
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
  // NEW: Enhanced loading spinner with typing indicator
  if (botIsLoading) {
    const spinnerDiv = document.createElement('div');
    spinnerDiv.className = "message-container flex justify-start";
    spinnerDiv.innerHTML = `
      <div class="chat-bubble-bot">
        <div class="typing-indicator">
          <span class="text-gray-600">VetDesk is thinking</span>
          <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </div>`;
    ch.appendChild(spinnerDiv);
  }
  // NEW: Use enhanced scroll function
  window.autoScrollToBottom();
}

// Streaming effect (optional - not currently used but kept for future use)
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
      body: JSON.stringify({ 
        chatHistory: history,
        systemPrompt: SYSTEM_PROMPT
      })
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

// Main chat functions
function addUserMessageToChat(text) {
  const trimmedText = text.trim();

  if (!validateMessageLength(trimmedText)) {
    showError(`Message must be between 1 and ${CONFIG.MAX_MESSAGE_LENGTH} characters.`);
    return;
  }

  if (botIsLoading) {
    showError('Please wait for the current response to finish.');
    return;
  }

  // Hide welcome message after first message (works on all screen sizes)
  const userMessageCount = chatMessages.filter(msg => msg.sender === "user").length;
  if (userMessageCount === 0) {
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) welcomeMessage.style.display = 'none';
  }

  chatMessages.push({ sender: "user", text: trimmedText });
  
  renderChatHistory();
  addBotReplyToChat();
}

async function addBotReplyToChat() {
  setLoadingState(true); // NEW: Use enhanced loading state
  renderChatHistory();

  const botReply = await getBotReply();

  setLoadingState(false); // NEW: Use enhanced loading state
  chatMessages.push({ sender: "bot", text: botReply });
  renderChatHistory();
}
