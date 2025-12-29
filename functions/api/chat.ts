
import { GoogleGenAI } from "@google/genai";

// functions/api/chat.ts
export const onRequestPost = async (context: any) => {
  try {
    const { history, message } = await context.request.json();
    
    // Fixed: Always use the @google/genai SDK and process.env.API_KEY.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Fixed: MUST NOT use gemini-1.5-flash. Using gemini-3-flash-preview instead.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: "Context của trường Hòn Gai..." }] },
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ]
    });

    // Fixed: Directly accessing .text property of GenerateContentResponse.
    return new Response(JSON.stringify({ text: response.text }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Lỗi hệ thống: " + (error.message || "Unknown error") }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
