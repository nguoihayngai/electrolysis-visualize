
import { GoogleGenAI, Type } from "@google/genai";
import { SimState, Language, CellMode } from "../types";

// Sử dụng model Pro để xử lý các bài toán STEM chính xác hơn
const MODEL_NAME = "gemini-3-pro-preview";

export async function getChemicalAnalysis(state: SimState) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const languagePrompt = state.language === Language.VI 
    ? "Vui lòng phân tích bằng tiếng Việt." 
    : "Please analyze in English.";

  let barrierContext = "";
  if (state.hasSaltBridge) {
    barrierContext += `Hệ thống sử dụng CẦU MUỐI (${state.saltBridgeType}). `;
  }
  if (state.hasMembrane) {
    barrierContext += `Hệ thống sử dụng MÀNG BÁN THẤM (Porous Membrane). `;
  }
  if (!state.hasSaltBridge && !state.hasMembrane && state.mode === CellMode.GALVANIC) {
    barrierContext += `Hệ thống KHÔNG có vật dẫn ion giữa hai cốc (Hở mạch). `;
  }

  const modeContext = state.mode === CellMode.GALVANIC 
    ? `Đây là PIN ĐIỆN HÓA (Galvanic Cell). ${barrierContext} Hãy phân tích sự chuyển dịch ion để cân bằng điện tích và suất điện động thực tế.`
    : `Đây là ĐIỆN PHÂN (Electrolysis). ${barrierContext} Phân tích phản ứng cưỡng bức.`;

  const prompt = `
    Phân tích chi tiết hệ thống hóa học sau:
    - Chế độ: ${state.mode}
    - Chất điện phân: ${state.electrolyte}
    - Điện cực trái: ${state.anodeMaterial}
    - Điện cực phải: ${state.cathodeMaterial}
    - ${modeContext}
    
    CHỈ THỊ ĐỊNH DẠNG CỰC KỲ QUAN TRỌNG (BẮT BUỘC):
    Bạn đang viết văn bản Markdown cho trình render KaTeX. 

    1. PHƯƠNG TRÌNH PHẢN ỨNG CHÍNH: Bắt buộc dùng block LaTeX $$...$$ và PHẢI ĐẶT TRÊN DÒNG RIÊNG, CÓ DÒNG TRỐNG BAO QUANH.
    2. TIÊU ĐỀ (###): Luôn phải bắt đầu bằng một dòng mới hoàn toàn, có dòng trống ở trên. 
    3. CÔNG THỨC TRONG VĂN BẢN: Dùng $...$. 
       - Đảm bảo có khoảng trắng bên ngoài dấu $ để tránh dính chữ.
       - Đặc biệt: Nếu công thức nằm trong ngoặc, hãy thêm dấu cách bên trong ngoặc: viết "( $H_2O$ )" thay vì "($H_2O$)".
    4. MŨI TÊN: Chỉ dùng \\rightarrow. TUYỆT ĐỐI KHÔNG dùng ->.
    
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
            anodeReaction: { type: Type.STRING, description: "Phản ứng tại Anode, dùng LaTeX $$...$$ trên dòng riêng" },
            cathodeReaction: { type: Type.STRING, description: "Phản ứng tại Cathode, dùng LaTeX $$...$$ trên dòng riêng" },
            overallEquation: { type: Type.STRING, description: "Phương trình tổng quát, dùng LaTeX $$...$$ trên dòng riêng" },
            observations: { type: Type.STRING, description: "Hiện tượng (Dùng Markdown ### và LaTeX $$, luôn có dòng trống bao quanh)" },
            applications: { type: Type.STRING, description: "Ứng dụng thực tế" },
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
      model: MODEL_NAME,
      config: {
        systemInstruction: `Bạn là chuyên gia hóa học lý thuyết. 
        QUY TẮC HIỂN THỊ:
        - Các tiêu đề Markdown ### và phương trình $$...$$ PHẢI nằm trên dòng riêng, có dòng trống bao quanh.
        - Công thức lẻ dùng $...$. Thêm dấu cách khi nằm trong ngoặc: "( $...$ )".
        - Mũi tên dùng \\rightarrow.
        - Luôn trả lời bằng ${state.language === Language.VI ? 'Tiếng Việt' : 'Tiếng Anh'}.`
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error: any) {
    return `Lỗi: ${error.message || "AI không thể phản hồi."}`;
  }
};
