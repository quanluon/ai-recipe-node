// src/schemas/recipe.schema.ts
import { z } from "zod";

export const StepSchema = z.object({
  description: z.string().describe("Mô tả chi tiết một bước nấu."),
  image: z
    .string()
    .describe("URL của hình ảnh minh hoạ bước nấu.")
    .nullable()
    .optional(),
});

export const StepsArraySchema = z
  .array(
    z.object({
      stepNumber: z.number().describe("Số thứ tự bước"),
      description: z.string().describe("Mô tả chi tiết bước nấu"),
      videoUrl: z.string().describe("URL video hướng dẫn cho bước này (YouTube/TikTok), để trống nếu không có").optional(),
    })
  )
  .describe("Danh sách các bước thực hiện (3-6 bước)");

export const IngredientSchema = z.object({
  name: z.string().describe("Tên nguyên liệu"),
  quantity: z.string().describe("Số lượng và đơn vị (ví dụ: 2 củ)"),
  calories: z.number().describe("Calories ước tính cho số lượng nguyên liệu này (kcal)"),
  whereToFind: z.string().describe("Gợi ý nơi mua ở Việt Nam (vd: Chợ, siêu thị, cửa hàng thực phẩm)").optional(),
});

export const NutritionSchema = z.object({
  calories: z.number().describe("Tổng calories (kcal) cho một suất ăn"),
  protein: z.number().describe("Protein (g) cho một suất ăn"),
  carbs: z.number().describe("Carbohydrate (g) cho một suất ăn"),
  fat: z.number().describe("Chất béo (g) cho một suất ăn"),
  fiber: z.number().describe("Chất xơ (g) cho một suất ăn").optional(),
  sodium: z.number().describe("Natri (mg) cho một suất ăn").optional(),
});

export const RecipeSchema = z.object({
  dishName: z.string().describe("Tên đầy đủ của món ăn."),
  description: z.string().describe("Mô tả món ăn"),
  prepTime: z.string().describe("Thời gian chuẩn bị (ví dụ: 15 phút)."),
  cookTime: z.string().describe("Thời gian nấu (ví dụ: 30 phút)."),
  servings: z.string().describe("Số suất ăn theo yêu cầu (ví dụ: 4 người)."),
  ingredients: z
    .array(IngredientSchema)
    .describe("Danh sách các nguyên liệu cần thiết với gợi ý nơi mua."),
  steps: StepsArraySchema,
  shoppingTips: z.string().describe("Lời khuyên chung về mua nguyên liệu ở Việt Nam (chợ nào tốt, thời gian nào rẻ)").optional(),
  nutrition: NutritionSchema.describe("Thông tin dinh dưỡng ước tính cho một suất ăn"),
});

export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipeStep = z.infer<typeof StepsArraySchema>[number];
export type Nutrition = z.infer<typeof NutritionSchema>;

