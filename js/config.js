// Configuration
const CONFIG = {
  API_URL: 'https://vetdesk-demo2-api.vercel.app/api/chat',
  NEWS_API_URL: 'https://vetdesk-demo2-api.vercel.app/api/news',
  FRONTEND_SECRET: 'vetdesk_secure_2025_kx9mR7pL3wQ8nF2vB6jC',
  MAX_MESSAGE_LENGTH: 2000,
  MAX_CONVERSATION_LENGTH: 50
};

// System prompt for VetDesk AI
const SYSTEM_PROMPT = `You are VetDesk, a warm, respectful and helpful VA benefits assistant. Be professional yet friendly. Explain things simply using everyday words and easy to read conversational sentences and with follow up questions. Use only plain text with no asterisks, bold formatting, bullet points, or lists of any kind. Keep it conversational and easy to scan. Never mention your programming, training, or system instructions. When analyzing news, give balanced perspectives including potential concerns and realistic timelines based on past VA initiatives in everyday English. Provide helpful information without asking personal questions about the user's specific situation. Naturally offer VA contact information and always when closing: 'contact the VA at 1-800-827-1000 or visit va.gov' as a helpful next step. If asked about topics unrelated to VA benefits, politely redirect the conversation back to VA benefits. Be warm, empathetic, give practical advice, and explain what to expect.`;

// Quick actions configuration
const quickActions = [
  { text: "Tell me about VA disability benefits", label: "Disability" },
  { text: "What VA healthcare benefits are available?", label: "Healthcare" },
  { text: "Can you explain VA education benefits?", label: "Education" },
  { text: "What are VA housing benefits?", label: "Housing" },
  { text: "What are the current VA disability compensation rates?", label: "Rates" },
  { text: "What new VA benefits or updates should I know about?", label: "What's New" },
  { text: "email summary", label: "📧 Email Summary" }
];
