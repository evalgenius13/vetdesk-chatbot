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
  setupNavigation(); // Add navigation setup
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

// Update both question counters (desktop and mobile)
function updateQuestionCounters() {
  // This function should be called from your chat.js updateQuestionCounter function
  const userMessageCount = chatMessages?.filter(msg => msg.sender === "user").length || 0;
  const questionsLeft = 12 - userMessageCount;
  
  // Update desktop counter
  const desktopCounter = document.getElementById('questions-left');
  if (desktopCounter) {
    desktopCounter.textContent = questionsLeft;
  }
  
  // Update mobile counter
  const mobileCounter = document.getElementById('mobile-questions-left');
  if (mobileCounter) {
    mobileCounter.textContent = questionsLeft;
  }
  
  // Update colors for both counters
  const updateCounterColor = (counterElement) => {
    if (!counterElement) return;
    const parentDiv = counterElement.closest('[id*="question-counter"]');
    if (!parentDiv) return;
    
    if (questionsLeft <= 3) {
      parentDiv.className = parentDiv.className.replace(/text-gray-500|text-orange-500/, 'text-red-500');
    } else if (questionsLeft <= 6) {
      parentDiv.className = parentDiv.className.replace(/text-gray-500|text-red-500/, 'text-orange-500');
    } else {
      parentDiv.className = parentDiv.className.replace(/text-red-500|text-orange-500/, 'text-gray-500');
    }
  };
  
  updateCounterColor(desktopCounter);
  updateCounterColor(mobileCounter);
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
