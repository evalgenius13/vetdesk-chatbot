// Chat functionality and state management

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
async function renderChatHistory() {
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
