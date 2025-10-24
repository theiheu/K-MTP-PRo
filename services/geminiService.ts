
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const recommendationSchema = {
  type: Type.OBJECT,
  properties: {
    product_ids: {
      type: Type.ARRAY,
      description: "An array of product IDs that are the best match for the user's request.",
      items: {
        type: Type.NUMBER,
      },
    },
    reasoning: {
        type: Type.STRING,
        description: "A brief, friendly explanation for why these products were recommended. Address the user directly."
    }
  },
  required: ["product_ids", "reasoning"],
};

export const getAIRecommendations = async (query: string, products: Product[]): Promise<{recommendedProducts: Product[], reasoning: string}> => {
  if (!process.env.API_KEY) {
    return {
      recommendedProducts: [],
      reasoning: "AI Assistant is currently unavailable. Please check the API key configuration."
    };
  }

  const simplifiedProducts = products.map(({ id, name, description, category, price }) => ({
    id,
    name,
    description,
    category,
    price,
  }));

  const prompt = `You are a friendly and helpful AI personal shopper for an e-commerce store.
  A customer is asking for product recommendations.
  Customer's request: "${query}"

  Here is a list of available products in JSON format:
  ${JSON.stringify(simplifiedProducts)}

  Analyze the customer's request and the product list.
  Based on your analysis, identify the most relevant products and return their IDs.
  Also, provide a brief, friendly explanation for your choices.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recommendationSchema,
      },
    });

    const jsonResponse = JSON.parse(response.text);
    const recommendedIds: number[] = jsonResponse.product_ids || [];
    const reasoning: string = jsonResponse.reasoning || "Here are some products I think you'll like!";

    const recommendedProducts = products.filter(p => recommendedIds.includes(p.id));

    return { recommendedProducts, reasoning };
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    return {
      recommendedProducts: [],
      reasoning: "I had trouble finding recommendations. Could you try rephrasing your request?"
    };
  }
};
