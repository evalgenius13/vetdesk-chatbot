// ===== main.js =====
document.addEventListener('DOMContentLoaded', () => {
  renderQuickActions();
  renderChatHistory();
  fetchNews();
  document.getElementById('chat-input').focus();
});

document.getElementById('chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  if (!validateMessageLength(text)) {
    showError(`Message must be between 1 and ${CONFIG.MAX_MESSAGE_LENGTH} characters.`);
    return;
  }

  const rateResponse = detectRateQuestion(text);
  if (rateResponse && INSTANT_RATE_RESPONSES[rateResponse]) {
    chatMessages.push({ sender: "user", text });
    addInstantBotResponse(INSTANT_RATE_RESPONSES[rateResponse]);
    input.value = "";
    return;
  }

  addUserMessageToChat(text);
  input.value = "";
});

document.getElementById('chat-input').addEventListener('input', function(e) {
  const length = e.target.value.length;
  const button = document.getElementById('send-button');
  if (length > CONFIG.MAX_MESSAGE_LENGTH) {
    e.target.value = e.target.value.substring(0, CONFIG.MAX_MESSAGE_LENGTH);
  }
  button.disabled = e.target.value.trim().length === 0 || botIsLoading;
});

document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    document.getElementById('chat-form').dispatchEvent(new Event('submit'));
  }
});

function handleEmailSummaryRequest() {
  const email = prompt("Enter your email to receive the summary:");
  if (!email || !email.includes('@')) {
    alert("Invalid email.");
    return;
  }
  chatMessages.push({ sender: "bot", text: "Generating your summary and sending email...", streaming: false });
  renderChatHistory();
  sendConversationSummary(email).then(() => renderChatHistory());
}

function renderQuickActions() {
  const container = document.getElementById('quick-actions');
  if (!container) return;
  container.innerHTML = '';
  quickActions.forEach(({ text, label }) => {
    const btn = document.createElement('button');
    btn.className = 'quick-action-button';
    btn.textContent = label;
    btn.onclick = () => {
      if (label === 'Email Summary') handleEmailSummaryRequest();
      else addUserMessageToChat(text);
    };
    container.appendChild(btn);
  });
}
