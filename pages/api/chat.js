import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const { chatHistory } = req.body;

  if (!chatHistory || !Array.isArray(chatHistory)) {
    res.status(400).json({ error: "Invalid chat history" });
    return;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.5,
      },
    });

    const lastMessage = chatHistory[chatHistory.length - 1];
    const userMessage = lastMessage?.parts?.[0]?.text || "";

    const result = await chat.sendMessage(userMessage);

    res.status(200).json(result.response);
  } catch (e) {
    res.status(500).json({ error: "Gemini API error", details: e.message });
  }
}
