
import { GoogleGenAI, Type } from "@google/genai";
import { SimState, Language } from "../types";

// Sử dụng model Pro cho phân tích hóa học chuyên sâu và Flash cho chat nhanh
const ANALYSIS_MODEL = "gemini-3-pro-preview";
const CHAT_MODEL = "gemini-3-flash-preview";

export async function getChemicalAnalysis(state: SimState) {
  // Khởi tạo instance AI sử dụng API_KEY từ biến môi trường
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const languagePrompt = state.language === Language.VI 
    ? "Vui lòng phân tích bằng tiếng Việt." 
    : "Please analyze in English.";

  const prompt = `
    Phân tích chi tiết quá trình điện phân:
    - Chất điện phân: ${state.electrolyte}
    - Cực dương (Anode): ${state.anodeMaterial}
    - Cực âm (Cathode): ${state.cathodeMaterial}
    - Điện áp: ${state.voltage}V
    - Màng ngăn: ${state.hasMembrane ? "Có" : "Không"}
    ${languagePrompt}
  `;

  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
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

    if (!response.text) throw new Error("AI returned empty text");
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return { error: error.message || "Lỗi kết nối AI" };
  }
}

export const chatWithAI = async (message: string, state: SimState) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const chat = ai.chats.create({
      model: CHAT_MODEL,
      config: {
        systemInstruction: `Bạn là chuyên gia hóa học tại phòng thí nghiệm. Người dùng đang thực hiện thí nghiệm điện phân ${state.electrolyte}. Trả lời bằng ${state.language === Language.VI ? 'Tiếng Việt' : 'Tiếng Anh'}.`
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error: any) {
    console.error("Chat Error:", error);
    return `Lỗi: ${error.message || "AI không thể phản hồi lúc này."}`;
  }
};
