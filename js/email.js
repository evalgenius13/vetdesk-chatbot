// Email functionality
let waitingForEmail = false;

// Email detection and validation
function detectEmailRequest(message) {
  const msg = message.toLowerCase().trim();
  
  // Better email regex
  const emailPattern = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/;
  
  // Check if message contains an email address
  const emailMatch = message.match(emailPattern);
  if (emailMatch) {
    return emailMatch[0];
  }
  
  // Explicit email requests
  if (msg.includes('email me') || msg.includes('send me summary') || msg.includes('email summary')) {
    return 'request';
  }
  
  // Confirm if waiting and user says yes
  if (waitingForEmail && (msg === 'yes' || msg === 'sure' || msg === 'yeah' || msg === 'yep')) {
    return 'confirm';
  }
  
  return null;
}

// Main email sending function
async function sendConversationSummary(email) {
  try {
    // Generate AI summary of conversation
    const conversationForSummary = chatMessages
      .map(msg => `${msg.sender === 'user' ? 'Veteran' : 'VetDesk'}: ${msg.text}`)
      .join('\n\n');

    const summaryPrompt = `Please create a professional summary of this VA benefits conversation between a veteran and VetDesk. Focus on:
- Key benefits discussed and eligibility
- Specific rates or amounts mentioned
- Important next steps or actions
- Any deadlines or time-sensitive information

Keep it concise but comprehensive. Format it in a professional, easy-to-read style for the veteran's records.

Conversation:
${conversationForSummary}`;

    // Get AI summary
    const summaryResponse = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.FRONTEND_SECRET}`
      },
      body: JSON.stringify({ 
        chatHistory: [{
          role: "user",
          parts: [{ text: summaryPrompt }]
        }]
      })
    });

    let conversationSummary = "Unable to generate summary - please refer to the full conversation below.";
    
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      conversationSummary = summaryData?.candidates?.[0]?.content?.parts?.[0]?.text || conversationSummary;
    } else {
      console.error('Summary API error:', summaryResponse.status);
    }
    
    // Generate date/time
    const conversationDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const conversationTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Format full conversation as backup
    const formattedConversation = chatMessages
      .map(msg => {
        const sender = msg.sender === 'user' ? '👤 You' : '🏛️ VetDesk';
        return `${sender}:\n${msg.text}`;
      })
      .join('\n\n─────────────────────────────────────────\n\n');
    
    // Debug logging to check variables
    console.log('=== EMAIL TEMPLATE DEBUG ===');
    console.log('conversationSummary:', conversationSummary);
    console.log('conversationDate:', conversationDate);
    console.log('conversationTime:', conversationTime);
    console.log('formattedConversation length:', formattedConversation.length);
    console.log('=== END DEBUG ===');
    
    // Ensure all variables have fallback values
    const safeConversationSummary = conversationSummary || "Summary generation failed - please refer to the full conversation below.";
    const safeConversationDate = conversationDate || new Date().toLocaleDateString();
    const safeConversationTime = conversationTime || new Date().toLocaleTimeString();
    const safeFormattedConversation = formattedConversation || "No conversation data available.";
    
    // Create professional email content with safe variables
    const emailContent = `Dear Veteran,

Thank you for using VetDesk to learn more about your VA benefits. Below is a summary of our conversation from ${safeConversationDate} at ${safeConversationTime}.

═══════════════════════════════════════════════════════════════

CONVERSATION SUMMARY

${safeConversationSummary}

═══════════════════════════════════════════════════════════════

NEXT STEPS & VA RESOURCES

• Visit VA.gov for benefit applications and detailed information
• Call 1-800-827-1000 for general VA benefits questions (Mon-Fri, 8am-8pm ET)  
• Find your local VA office: va.gov/find-locations
• Veterans Crisis Line: 988, Press 1 (24/7 confidential support)
• MyVA411: 1-844-698-2311 for technical support with VA websites

IMPORTANT REMINDERS

• Always verify benefit information with your local VA office
• Keep this summary for your records  
• VA benefits and rates may change - check VA.gov for updates
• Apply for time-sensitive benefits as soon as possible

═══════════════════════════════════════════════════════════════

FULL CONVERSATION RECORD

${safeFormattedConversation}

═══════════════════════════════════════════════════════════════

Best regards,
The VetDesk Team

──────────────────────────────────────────────────────────────
VetDesk™ - VA Benefits, Simplified
This summary was generated on ${safeConversationDate} at ${safeConversationTime}
For additional support, visit VA.gov or contact your local VA office.`;

    const summary = {
      email: email,
      subject: `Your VetDesk Benefits Consultation Summary - ${safeConversationDate}`,
      content: emailContent,
      userName: 'Veteran'
    };

    const response = await fetch('/api/send-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(summary)
    });

    const result = await response.json();
    
    if (result.success) {
      const successMessage = `Great! I've sent your conversation summary to ${email}. You should receive it within a few minutes.`;
      chatMessages.push({ sender: "bot", text: successMessage, streaming: false });
      renderChatHistory();
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    console.error('Email error:', error);
    let errorMessage;
    
    if (error.message.includes('fetch') || error.message.includes('network')) {
      errorMessage = "Sorry, I couldn't send the email due to a connection issue. Please try again.";
    } else if (error.message.includes('summary')) {
      errorMessage = "I sent your email, but there was an issue generating the summary. You'll receive the full conversation instead.";
    } else {
      errorMessage = "Sorry, I couldn't send the email right now. Please try again later or contact support.";
    }
    
    chatMessages.push({ sender: "bot", text: errorMessage, streaming: false });
    renderChatHistory();
  }
}
