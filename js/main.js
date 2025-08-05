// Ensure chatMessages exists globally
window.chatMessages = window.chatMessages || [];

// Main initialization and event handlers

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize core functionality
  renderQuickActions();
  renderChatHistory();
  
  // Initialize news feed
  const newsFeedElement = document.getElementById('news-feed');
  if (newsFeedElement) {
    fetchNews();
  }
  
  // Setup enhancements
  setupAutoResize();
  setupScrollToBottom();
  updateCharacterCounter();
  
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
  setupNavigation();
});

// Navigation functionality
function setupNavigation() {
  // Mobile menu elements
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  
  // Desktop dropdown elements
  const faqButton = document.getElementById('faq-button');
  const faqDropdown = document.getElementById('faq-dropdown');
  const faqClose = document.getElementById('faq-close');
  const aboutButton = document.getElementById('about-button');
  const aboutDropdown = document.getElementById('about-dropdown');
  const aboutClose = document.getElementById('about-close');

  // Mobile menu functionality
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      mobileMenu.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  }

  if (mobileMenuClose && mobileMenu) {
    mobileMenuClose.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      document.body.style.overflow = '';
    });
  }

  if (mobileMenu) {
    mobileMenu.addEventListener('click', (e) => {
      if (e.target === mobileMenu) {
        mobileMenu.classList.add('hidden');
        document.body.style.overflow = '';
      }
    });
  }

  // Desktop FAQ dropdown
  if (faqButton && faqDropdown) {
    faqButton.addEventListener('click', (e) => {
      e.stopPropagation();
      faqDropdown.classList.toggle('hidden');
      if (aboutDropdown) aboutDropdown.classList.add('hidden');
    });
  }

  // Desktop About dropdown
  if (aboutButton && aboutDropdown) {
    aboutButton.addEventListener('click', (e) => {
      e.stopPropagation();
      aboutDropdown.classList.toggle('hidden');
      if (faqDropdown) faqDropdown.classList.add('hidden');
    });
  }

  // Close buttons for desktop dropdowns
  if (faqClose && faqDropdown) {
    faqClose.addEventListener('click', () => faqDropdown.classList.add('hidden'));
  }
  if (aboutClose && aboutDropdown) {
    aboutClose.addEventListener('click', () => aboutDropdown.classList.add('hidden'));
  }

  // Close desktop dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (faqButton && faqDropdown && !faqButton.contains(e.target) && !faqDropdown.contains(e.target)) {
      faqDropdown.classList.add('hidden');
    }
    if (aboutButton && aboutDropdown && !aboutButton.contains(e.target) && !aboutDropdown.contains(e.target)) {
      aboutDropdown.classList.add('hidden');
    }
  });

  // Close mobile menu on window resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && mobileMenu && !mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.add('hidden');
      document.body.style.overflow = '';
    }
  });
}

// Set responsive placeholder text
function updatePlaceholder() {
  const chatInput = document.getElementById('chat-input');
  if (!chatInput) return;
  
  if (window.innerWidth >= 640) {
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
    if (window.waitingForEmailInput) {
      // Handle cancel first
      if (text.toLowerCase() === "cancel") {
        if (window.chatMessages) {
          window.chatMessages.push({ sender: "user", text: text });
        }
        if (typeof addInstantBotResponse === 'function') {
          addInstantBotResponse("Email summary cancelled. How else can I help you?");
        }
        window.waitingForEmailInput = false;
        input.value = "";
        if (window.resetTextareaHeight) {
          window.resetTextareaHeight();
        }
        return;
      }
      
      // Validate email format
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailPattern.test(text)) {
        if (window.chatMessages) {
          window.chatMessages.push({ sender: "user", text: text });
        }
        if (typeof renderChatHistory === 'function') {
          renderChatHistory();
        }
        
        // Show loading message
        if (typeof addInstantBotResponse === 'function') {
          addInstantBotResponse("Generating your summary and sending email...");
        }
        
        window.waitingForEmailInput = false;
        
        // Send email summary
        try {
          if (typeof sendConversationSummary === 'function') {
            await sendConversationSummary(text);
          }
        } catch (error) {
          console.error('Email sending failed:', error);
        }
        
        if (typeof renderChatHistory === 'function') {
          renderChatHistory();
        }
        input.value = "";
        if (window.resetTextareaHeight) {
          window.resetTextareaHeight();
        }
        return;
      } else {
        if (window.chatMessages) {
          window.chatMessages.push({ sender: "user", text: text });
        }
        if (typeof addInstantBotResponse === 'function') {
          addInstantBotResponse("Please enter a valid email address, or type 'cancel' to stop.");
        }
        input.value = "";
        if (window.resetTextareaHeight) {
          window.resetTextareaHeight();
        }
        return;
      }
    }

    // Normal chat flow
    if (typeof addUserMessageToChat === 'function') {
      addUserMessageToChat(text);
    }
    input.value = "";
    if (window.resetTextareaHeight) {
      window.resetTextareaHeight();
    }
    if (typeof updateCharacterCounter === 'function') {
      updateCharacterCounter();
    }
  });
}

// Setup input validation handler
function setupInputHandler() {
  const chatInput = document.getElementById('chat-input');
  if (!chatInput) return;

  chatInput.addEventListener('input', function(e) {
    const length = e.target.value.length;
    const maxLength = CONFIG?.MAX_MESSAGE_LENGTH || 2000;

    if (length > maxLength) {
      e.target.value = e.target.value.substring(0, maxLength);
    }

    if (typeof updateCharacterCounter === 'function') {
      updateCharacterCounter();
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
