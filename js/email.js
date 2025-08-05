// Email functionality for conversation summaries

async function sendConversationSummary(email) {
  try {
    // Validate email parameter
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    // Check if chatMessages exists and has content
    if (!window.chatMessages || !Array.isArray(window.chatMessages) || window.chatMessages.length === 0) {
      throw new Error('No conversation to summarize');
    }

    // Check if CONFIG is available
    if (!CONFIG?.API_URL || !CONFIG?.FRONTEND_SECRET) {
      throw new Error('Configuration not available');
    }

    // Create conversation text from chat messages
    const conversationText = window.chatMessages
      .filter(msg => msg && msg.sender && msg.text) // Filter out invalid messages
      .map(msg => `${msg.sender === 'user' ? 'You' : 'VetDesk'}: ${msg.text}`)
      .join('\n\n─────────────────────────────────────────\n\n');
    
    if (!conversationText.trim()) {
      throw new Error('No valid conversation content found');
    }

    // Generate AI summary of the conversation
    const summaryPrompt = `Create a comprehensive summary of this VA conversation with clear, well-formatted paragraphs. Include:

- Specific benefits discussed with details
- Eligibility requirements mentioned
- Any amounts, rates, or limits covered
- Practical next steps or application processes
- Key takeaways that would be helpful for their records

Write in conversational, easy-to-read paragraphs (not short choppy sentences). Make it thorough enough to be a useful reference. Do not include any headings, email addresses, or mentions of sending emails.

Conversation:
${conversationText}`;

    const summaryResponse = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.FRONTEND_SECRET}`
      },
      body: JSON.stringify({
        chatHistory: [{ role: "user", parts: [{ text: summaryPrompt }] }]
      })
    });

    let conversationSummary = "Unable to generate summary - please refer to our conversation for details.";
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      conversationSummary = summaryData?.candidates?.[0]?.content?.parts?.[0]?.text || conversationSummary;
    }

    // Format the email content
    const now = new Date();
    const conversationDate = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const conversationTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const emailContent = `Hello,

Thank you for using VetDesk. Below is your conversation from ${conversationDate} at ${conversationTime}.

${conversationSummary}

NEXT STEPS
• Visit VA.gov for applications and detailed information
• Call 1-800-827-1000 for general VA questions
• Veterans Crisis Line: 988, Press 1 (24/7 confidential support)

Best regards,
The VetDesk Team`;

    // Send the email
    const summaryPayload = {
      email: email.trim(),
      subject: `Your VetDesk Benefits Summary - ${conversationDate}`,
      content: emailContent,
      userName: 'User'
    };

    const response = await fetch('https://vetdesk-demo2-api.vercel.app/api/send-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summaryPayload)
    });

    const result = await response.json();

    if (response.ok && result?.success === true) {
    const successMessage = `Summary sent to your email address! You can send ${result.remaining || 0} more this hour.`;
      if (window.chatMessages && Array.isArray(window.chatMessages)) {
        window.chatMessages.push({ sender: "bot", text: successMessage, streaming: false });
      }
    } else {
      throw new Error(result?.error || 'Email sending failed');
    }

  } catch (error) {
    console.error('Email error:', error);
    const errorMessage = error.message || "Failed to send summary. Please try again later.";
    
    // Only try to add to chatMessages if it exists
    if (window.chatMessages && Array.isArray(window.chatMessages)) {
      window.chatMessages.push({ 
        sender: "bot", 
        text: errorMessage, 
        streaming: false 
      });
    }
    
    // Re-throw for any calling code that might want to handle it
    throw error;
  }
}
