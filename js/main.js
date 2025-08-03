// Main initialization and event handlers

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  renderQuickActions();
  renderChatHistory();
  fetchNews();
  document.getElementById('chat-input').focus();
});

// Main form submission handler
document.getElementById('chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const text = input.value.trim();

  if (!text) return;

  if (!validateMessageLength(text)) {
    showError(`Message must be between 1 and ${CONFIG.MAX_MESSAGE_LENGTH} characters.`);
    return;
  }

  // Check for instant rate response first
  const rateResponse = detectRateQuestion(text);
  if (rateResponse && INSTANT_RATE_RESPONSES[rateResponse]) {
    // Add user message
    chatMessages.push({ sender: "user", text: text });
    
    // Add instant rate response
    addInstantBotResponse(INSTANT_RATE_RESPONSES[rateResponse]);
    
    input.value = "";
    return; // Don't send to AI
  }

  // Otherwise, proceed with normal AI chat
  addUserMessageToChat(text);
  input.value = "";
});

// Input validation handler
document.getElementById('chat-input').addEventListener('input', function(e) {
  const length = e.target.value.length;
  const button = document.getElementById('send-button');

  if (length > CONFIG.MAX_MESSAGE_LENGTH) {
    e.target.value = e.target.value.substring(0, CONFIG.MAX_MESSAGE_LENGTH);
  }

  button.disabled = e.target.value.trim().length === 0 || botIsLoading;
});

// Handle email summary request via prompt
function handleEmailSummaryRequest() {
  const email = prompt("Enter your email to receive the summary:");
  if (!email || !email.includes('@')) {
    alert("Invalid email.");
    return;
  }
  
  chatMessages.push({ sender: "bot", text: "Generating your summary and sending email...", streaming: false });
  renderChatHistory();
  
  // Remove loading message before calling email function
  chatMessages.pop();
  
  sendConversationSummary(email).then(() => renderChatHistory());
}

// Render quick actions
function renderQuickActions() {
  const qa = document.getElementById('quick-actions');
  if (!qa) return;
  
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
      } else if (action.text === "email summary") {
        // Handle email summary button click with prompt
        handleEmailSummaryRequest();
      } else {
        addUserMessageToChat(action.text);
      }
    };
    qa.appendChild(btn);
  });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    document.getElementById('chat-form').dispatchEvent(new Event('submit'));
  }
});
