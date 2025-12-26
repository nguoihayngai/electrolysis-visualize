
import { GoogleGenAI, Type } from "@google/genai";
import { SimState, Language } from "../types";

/**
 * Khởi tạo Client AI.
 * Ưu tiên lấy API_KEY từ biến môi trường (Cloudflare) 
 * để ứng dụng có thể chạy tự động mà không cần người dùng thao tác thêm.
 */
const getAIClient = () => {
  const apiKey = (globalThis as any).process?.env?.API_KEY;
  if (!apiKey || apiKey === "" || apiKey === "YOUR_API_KEY") return null;
  return new GoogleGenAI({ apiKey });
};

// Sử dụng model Flash để tối ưu chi phí (Free Tier) và tốc độ phản hồi.
const DEFAULT_MODEL = "gemini-3-flash-preview";

export async function getChemicalAnalysis(state: SimState) {
  const ai = getAIClient();
  if (!ai) return { error: "KEY_REQUIRED" };

  const languagePrompt = state.language === Language.VI 
    ? "Vui lòng phân tích bằng tiếng Việt." 
    : "Please analyze in English.";

  const prompt = `
    Phân tích hóa học chuyên sâu cho thí nghiệm điện phân:
    - Chất điện phân: ${state.electrolyte}
    - Vật liệu Anode (+): ${state.anodeMaterial}
    - Vật liệu Cathode (-): ${state.cathodeMaterial}
    - Điện áp DC: ${state.voltage}V
    
    ${languagePrompt}

    Trả về JSON:
    - anodeReaction: Phản ứng tại cực dương.
    - cathodeReaction: Phản ứng tại cực âm.
    - overallEquation: Phương trình tổng quát.
    - observations: Hiện tượng quan sát được.
    - applications: Ứng dụng thực tế.
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
    if (error.status === 404 || error.status === 401) {
      return { error: "KEY_REQUIRED" };
    }
    return null;
  }
}

let chatSession: any = null;
let lastSessionKey = "";

export async function chatWithAI(message: string, state: SimState) {
  const ai = getAIClient();
  if (!ai) return "ERROR_KEY_REQUIRED";

  const sessionKey = `${state.electrolyte}-${state.anodeMaterial}-${state.language}`;
  
  if (!chatSession || lastSessionKey !== sessionKey) {
    const systemInstruction = `
      Bạn là Trợ lý ảo Phòng thí nghiệm Điện phân.
      Ngữ cảnh: Điện phân ${state.electrolyte} (Anode: ${state.anodeMaterial}, Cathode: ${state.cathodeMaterial}).
      Ngôn ngữ: ${state.language === Language.VI ? 'Tiếng Việt' : 'Tiếng Anh'}.
      Hãy giải thích ngắn gọn, chính xác các hiện tượng hóa học.
    `;

    chatSession = ai.chats.create({
      model: DEFAULT_MODEL,
      config: { systemInstruction }
    });
    lastSessionKey = sessionKey;
  }

  try {
    const result = await chatSession.sendMessage({ message });
    return result.text;
  } catch (error: any) {
    if (error.status === 404) return "ERROR_KEY_REQUIRED";
    return "Hệ thống AI đang bận. Vui lòng thử lại sau.";
  }
}
