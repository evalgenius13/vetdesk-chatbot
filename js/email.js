// ===== email.js =====
async function sendConversationSummary(email) {
  try {
    const conversationText = chatMessages
      .map(msg => `${msg.sender === 'user' ? 'Veteran' : 'VetDesk'}: ${msg.text}`)
      .join('\n\n');

    const summaryPrompt = `Please create a professional summary of this VA benefits conversation between a veteran and VetDesk...\n\nConversation:\n${conversationText}`;

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

    let summary = "Unable to generate summary.";
    if (summaryResponse.ok) {
      const json = await summaryResponse.json();
      summary = json?.candidates?.[0]?.content?.parts?.[0]?.text || summary;
    }

    const fullContent = `SUMMARY\n\n${summary}\n\nFULL CONVERSATION\n\n${conversationText}`;
    const payload = {
      email,
      subject: 'Your VetDesk Summary',
      content: fullContent,
      userName: 'Veteran'
    };

    const res = await fetch('https://vetdesk-demo2-api.vercel.app/api/send-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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
