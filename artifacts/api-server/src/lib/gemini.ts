import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_CASCADE = [
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.0-pro",
];

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

async function tryModels(fn: (modelName: string) => Promise<string>): Promise<string> {
  let lastError: unknown;
  for (const modelName of MODEL_CASCADE) {
    try {
      return await fn(modelName);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

export async function chat(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const genAI = getClient();
  return tryModels(async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const lastMessage = messages[messages.length - 1];
    const chatSession = model.startChat({ history, systemInstruction: systemPrompt });
    const result = await chatSession.sendMessage(lastMessage.content);
    return result.response.text();
  });
}

export async function generateText(prompt: string): Promise<string> {
  const genAI = getClient();
  return tryModels(async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
}
