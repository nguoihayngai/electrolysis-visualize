
import { GoogleGenAI, Type } from "@google/genai";
import { SimState, Language } from "../types";

/**
 * Lấy instance AI mới nhất. 
 * Theo quy định, chúng ta tạo instance mới ngay trước khi gọi API.
 */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

const DEFAULT_MODEL = "gemini-3-flash-preview";

export async function getChemicalAnalysis(state: SimState) {
  const ai = getAI();
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
    // Nếu lỗi do thực thể không tìm thấy hoặc lỗi xác thực
    if (error.message?.includes("not found") || error.status === 401 || error.status === 404) {
      return { error: "KEY_REQUIRED" };
    }
    return null;
  }
}

export async function chatWithAI(message: string, state: SimState) {
  const ai = getAI();
  if (!ai) return "ERROR_KEY_REQUIRED";

  const systemInstruction = `
    Bạn là Trợ lý ảo Phòng thí nghiệm Điện phân.
    Ngữ cảnh: Điện phân ${state.electrolyte} (Anode: ${state.anodeMaterial}, Cathode: ${state.cathodeMaterial}).
    Ngôn ngữ: ${state.language === Language.VI ? 'Tiếng Việt' : 'Tiếng Anh'}.
    Hãy giải thích ngắn gọn, chính xác các hiện tượng hóa học.
  `;

  try {
    const chat = ai.chats.create({
      model: DEFAULT_MODEL,
      config: { systemInstruction }
    });
    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error: any) {
    console.error("Chat AI Error:", error);
    if (error.status === 401 || error.status === 404) return "ERROR_KEY_REQUIRED";
    return "Hệ thống AI đang bận. Vui lòng thử lại sau.";
  }
}
