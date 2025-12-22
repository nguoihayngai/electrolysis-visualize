
import { GoogleGenAI, Type } from "@google/genai";
import { SimState, Language } from "../types";

export async function getChemicalAnalysis(state: SimState) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const languagePrompt = state.language === Language.VI 
    ? "Please provide the analysis in Vietnamese." 
    : "Please provide the analysis in English.";

  const prompt = `
    Analyze the following electrolysis setup:
    Electrolyte: ${state.electrolyte}
    Anode (+): ${state.anodeMaterial}
    Cathode (-): ${state.cathodeMaterial}
    Voltage: ${state.voltage}V
    
    ${languagePrompt}

    Provide a detailed explanation of:
    1. The half-reaction at the Anode.
    2. The half-reaction at the Cathode.
    3. The overall chemical equation.
    4. Observation details (colors, gas types, plating).
    5. Real-world applications of this specific process.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
}

// Global chat instance for persistent history
let activeChat: any = null;
let lastStateHash = "";

export async function chatWithAI(message: string, state: SimState) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const currentStateHash = `${state.electrolyte}-${state.anodeMaterial}-${state.cathodeMaterial}`;
  
  // Re-initialize chat if experiment config changed drastically
  if (!activeChat || currentStateHash !== lastStateHash) {
    const systemInstruction = `
      You are an expert chemist assistant in a virtual electrolysis lab.
      Current Setup:
      - Electrolyte: ${state.electrolyte}
      - Anode: ${state.anodeMaterial}
      - Cathode: ${state.cathodeMaterial}
      - Voltage: ${state.voltage}V
      
      Instructions:
      - Keep answers concise and scientifically accurate.
      - Use markdown for formulas (e.g., H₂O).
      - Respond in ${state.language === Language.VI ? 'Vietnamese' : 'English'}.
      - Explain the physics and chemistry behind the user's observations.
    `;

    activeChat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { systemInstruction }
    });
    lastStateHash = currentStateHash;
  }

  try {
    const result = await activeChat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Chat Error:", error);
    return "Error connecting to Lab Assistant.";
  }
}
