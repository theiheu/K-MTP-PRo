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
      description: "Một mảng gồm các ID sản phẩm phù hợp nhất với yêu cầu của người dùng.",
      items: {
        type: Type.NUMBER,
      },
    },
    reasoning: {
        type: Type.STRING,
        description: "Một lời giải thích ngắn gọn, thân thiện về lý do tại sao những sản phẩm này được đề xuất. Hãy nói chuyện trực tiếp với người dùng."
    }
  },
  required: ["product_ids", "reasoning"],
};

export const getAIRecommendations = async (query: string, products: Product[]): Promise<{recommendedProducts: Product[], reasoning: string}> => {
  if (!process.env.API_KEY) {
    return {
      recommendedProducts: [],
      reasoning: "Trợ lý AI hiện không khả dụng. Vui lòng kiểm tra cấu hình API key."
    };
  }

  const simplifiedProducts = products.map(({ id, name, description, category, price, stock }) => ({
    id,
    name,
    description,
    category,
    price,
    stock
  }));

  const prompt = `Bạn là một trợ lý kho AI thân thiện và hữu ích cho một nhà kho cung ứng.
  Một người dùng đang yêu cầu giúp đỡ tìm kiếm vật tư.
  Yêu cầu của người dùng: "${query}"

  Đây là danh sách các vật tư có sẵn ở định dạng JSON, bao gồm cả mức tồn kho:
  ${JSON.stringify(simplifiedProducts)}

  Phân tích yêu cầu của người dùng và danh sách vật tư.
  Dựa trên phân tích của bạn, xác định các vật tư phù hợp nhất và trả về ID của chúng.
  Đồng thời, cung cấp một lời giải thích ngắn gọn, thân thiện cho các lựa chọn của bạn. Ưu tiên các mặt hàng còn trong kho.`;

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
    const reasoning: string = jsonResponse.reasoning || "Đây là một vài vật tư tôi nghĩ bạn sẽ thích!";

    const recommendedProducts = products.filter(p => recommendedIds.includes(p.id));

    return { recommendedProducts, reasoning };
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    return {
      recommendedProducts: [],
      reasoning: "Tôi gặp sự cố khi tìm kiếm đề xuất. Bạn có thể thử diễn đạt lại yêu cầu của mình không?"
    };
  }
};