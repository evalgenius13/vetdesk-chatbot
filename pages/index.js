import React, { useState, useRef } from "react";

const quickActions = [
  { text: "Can you explain VA disability ratings for me?", label: "Disability Ratings" },
  { text: "How do VA appeals work and what should I expect?", label: "Appeals Process" },
  { text: "What healthcare options do I have through the VA?", label: "VA Healthcare" },
  { text: "What benefits might I be eligible for as a veteran?", label: "Benefit Eligibility" },
  { text: "How do I get started filing a VA claim online?", label: "File a Claim" }
];

const newsItems = [
  {
    title: "VA Announces New Policy Updates",
    url: "#",
    date: "2025-07-16",
    summary: "The Department of Veterans Affairs has announced updates to streamline disability claim processing."
  },
  {
    title: "Expanded Healthcare Access for Veterans",
    url: "#",
    date: "2025-07-14",
    summary: "New legislation now allows more veterans to qualify for VA healthcare coverage."
  },
  {
    title: "GI Bill Application Window Extended",
    url: "#",
    date: "2025-07-10",
    summary: "Veterans have more time to apply for the GI Bill thanks to a recent policy extension."
  }
];

export default function Home() {
  const [chatMessages, setChatMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatRef = useRef();

  // Streaming typing effect
  const streamBotText = (text, cb, delay = 18) => {
    let i = 0;
    function typeChar() {
      cb(text.slice(0, i + 1));
      i++;
      if (i < text.length) {
        setTimeout(typeChar, delay);
      }
    }
    typeChar();
  };

  // Fetch bot reply from API and stream it
  const addBotReplyToChat = async (userText) => {
    setIsBotTyping(true);
    // Prepare chat history for context
    const history = [
      ...chatMessages.map(m => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      })),
      { role: "user", parts: [{ text: userText }] }
    ];
    let botReply = "";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatHistory: history })
      });
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      botReply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.reply ||
        data?.answer ||
        data?.response ||
        "Sorry, I couldn't get an answer right now.";
    } catch (e) {
      botReply = "Sorry, I'm having trouble connecting to the Gemini API. Please try again later.";
    }
    setChatMessages((msgs) => [
      ...msgs,
      { sender: "bot", text: "", streaming: true }
    ]);
    // Stream typing
    streamBotText(botReply, (partial) => {
      setChatMessages((msgs) => {
        const updated = [...msgs];
        updated[updated.length - 1] = { sender: "bot", text: partial, streaming: true };
        return updated;
      });
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    });
    setTimeout(() => {
      setChatMessages((msgs) => {
        const updated = [...msgs];
        updated[updated.length - 1] = { sender: "bot", text: botReply, streaming: false };
        return updated;
      });
      setIsBotTyping(false);
    }, botReply.length * 18 + 50);
  };

  // Add user message and trigger bot
  const addUserMessageToChat = (text) => {
    setChatMessages((msgs) => [...msgs, { sender: "user", text }]);
    addBotReplyToChat(text);
  };

  // Handle chat form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    addUserMessageToChat(input.trim());
    setInput("");
  };

  // News and quick actions
  const renderNewsFeed = () =>
    newsItems.map((item, idx) => (
      <li key={idx} className="p-3 bg-gray-50 border rounded shadow-sm mb-2">
        <a href={item.url} className="font-semibold text-blue-800 hover:underline" target="_blank" rel="noopener noreferrer">{item.title}</a>
        <div className="text-xs text-gray-500 mb-1">{item.date}</div>
        <div className="mb-2">{item.summary}</div>
        <button
          type="button"
          className="how-affect-me-btn bg-green-100 text-green-800 px-3 py-1 rounded hover:bg-green-200 transition text-sm font-medium mt-1"
          onClick={() => addUserMessageToChat(`How does this affect me? (regarding: "${item.title}")`)}
        >
          How does this affect me?
        </button>
      </li>
    ));

  const renderQuickActions = () =>
    quickActions.map((action, idx) => (
      <button
        key={idx}
        type="button"
        className="bg-blue-100 text-blue-900 px-3 py-1 rounded hover:bg-blue-200 transition text-sm font-medium mr-2 mb-2"
        onClick={() => addUserMessageToChat(action.text)}
      >
        {action.label}
      </button>
    ));

  return (
    <div className="bg-gray-100 h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">VetDesk</h1>
        <span className="text-sm font-medium">Your Friendly VA Benefits Companion</span>
      </header>
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* News Feed */}
        <section className="w-full md:w-1/3 bg-white border-r border-gray-200 overflow-y-auto p-4 flex flex-col" style={{ minWidth: 300 }}>
          <h2 className="text-xl font-semibold mb-3">Veteran News Feed</h2>
          <ul className="space-y-4 flex-1">{renderNewsFeed()}</ul>
        </section>
        {/* Chat Section */}
        <section className="flex-1 flex flex-col h-full bg-gray-50">
          {/* Welcome Message */}
          <div className="p-4 text-base text-gray-700 bg-white border-b border-gray-200">
            <span>👋 Hi there, and welcome! I’m here to help you get the most out of your VA benefits. Just ask a question, click a quick link, or select a news story for personalized support.</span>
          </div>
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 p-4 bg-white border-b border-gray-200">{renderQuickActions()}</div>
          {/* Chat History */}
          <div ref={chatRef} id="chat-history" className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
            {chatMessages.map((msg, i) =>
              msg.sender === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-md text-right ml-auto">{msg.text}</div>
                </div>
              ) : (
                <div key={i} className="flex">
                  <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg max-w-md">{msg.text}</div>
                </div>
              )
            )}
            {isBotTyping && (
              <div className="flex">
                <div className="bg-gray-200 text-gray-400 px-4 py-2 rounded-lg max-w-md italic animate-pulse">
                  Bot is typing...
                </div>
              </div>
            )}
          </div>
          {/* Chat Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 p-4 bg-white border-t border-gray-200" autoComplete="off">
            <input
              id="chat-input"
              type="text"
              className="flex-1 border rounded px-3 py-2 focus:outline-blue-600"
              placeholder="Ask me anything about VA benefits..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoComplete="off"
              required
              disabled={isBotTyping}
            />
            <button
              type="submit"
              className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
              disabled={isBotTyping}
            >
              Send
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
