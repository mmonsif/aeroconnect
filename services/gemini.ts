
import { OpenRouter } from '@openrouter/sdk';

export interface SafetyAnalysisResponse {
  summary: string;
  entities: {
    locations: string[];
    equipment: string[];
    personnel: string[];
  };
}

export interface TextAnalysisResponse {
  fullReport: string;
}

const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

// Only throw error if we're actually trying to use AI features and no key is set
const validateApiKey = () => {
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    throw new Error('OpenRouter API key not configured');
  }
};

const openRouter = new OpenRouter({
  apiKey: apiKey,
});

const callOpenRouter = async (messages: any[], model: string = 'openai/gpt-4o-mini') => {
  const completion = await openRouter.chat.send({
    model: model,
    messages: messages,
    stream: false,
    temperature: 0.7,
    maxTokens: 1000
  }, {
    headers: {
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AeroConnect Airport Management'
    }
  });

  const content = completion.choices[0]?.message?.content;
  return typeof content === 'string' ? content.trim() : '';
};

export const geminiService = {
  translate: async (text: string, targetLang: 'en' | 'ar') => {
    try {
      validateApiKey();
      const messages = [
        {
          role: 'user',
          content: `Translate the following airport ground operations text to ${targetLang === 'en' ? 'English' : 'Arabic'}. Return only the translated text without any additional comments or explanations: "${text}"`
        }
      ];

      const translated = await callOpenRouter(messages);
      return translated || text;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  },

  summarizeChat: async (messages: any[]) => {
    try {
      validateApiKey();
      const conversation = messages.map(m => `${m.senderName}: ${m.text}`).join("\n");
      const promptMessages = [
        {
          role: 'user',
          content: `Summarize the following conversation:\n\n${conversation}`
        }
      ];

      const summary = await callOpenRouter(promptMessages);
      return summary || "Could not generate summary.";
    } catch (error) {
      console.error("Summarization error:", error);
      return "Summary unavailable.";
    }
  },

  analyzeSafetyReport: async (report: string): Promise<SafetyAnalysisResponse | null> => {
    try {
      validateApiKey();
      const messages = [
        {
          role: 'user',
          content: `Analyze the following airport safety report. Provide a professional analysis summary and extract all mentioned locations, equipment, and personnel into structured JSON format.

Report: "${report}"

Return the response as valid JSON with this exact structure:
{
  "summary": "Brief summary of the incident and recommended actions.",
  "entities": {
    "locations": ["List of gates, stands, terminals, or ramp areas mentioned"],
    "equipment": ["List of aircraft, ground support equipment, vehicles, or tools mentioned"],
    "personnel": ["List of specific staff names or roles mentioned"]
  }
}`
        }
      ];

      const response = await callOpenRouter(messages);

      if (!response) return null;

      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      try {
        return JSON.parse(jsonMatch[0]) as SafetyAnalysisResponse;
      } catch {
        return null;
      }
    } catch (error) {
      console.error("Analysis error:", error);
      return null;
    }
  },

  analyzeText: async (text: string): Promise<TextAnalysisResponse | null> => {
    try {
      validateApiKey();
      const messages = [
        {
          role: 'user',
          content: `Provide a comprehensive analysis report of the following text. Include key insights, main points, and any relevant observations:\n\n"${text}"`
        }
      ];

      const response = await callOpenRouter(messages);

      if (!response) return null;

      return { fullReport: response };
    } catch (error) {
      console.error("Text analysis error:", error);
      return null;
    }
  },

  generateBriefing: async (tasks: any[]) => {
    try {
      validateApiKey();
      const taskStr = tasks.map(t => `${t.title} at ${t.location} (${t.status})`).join(", ");
      const messages = [
        {
          role: 'user',
          content: `Summarize these current ground operations tasks into a 30-second shift briefing for airport staff. Make it concise and actionable: ${taskStr}`
        }
      ];

      const briefing = await callOpenRouter(messages);
      return briefing || "Briefing generation failed.";
    } catch (error) {
      console.error("Briefing generation error:", error);
      return "Briefing generation failed.";
    }
  }
};
