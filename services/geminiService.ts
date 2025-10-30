import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

if (!import.meta.env.VITE_GEMINI_API_KEY) {
  console.error(
    "VITE_GEMINI_API_KEY environment variable not set. AI features will be disabled."
  );
  throw new Error(
    "VITE_GEMINI_API_KEY environment variable is required for AI features."
  );
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const recommendationSchema = {
  type: Type.OBJECT,
  properties: {
    response_type: {
      type: Type.STRING,
      description:
        "Loại phản hồi. Phải là 'recommendation' (đề xuất) hoặc 'search' (tìm kiếm).",
      enum: ["recommendation", "search"],
    },
    product_ids: {
      type: Type.ARRAY,
      description:
        "Một mảng gồm các ID sản phẩm phù hợp nhất với yêu cầu của người dùng.",
      items: {
        type: Type.NUMBER,
      },
    },
    message: {
      type: Type.STRING,
      description:
        "Một tin nhắn thân thiện. Nếu là 'recommendation', đây là lý do. Nếu là 'search', đây là một xác nhận đơn giản (vd: 'Đây là kết quả cho...').",
    },
  },
  required: ["response_type", "product_ids", "message"],
};

export const getAIRecommendations = async (
  query: string,
  products: Product[]
): Promise<{
  recommendedProducts: Product[];
  message: string;
  responseType: "recommendation" | "search";
}> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return {
      recommendedProducts: [],
      message:
        "Trợ lý AI hiện không khả dụng. Vui lòng kiểm tra cấu hình API key.",
      responseType: "recommendation",
    };
  }

  const simplifiedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    options: p.options,
    totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
  }));

  const prompt = `Bạn là một trợ lý kho AI thân thiện và hữu ích cho một nhà kho cung ứng.
  Một người dùng đang yêu cầu giúp đỡ tìm kiếm vật tư.
  Yêu cầu của người dùng: "${query}"

  Đây là danh sách các vật tư có sẵn ở định dạng JSON, bao gồm cả tổng mức tồn kho:
  ${JSON.stringify(simplifiedProducts)}

  Phân tích yêu cầu của người dùng.
  - Nếu yêu cầu có vẻ là một truy vấn tìm kiếm trực tiếp (ví dụ: chứa các từ như 'tìm', 'kiếm', 'cho tôi xem'), hãy thực hiện tìm kiếm dựa trên từ khóa. Đặt response_type thành 'search' và message thành một câu xác nhận như "Đây là kết quả tìm kiếm cho '[từ khóa]'".
  - Nếu không, hãy coi đó là một yêu cầu đề xuất dựa trên nhu cầu. Đặt response_type thành 'recommendation' và message thành một lời giải thích ngắn gọn, thân thiện cho các lựa chọn của bạn.

  Dựa trên phân tích của bạn, xác định các vật tư phù hợp nhất và trả về ID của chúng. Ưu tiên các mặt hàng còn trong kho.`;

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
    const message: string =
      jsonResponse.message || "Đây là một vài vật tư tôi nghĩ bạn sẽ thích!";
    const responseType: "recommendation" | "search" =
      jsonResponse.response_type || "recommendation";

    const recommendedProducts = products.filter((p) =>
      recommendedIds.includes(p.id)
    );

    return { recommendedProducts, message, responseType };
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    return {
      recommendedProducts: [],
      message:
        "Tôi gặp sự cố khi tìm kiếm đề xuất. Bạn có thể thử diễn đạt lại yêu cầu của mình không?",
      responseType: "recommendation",
    };
  }
};
