// src/handlers/suggest.handler.ts
import { Request, Response } from "express";
import { llmService } from "../services/llm.service";
import { vectorStoreService } from "../services/vector-store.service";
import { log } from "../utils/logger";

export async function suggestRecipeFromIngredientsHandler(req: Request, res: Response) {
  const { 
    ingredients, 
    cookingStyle, 
    servingSize, 
    language = "vi" 
  } = req.body as {
    ingredients?: string[];
    cookingStyle?: "dry" | "soup" | "any"; // khô, nước, bất kỳ
    servingSize?: number;
    language?: string;
  };

  if (!ingredients || ingredients.length === 0) {
    return res.status(400).json({
      error: "Vui lòng cung cấp danh sách 'ingredients'",
    });
  }

  try {
    log.info("Suggesting recipes from ingredients", { 
      ingredientCount: ingredients.length,
      cookingStyle 
    });

    // RAG: Search for recipes using these ingredients with multiple strategies
    let similarRecipes: any[] = [];
    if (vectorStoreService.isAvailable()) {
      try {
        // Try multiple query strategies
        const queries = [
          `món ăn với ${ingredients.slice(0, 3).join(" ")}`, // First 3 ingredients
          `${cookingStyle === "dry" ? "món khô xào" : cookingStyle === "soup" ? "món canh nước" : "món ăn"} ${ingredients[0]}`, // Style + first ingredient
        ];
        
        const allResults = new Map<string, any>();
        for (const searchQuery of queries) {
          const results = await vectorStoreService.searchRecipes(searchQuery, 5);
          results.forEach(doc => {
            if (!allResults.has(doc.metadata?.dishName)) {
              allResults.set(doc.metadata?.dishName, {
                dishName: doc.metadata?.dishName,
                ingredients: doc.pageContent.split("Ingredients:")[1]?.split(".")[0] || "",
              });
            }
          });
        }
        
        similarRecipes = Array.from(allResults.values()).slice(0, 5);
        log.debug(`Found ${similarRecipes.length} unique similar recipes with these ingredients`);
      } catch (err) {
        log.warn("Failed to search similar recipes");
      }
    }

    // Build prompt
    const styleInstruction = cookingStyle === "dry" 
      ? "món khô (xào, rim, nướng)" 
      : cookingStyle === "soup" 
      ? "món nước (canh, súp, lẩu)" 
      : "món khô hoặc nước";
    
    const servingInstruction = servingSize ? `cho ${servingSize} người` : "cho 2-4 người";
    const languageInstruction = language === "eng" ? "English" : "Tiếng Việt";

    const similarContext = similarRecipes.length > 0
      ? `\n\nMột số món tương tự đã được tạo:\n${similarRecipes.map(r => `- ${r.dishName}`).join("\n")}`
      : "";

    const prompt = `Bạn có các nguyên liệu sau:
${ingredients.map((ing, idx) => `${idx + 1}. ${ing}`).join("\n")}

Nhiệm vụ: Gợi ý 2-3 món ăn ${styleInstruction} ${servingInstruction} có thể làm được.
Ngôn ngữ: ${languageInstruction}

Cho mỗi món, trả lời theo format:
**Món [số]**: [Tên món]
- **Độ khả thi**: [Cao/Trung bình/Cần thêm nguyên liệu] 
- **Nguyên liệu đang thiếu**: [Liệt kê nếu có, hoặc "Đủ nguyên liệu"]
- **Hướng dẫn tóm tắt**: [2-3 bước chính]
- **Thời gian**: [Tổng thời gian]

${similarContext}

Ưu tiên món dễ làm, tận dụng tối đa nguyên liệu có sẵn.`;

    const startTime = Date.now();
    const response = await llmService.getChatLLM().invoke(prompt);
    const duration = Date.now() - startTime;

    log.info("Suggestions generated", { duration });

    res.json({
      success: true,
      suggestions: response.content,
      meta: {
        ingredientsUsed: ingredients,
        cookingStyle: cookingStyle || "any",
        servingSize: servingSize || "2-4",
        duration: `${duration}ms`,
        similarRecipesFound: similarRecipes.length,
      },
    });
  } catch (error: any) {
    log.error("Error suggesting recipes", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

