
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

export const geminiService = {
  // 1. Analyze product image to extract details
  async analyzeProductImage(base64Image: string): Promise<Partial<Product>> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Use gemini-3-flash-preview for multimodal tasks like image analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: "Extract product information from this image. Provide the product name, suggested category, an estimated market price, and a brief description. Return as JSON.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            price: { type: Type.NUMBER },
            description: { type: Type.STRING },
            suggestedSku: { type: Type.STRING }
          },
          required: ["name", "category", "price"]
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      return {};
    }
  },

  // 2. Search Grounding for Market Intelligence
  async getMarketPrice(productName: string): Promise<{ text: string, sources: any[] }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `What is the current average market price for "${productName}"? Provide a brief summary of price trends and competitors.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: response.text || "No information found.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  },

  // 3. Maps Grounding for Vendor Sourcing
  async findSuppliers(productName: string, location: { lat: number, lng: number }): Promise<{ text: string, sources: any[] }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Maps grounding is supported in 2.5 series models as per documentation rules
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find 3 local suppliers or stores that sell "${productName}" near my current location.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.lat,
              longitude: location.lng
            }
          }
        }
      },
    });

    return {
      text: response.text || "No suppliers found nearby.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  },

  // 4. AI Generated Description
  async generateProductDescription(name: string, category: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a professional, concise product description for an item named "${name}" in the category "${category}". Focus on its likely features and benefits. Max 2-3 sentences.`,
      config: {
        systemInstruction: "You are an expert product copywriter. Your goal is to write catchy, accurate, and professional descriptions for an inventory system.",
      },
    });

    return response.text || "";
  }
};
