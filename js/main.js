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

  // Check for email requests
  const emailResponse = debugDetectEmailRequest(text); // includes debug logging
  if (emailResponse) {
    if (emailResponse === 'request') {
      chatMessages.push({ sender: "user", text: text });
      renderChatHistory();

      const emailRequest = "I'd be happy to email you a summary! Just provide your email address and I'll send it right over.";
      addInstantBotResponse(emailRequest);
      waitingForEmail = true;
      input.value = "";
      return;
    } else if (emailResponse === 'confirm' && waitingForEmail) {
      chatMessages.push({ sender: "user", text: text });
      renderChatHistory();

      const emailRequest = "Please provide your email address and I'll send you the summary.";
      addInstantBotResponse(emailRequest);
      input.value = "";
      return;
    } else if (emailResponse !== 'confirm' && emailResponse !== 'request') {
      // User provided email address
      chatMessages.push({ sender: "user", text: text });
      renderChatHistory();

      // Show loading message
      const loadingMessage = "Generating your summary and sending email...";
      chatMessages.push({ sender: "bot", text: loadingMessage, streaming: false });
      renderChatHistory();

      // Remove loading message before async to avoid overwriting new messages
      chatMessages.pop();
      renderChatHistory();

      waitingForEmail = false;
      await sendConversationSummary(emailResponse);
      renderChatHistory(); // Re-render again after success/failure message

      input.value = "";
      return;
    }
  }

  // Reset email waiting if user says something unrelated
  if (waitingForEmail && !emailResponse) {
    waitingForEmail = false;
  }

  // Check for instant rate response first
  const rateResponse = detectRateQuestion(text);
  if (rateResponse && INSTANT_RATE_RESPONSES[rateResponse]) {
    chatMessages.push({ sender: "user", text: text });
    addInstantBotResponse(INSTANT_RATE_RESPONSES[rateResponse]);
    input.value = "";
    return;
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

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    document.getElementById('chat-form').dispatchEvent(new Event('submit'));
  }
});
