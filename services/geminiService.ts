
import { GoogleGenAI, Type } from "@google/genai";
import { SimState, Language } from "../types";

/**
 * Hàm lấy instance AI an toàn.
 * Kiểm tra kỹ sự tồn tại của process.env trước khi truy cập.
 */
const getAI = () => {
  try {
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : null;
    if (!apiKey || apiKey === "YOUR_API_KEY") return null;
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    return null;
  }
};

const DEFAULT_MODEL = "gemini-3-flash-preview";

export async function getChemicalAnalysis(state: SimState) {
  const ai = getAI();
  if (!ai) return { error: "KEY_REQUIRED" };

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
    if (error.message?.includes("not found") || error.status === 401 || error.status === 404) {
      return { error: "KEY_REQUIRED" };
    }
    return null;
  }
}

export async function chatWithAI(message: string, state: SimState) {
  const ai = getAI();
  if (!ai) return "ERROR_KEY_REQUIRED";

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
    if (error.status === 401 || error.status === 404) return "ERROR_KEY_REQUIRED";
    return "AI đang bận, vui lòng thử lại.";
  }
}
