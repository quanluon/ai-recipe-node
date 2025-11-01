// src/services/rag.service.ts
import { Document } from "@langchain/core/documents";
import { vectorStoreService } from "./vector-store.service";
import { CATEGORY_PROMPT_HINTS, SupportedCategory } from "../config/constants";
import { ENV } from "../config/env";
import { log } from "../utils/logger";

export class RAGService {
  async retrieveContext(
    dishName: string,
    categories: string[]
  ): Promise<{ context: string; recipesFound: number; queriesUsed: string[] }> {
    if (!vectorStoreService.isAvailable()) {
      log.warn("Vector store not available - skipping RAG");
      return { context: "", recipesFound: 0, queriesUsed: [] };
    }

    try {
      // Try multiple query strategies for better coverage
      const queries: string[] = [
        dishName, // Simple exact dish name
        `${dishName} công thức`, // Dish name + recipe keyword
      ];

      // Add category-enhanced query if categories provided
      if (categories.length > 0) {
        const categoryContext = categories
          .map((c) => CATEGORY_PROMPT_HINTS[c as SupportedCategory])
          .filter(Boolean)
          .join(" ");
        if (categoryContext) {
          queries.push(`${dishName} ${categoryContext}`);
        }
      }

      log.info(`RAG: Testing ${queries.length} query strategies for "${dishName}"`);
      
      // Try each query and combine results
      const allResults = new Map<string, [Document, number]>(); // Use Map to deduplicate by dishName
      
      for (const query of queries) {
        log.rag.searching(query);
        
        const resultsWithScore = await vectorStoreService.searchSimilarRecipes(
          query,
          ENV.RAG_TOP_K * 2, // Fetch more to ensure coverage
          ENV.RAG_SIMILARITY_THRESHOLD
        );

        // Add to combined results (keep best score for each dish)
        resultsWithScore.forEach(([doc, score]) => {
          const dishKey = doc.metadata?.dishName || "unknown";
          const existing = allResults.get(dishKey);
          if (!existing || score < existing[1]) { // Lower score = better similarity
            allResults.set(dishKey, [doc, score]);
          }
        });

        log.debug(`Query "${query}" found ${resultsWithScore.length} results`);
      }

      // Convert Map to sorted array (best scores first)
      const combinedResults = Array.from(allResults.values()).sort((a, b) => a[1] - b[1]);
      
      log.rag.found(combinedResults.length, ENV.RAG_SIMILARITY_THRESHOLD);

      // Log similarity scores for all combined results
      combinedResults.forEach(([doc, score]) => {
        const similarity = 1 - score;
        log.rag.similarity(doc.metadata?.dishName || "Unknown", similarity);
      });

      // Take top results
      const topResults = combinedResults.slice(0, ENV.RAG_CONTEXT_LIMIT);

      if (topResults.length === 0) {
        log.warn("No recipes above threshold - generating from scratch");
        return { context: "", recipesFound: 0, queriesUsed: queries };
      }

      // Build rich context
      const contextString = topResults
        .map(([doc, score], idx) => {
          const similarity = (1 - score).toFixed(2);
          return `Công thức tham khảo ${idx + 1} (độ tương đồng: ${similarity}):
${doc.metadata?.dishName} - ${doc.metadata?.description || "N/A"}
Nguyên liệu chính: ${doc.pageContent.split(".")[2] || "N/A"}
Thời gian: Chuẩn bị ${doc.metadata?.prepTime}, Nấu ${doc.metadata?.cookTime}, Phục vụ ${doc.metadata?.servings}`;
        })
        .join("\n\n");

      const formattedContext = `\n\n=== THAM KHẢO CÁC CÔNG THỨC TƯƠNG TỰ ===\n${contextString}\n\n=== YÊU CẦU ===\nDựa vào các công thức trên, tạo công thức MỚI và SÁNG TẠO với phong cách riêng. Đảm bảo có ít nhất 3 bước chi tiết.`;

      log.info(`Using ${topResults.length} high-quality similar recipes from ${combinedResults.length} total matches`);

      return {
        context: formattedContext,
        recipesFound: topResults.length,
        queriesUsed: queries,
      };
    } catch (error: any) {
      log.error("RAG retrieval failed", error);
      return { context: "", recipesFound: 0, queriesUsed: [] };
    }
  }
}

// Singleton instance
export const ragService = new RAGService();
