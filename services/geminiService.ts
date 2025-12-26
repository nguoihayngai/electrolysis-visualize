
import { GoogleGenAI, Type } from "@google/genai";
import { SimState, Language } from "../types";

const DEFAULT_MODEL = "gemini-3-flash-preview";

export async function getChemicalAnalysis(state: SimState) {
  // Tạo instance AI trực tiếp sử dụng biến môi trường
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const languagePrompt = state.language === Language.VI 
    ? "Vui lòng phân tích bằng tiếng Việt." 
    : "Please analyze in English.";

  const prompt = `
    Phân tích hóa học điện phân:
    - Chất: ${state.electrolyte}
    - Anode: ${state.anodeMaterial}
    - Cathode: ${state.cathodeMaterial}
    - Điện áp: ${state.voltage}V
    ${languagePrompt}
  `;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            anodeReaction: { type: Type.STRING },
            cathodeReaction: { type: Type.STRING },
            overallEquation: { type: Type.STRING },
            observations: { type: Type.STRING },
            applications: { type: Type.STRING },
          },
          required: ["anodeReaction", "cathodeReaction", "overallEquation", "observations", "applications"]
        }
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return null;
  }
}

export async function chatWithAI(message: string, state: SimState) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const chat = ai.chats.create({
      model: DEFAULT_MODEL,
      config: { 
        systemInstruction: `Bạn là chuyên gia hóa học. Đang điện phân ${state.electrolyte}. Trả lời bằng ${state.language === Language.VI ? 'Tiếng Việt' : 'Tiếng Anh'}.` 
      }
    });
    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error: any) {
    console.error("Chat AI Error:", error);
    return "AI đang bận, vui lòng thử lại.";
  }
}
