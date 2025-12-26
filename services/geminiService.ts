
import { GoogleGenAI, Type } from "@google/genai";
import { SimState, Language } from "../types";

// Sử dụng model Flash cho tất cả các tác vụ để đảm bảo độ ổn định và hạn mức cao cho người dùng free
const MODEL_NAME = "gemini-3-flash-preview";

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
      model: MODEL_NAME,
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
    
    // Xử lý lỗi quota cụ thể
    if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      return { 
        error: state.language === Language.VI 
          ? "Bạn đã hết hạn mức sử dụng AI miễn phí trong hôm nay. Vui lòng thử lại sau vài phút hoặc kiểm tra lại gói cước."
          : "AI Quota exceeded. Please try again in a few minutes or check your billing plan." 
      };
    }
    
    return { error: error.message || "Lỗi kết nối AI" };
  }
}

export const chatWithAI = async (message: string, state: SimState) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: `Bạn là chuyên gia hóa học tại phòng thí nghiệm. Người dùng đang thực hiện thí nghiệm điện phân ${state.electrolyte}. Trả lời ngắn gọn, súc tích bằng ${state.language === Language.VI ? 'Tiếng Việt' : 'Tiếng Anh'}.`
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error: any) {
    console.error("Chat Error:", error);
    
    if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      return state.language === Language.VI 
        ? "Lỗi: Đã hết hạn mức yêu cầu AI. Thử lại sau ít phút."
        : "Error: AI request quota exceeded. Try again later.";
    }
    
    return `Lỗi: ${error.message || "AI không thể phản hồi lúc này."}`;
  }
};
