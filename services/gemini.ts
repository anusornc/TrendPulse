
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { SourceType, NewsItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const fetchNewsForTopic = async (topic: string) => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    TASK: Find and summarize the absolute latest news and updates (within the last 24 hours) about "${topic}".
    SOURCES: You MUST search X.com (Twitter), YouTube, and major tech news outlets.
    
    CONSTRAINTS:
    1. Only include news items where you have a REAL, VERIFIED direct URL from the search results. 
    2. DO NOT make up URLs or use placeholders (e.g., do not use example.com, status/123, or fake IDs). 
    3. If you do not have a direct, valid link to the specific piece of news, DO NOT include that item in the list.
    4. Ensure the headlines and summaries are factually grounded in the search results.
    5. Provide a high-level executive synthesis of the day's major trends first.
    
    RESPONSE FORMAT (JSON ONLY): 
    {
      "brief": "A 2-3 paragraph professional synthesis of the day's biggest developments.",
      "newsItems": [
        {
          "type": "X" | "YouTube" | "News",
          "title": "Headline",
          "summary": "1-2 sentence description",
          "url": "DIRECT_REAL_URL_FROM_SEARCH",
          "source": "Site Name or Author"
        }
      ]
    }
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0, // Minimize hallucinations
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brief: { type: Type.STRING },
            newsItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["X", "YouTube", "News"] },
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  url: { type: Type.STRING },
                  source: { type: Type.STRING },
                },
                required: ["type", "title", "summary", "url", "source"]
              }
            }
          },
          required: ["brief", "newsItems"]
        }
      },
    });

    const result = JSON.parse(response.text || '{}');
    
    // Map JSON response to internal NewsItem structure
    const newsItems: NewsItem[] = (result.newsItems || []).map((item: any, index: number) => {
      let type = SourceType.NEWS;
      if (item.type === 'X') type = SourceType.X;
      if (item.type === 'YouTube') type = SourceType.YOUTUBE;

      return {
        id: `item-${index}-${Date.now()}`,
        title: item.title,
        summary: item.summary,
        url: item.url,
        source: item.source,
        type: type
      };
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingSources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || 'Source',
        uri: chunk.web.uri || '',
      }));

    return {
      brief: result.brief || "No summary available for this topic at the moment.",
      newsItems,
      groundingSources,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const translateNewsItem = async (title: string, summary: string) => {
  const model = 'gemini-3-flash-preview';
  const prompt = `Translate the following news item into Thai. Keep the tone professional and journalistic.
  
  Title: ${title}
  Summary: ${summary}
  
  Provide the result in JSON format with "title" and "summary" keys.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: ["title", "summary"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Translation Error:", error);
    throw error;
  }
};

export const translateLargeText = async (text: string) => {
  const model = 'gemini-3-flash-preview';
  const prompt = `Translate the following executive news summary into Thai. 
  Keep it professional, high-level, and maintain the original formatting/tone.
  
  Text: ${text}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
      }
    });

    return response.text || '';
  } catch (error) {
    console.error("Large Text Translation Error:", error);
    throw error;
  }
};
