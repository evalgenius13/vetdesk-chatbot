// Main initialization and event handlers

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize core functionality
  renderQuickActions();
  renderChatHistory();
  
  // Initialize news feed (only if element exists)
  const newsFeedElement = document.getElementById('news-feed');
  if (newsFeedElement) {
    fetchNews();
  }
  
  // Focus chat input and set responsive placeholder
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.focus();
    updatePlaceholder();
  }
  
  // Setup event listeners
  setupFormHandler();
  setupInputHandler();
  setupResizeHandler();
});

// Set responsive placeholder text
function updatePlaceholder() {
  const chatInput = document.getElementById('chat-input');
  if (!chatInput) return;
  
  if (window.innerWidth >= 640) { // sm breakpoint
    chatInput.placeholder = 'Ask me anything about VA benefits...';
  } else {
    chatInput.placeholder = 'Ask me anything...';
  }
}

// Setup form submission handler
function setupFormHandler() {
  const chatForm = document.getElementById('chat-form');
  if (!chatForm) return;

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;

    // Validate message length
    if (!validateMessageLength(text)) {
      showError(`Message must be between 1 and ${CONFIG?.MAX_MESSAGE_LENGTH || 2000} characters.`);
      return;
    }

    // Handle email input when waiting for email
    if (waitingForEmailInput) {
      // Handle cancel first
      if (text.toLowerCase() === "cancel") {
        chatMessages.push({ sender: "user", text: text });
        addInstantBotResponse("Email summary cancelled. How else can I help you?");
        waitingForEmailInput = false;
        input.value = "";
        return;
      }
      
      // Validate email format
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailPattern.test(text)) {
        chatMessages.push({ sender: "user", text: text });
        renderChatHistory();
        
        // Show loading message
        addInstantBotResponse("Generating your summary and sending email...");
        
        waitingForEmailInput = false;
        
        // Send email summary
        try {
          await sendConversationSummary(text);
        } catch (error) {
          console.error('Email sending failed:', error);
        }
        
        renderChatHistory();
        input.value = "";
        return;
      } else {
        chatMessages.push({ sender: "user", text: text });
        addInstantBotResponse("Please enter a valid email address, or type 'cancel' to stop.");
        input.value = "";
        return;
      }
    }

    // Normal chat flow
    addUserMessageToChat(text);
    input.value = "";
  });
}

// Setup input validation handler
function setupInputHandler() {
  const chatInput = document.getElementById('chat-input');
  if (!chatInput) return;

  chatInput.addEventListener('input', function(e) {
    const length = e.target.value.length;
    const button = document.getElementById('send-button');
    const maxLength = CONFIG?.MAX_MESSAGE_LENGTH || 2000;

    if (length > maxLength) {
      e.target.value = e.target.value.substring(0, maxLength);
    }

    if (button) {
      const isEmpty = e.target.value.trim().length === 0;
      const isLoading = window.botIsLoading || false;
      button.disabled = isEmpty || isLoading;
    }
  });
}

// Setup resize handler with throttling
function setupResizeHandler() {
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updatePlaceholder, 200);
  });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
      chatForm.dispatchEvent(new Event('submit'));
    }
  }
});
