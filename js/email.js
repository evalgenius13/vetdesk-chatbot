// ===== email.js =====
async function sendConversationSummary(email) {
  try {
    const conversationText = chatMessages
      .map(msg => `${msg.sender === 'user' ? 'Veteran' : 'VetDesk'}: ${msg.text}`)
      .join('\n\n─────────────────────────────────────────\n\n');

    const summaryPrompt = `Please create a professional summary of this VA benefits conversation between a veteran and VetDesk. Focus on:\n- Key benefits discussed and eligibility\n- Specific rates or amounts mentioned\n- Important next steps or actions\n- Any deadlines or time-sensitive information\n\nKeep it concise but comprehensive. Format it in a professional, easy-to-read style for the veteran's records.\n\nConversation:\n${conversationText}`;

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

    let conversationSummary = "Unable to generate summary - please refer to the full conversation below.";
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      conversationSummary = summaryData?.candidates?.[0]?.content?.parts?.[0]?.text || conversationSummary;
    }

    const now = new Date();
    const conversationDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const conversationTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const emailContent = `Dear Veteran,\n\nThank you for using VetDesk to learn more about your VA benefits. Below is a summary of our conversation from ${conversationDate} at ${conversationTime}.\n\n═══════════════════════════════════════════════════════════════\n\nCONVERSATION SUMMARY\n\n${conversationSummary}\n\n═══════════════════════════════════════════════════════════════\n\nNEXT STEPS & VA RESOURCES\n\n• Visit VA.gov for benefit applications and detailed information\n• Call 1-800-827-1000 for general VA benefits questions (Mon-Fri, 8am-8pm ET)\n• Find your local VA office: va.gov/find-locations\n• Veterans Crisis Line: 988, Press 1 (24/7 confidential support)\n• MyVA411: 1-844-698-2311 for technical support with VA websites\n\nIMPORTANT REMINDERS\n\n• Always verify benefit information with your local VA office\n• Keep this summary for your records\n• VA benefits and rates may change - check VA.gov for updates\n• Apply for time-sensitive benefits as soon as possible\n\n═══════════════════════════════════════════════════════════════\n\nFULL CONVERSATION RECORD\n\n${conversationText}\n\n═══════════════════════════════════════════════════════════════\n\nBest regards,\nThe VetDesk Team\n\n──────────────────────────────────────────────────────────────\nVetDesk™ - VA Benefits, Simplified\nThis summary was generated on ${conversationDate} at ${conversationTime}\nFor additional support, visit VA.gov or contact your local VA office.`;

    const summaryPayload = {
      email,
      subject: `Your VetDesk Benefits Consultation Summary - ${conversationDate}`,
      content: emailContent,
      userName: 'Veteran'
    };

    const res = await fetch('https://vetdesk-demo2-api.vercel.app/api/send-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summaryPayload)
    });

    const result = await res.json();
    if (res.ok && result?.success === true) {
      const msg = `Summary sent! You can send ${result.remaining} more this hour.`;
      chatMessages.push({ sender: "bot", text: msg, streaming: false });
    } else {
      throw new Error(result?.error || 'Email failed');
    }
  } catch (err) {
    console.error('Email error:', err);
    chatMessages.push({ sender: "bot", text: "Failed to send summary. Please try again later.", streaming: false });
  }
}
