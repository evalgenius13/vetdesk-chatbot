// Main initialization and event handlers

let waitingForEmailInput = false;

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

  // Handle email input when waiting for email
  if (waitingForEmailInput) {
    // Handle cancel first, before email validation
    if (text.toLowerCase() === "cancel") {
      chatMessages.push({ sender: "user", text: text });
      addInstantBotResponse("Email summary cancelled. How else can I help you?");
      waitingForEmailInput = false;
      input.value = "";
      return;
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(text)) {
      chatMessages.push({ sender: "user", text: text });
      renderChatHistory();
      
      // Show loading message
      chatMessages.push({ sender: "bot", text: "Generating your summary and sending email...", streaming: false });
      renderChatHistory();
      
      // Remove loading message before calling email function
      chatMessages.pop();
      
      waitingForEmailInput = false;
      await sendConversationSummary(text);
      renderChatHistory(); // Display the success message
      
      input.value = "";
      return;
    } else {
      chatMessages.push({ sender: "user", text: text });
      addInstantBotResponse("Please enter a valid email address, or type 'cancel' to stop.");
      input.value = "";
      return;
    }
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

// Render quick actions
function renderQuickActions() {
  const qa = document.getElementById('quick-actions');
  if (!qa) return;
  
  qa.innerHTML = "";
  quickActions.forEach(action => {
    const btn = document.createElement('button');
    btn.type = "button";
    
    // Special styling for email summary button
    if (action.text === "email summary") {
      btn.className = "bg-green-100 text-green-800 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors text-sm font-semibold";
      btn.textContent = "📧 " + action.label;
    } else {
      // Default styling for other buttons
      btn.className = "bg-blue-100 text-blue-900 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium";
      btn.textContent = action.label;
    }
    
    btn.onclick = () => {
      // Check if it's the rates quick action
      if (action.text === "What are the current VA disability compensation rates?") {
        chatMessages.push({ sender: "user", text: action.text });
        renderChatHistory();
        addInstantBotResponse(INSTANT_RATE_RESPONSES["general"]);
      } else if (action.text === "email summary") {
        // Handle email summary button click
        chatMessages.push({ sender: "user", text: "email summary" });
        renderChatHistory();
        addInstantBotResponse("I can email you a summary of our conversation for your records. Please enter your email address:");
        waitingForEmailInput = true;
        document.getElementById('chat-input').focus();
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
