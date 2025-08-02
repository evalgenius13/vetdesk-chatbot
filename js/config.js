// Configuration
const CONFIG = {
  API_URL: 'https://vetdesk-demo2-api.vercel.app/api/chat',
  NEWS_API_URL: 'https://vetdesk-demo2-api.vercel.app/api/news',
  FRONTEND_SECRET: 'vetdesk_secure_2025_kx9mR7pL3wQ8nF2vB6jC',
  MAX_MESSAGE_LENGTH: 2000,
  MAX_CONVERSATION_LENGTH: 50
};

// Quick actions with rates
const quickActions = [
  { text: "Tell me about VA disability benefits", label: "Disability" },
  { text: "What VA healthcare benefits are available?", label: "Healthcare" },
  { text: "Can you explain VA education benefits?", label: "Education" },
  { text: "What are VA housing benefits?", label: "Housing" },
  { text: "What are the current VA disability compensation rates?", label: "Rates" },
  { text: "What new VA benefits or updates should I know about?", label: "What's New" }
];

// Instant rate responses - all 2025 rates
const INSTANT_RATE_RESPONSES = {
  "10": "For 10% disability, you receive $175.51 per month. Veterans with 10% or 20% ratings don't receive additional compensation for dependents.",
  "20": "For 20% disability, you receive $346.95 per month. Veterans with 10% or 20% ratings don't receive additional compensation for dependents.",
  "30": "For 30% disability:\n• Veteran alone: $537.42/month\n• With spouse: $601.42/month\n• With one child: $579.42/month\n• With spouse and one child: $648.42/month",
  "40": "For 40% disability:\n• Veteran alone: $774.16/month\n• With spouse: $859.16/month\n• With one child: $831.16/month\n• With spouse and one child: $922.16/month",
  "50": "For 50% disability:\n• Veteran alone: $1,102.04/month\n• With spouse: $1,208.04/month\n• With one child: $1,173.04/month\n• With spouse and one child: $1,287.04/month",
  "60": "For 60% disability:\n• Veteran alone: $1,395.93/month\n• With spouse: $1,523.93/month\n• With one child: $1,480.93/month\n• With spouse and one child: $1,617.93/month",
  "70": "For 70% disability:\n• Veteran alone: $1,759.19/month\n• With spouse: $1,908.19/month\n• With one child: $1,858.19/month\n• With spouse and one child: $2,018.19/month",
  "80": "For 80% disability:\n• Veteran alone: $2,044.89/month\n• With spouse: $2,214.89/month\n• With one child: $2,158.89/month\n• With spouse and one child: $2,340.89/month",
  "90": "For 90% disability:\n• Veteran alone: $2,297.96/month\n• With spouse: $2,489.96/month\n• With one child: $2,425.96/month\n• With spouse and one child: $2,630.96/month",
  "100": "For 100% disability:\n• Veteran alone: $3,831.30/month\n• With spouse: $4,044.91/month\n• With one child: $3,974.15/month\n• With spouse and one child: $4,201.35/month",
  "general": "2025 VA Disability Compensation Rates (effective December 1, 2024):\n\n10%: $175.51/month\n20%: $346.95/month\n30%: $537.42/month\n40%: $774.16/month\n50%: $1,102.04/month\n60%: $1,395.93/month\n70%: $1,759.19/month\n80%: $2,044.89/month\n90%: $2,297.96/month\n100%: $3,831.30/month\n\n(Rates shown are for veterans with no dependents. Ask about a specific percentage for dependent rates!)"
};
