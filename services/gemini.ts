
import { GoogleGenAI, Type } from "@google/genai";

export interface SafetyAnalysisResponse {
  summary: string;
  entities: {
    locations: string[];
    equipment: string[];
    personnel: string[];
  };
}

export const geminiService = {
  translate: async (text: string, targetLang: 'en' | 'ar') => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate the following airport ground operations text to ${targetLang === 'en' ? 'English' : 'Arabic'}: "${text}". Return only the translated text.`,
      });
      return response.text?.trim() || text;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  },

  summarizeChat: async (messages: any[]) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const conversation = messages.map(m => `${m.senderName}: ${m.text}`).join("\n");
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize this airport ground operations chat log into a single concise paragraph focusing on key actions and status updates: \n\n${conversation}`,
      });
      return response.text?.trim() || "Could not generate summary.";
    } catch (error) {
      console.error("Summarization error:", error);
      return "Summary unavailable.";
    }
  },

  analyzeSafetyReport: async (report: string): Promise<SafetyAnalysisResponse | null> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following airport safety report. Provide a professional analysis summary and extract all mentioned locations, equipment, and personnel into structured lists.
        Report: "${report}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "Brief summary of the incident and recommended actions."
              },
              entities: {
                type: Type.OBJECT,
                properties: {
                  locations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of gates, stands, terminals, or ramp areas mentioned."
                  },
                  equipment: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of aircraft, ground support equipment, vehicles, or tools mentioned."
                  },
                  personnel: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of specific staff names or roles mentioned."
                  }
                },
                required: ["locations", "equipment", "personnel"]
              }
            },
            required: ["summary", "entities"]
          }
        }
      });
      
      const text = response.text?.trim();
      if (!text) return null;
      return JSON.parse(text) as SafetyAnalysisResponse;
    } catch (error) {
      console.error("Safety Analysis error:", error);
      return null;
    }
  },

  generateBriefing: async (tasks: any[]) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const taskStr = tasks.map(t => `${t.title} at ${t.location} (${t.status})`).join(", ");
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize these current ground operations tasks into a 30-second shift briefing for airport staff: ${taskStr}`,
      });
      return response.text?.trim();
    } catch (error) {
      return "Briefing generation failed.";
    }
  }
};
