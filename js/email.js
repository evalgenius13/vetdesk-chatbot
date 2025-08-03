// Email functionality for conversation summaries

async function sendConversationSummary(email) {
  try {
    // Validate email parameter
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    // Check if chatMessages exists and has content
    if (!window.chatMessages || !Array.isArray(chatMessages) || chatMessages.length === 0) {
      throw new Error('No conversation to summarize');
    }

    // Check if CONFIG is available
    if (!CONFIG?.API_URL || !CONFIG?.FRONTEND_SECRET) {
      throw new Error('Configuration not available');
    }

    // Create conversation text from chat messages
    const conversationText = chatMessages
      .filter(msg => msg && msg.sender && msg.text) // Filter out invalid messages
      .map(msg => `${msg.sender === 'user' ? 'Veteran' : 'VetDesk'}: ${msg.text}`)
      .join('\n\n─────────────────────────────────────────\n\n');
    
    if (!conversationText.trim()) {
      throw new Error('No valid conversation content found');
    }

    // Generate AI summary of the conversation
    const summaryPrompt = `Please create a professional summary of this VA benefits conversation between a veteran and VetDesk. Focus on:
- Key benefits discussed and eligibility
- Specific rates or amounts mentioned
- Important next steps or actions
- Any deadlines or time-sensitive information

Keep it concise but comprehensive. Format it in a professional, easy-to-read style for the veteran's records.

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

    const emailContent = `Dear Veteran,

Thank you for using VetDesk to learn more about your VA benefits. Below is a summary of our conversation from ${conversationDate} at ${conversationTime}.

═══════════════════════════════════════════════════════════════
CONVERSATION SUMMARY

${conversationSummary}

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

Best regards,
The VetDesk Team

──────────────────────────────────────────────────────────────
VetDesk™ - VA Benefits, Simplified

This summary was generated on ${conversationDate} at ${conversationTime}
For additional support, visit VA.gov or contact your local VA office.`;

    // Send the email
    const summaryPayload = {
      email: email.trim(),
      subject: `Your VetDesk Benefits Consultation Summary - ${conversationDate}`,
      content: emailContent,
      userName: 'Veteran'
    };

    const response = await fetch('https://vetdesk-demo2-api.vercel.app/api/send-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summaryPayload)
    });

    const result = await response.json();

    if (response.ok && result?.success === true) {
      const successMessage = `Summary sent! You can send ${result.remaining || 0} more this hour.`;
      if (chatMessages && Array.isArray(chatMessages)) {
        chatMessages.push({ sender: "bot", text: successMessage, streaming: false });
      }
    } else {
      throw new Error(result?.error || 'Email sending failed');
    }

  } catch (error) {
    console.error('Email error:', error);
    const errorMessage = error.message || "Failed to send summary. Please try again later.";
    
    // Only try to add to chatMessages if it exists
    if (window.chatMessages && Array.isArray(chatMessages)) {
      chatMessages.push({ 
        sender: "bot", 
        text: errorMessage, 
        streaming: false 
      });
    }
    
    // Re-throw for any calling code that might want to handle it
    throw error;
  }
}
