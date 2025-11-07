// src/services/providers/gemini.provider.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ENV } from "../../config/env";
import { RecipeSchema } from "../../schemas/recipe.schema";
import { ILLMProvider } from "../llm-provider.interface";

export class GeminiProvider implements ILLMProvider {
  private recipeLLM: BaseChatModel;
  private chatLLM: BaseChatModel;
  private structuredLLM: any;

  constructor() {
    console.log("Initializing Gemini provider");
    
    // LLM for recipe generation
    const recipeModel = new ChatGoogleGenerativeAI({
      model: ENV.GEMINI_RECIPE_MODEL,
      temperature: ENV.TEMPERATURE,
      apiKey: ENV.GOOGLE_API_KEY,
      maxOutputTokens: ENV.MAX_OUTPUT_TOKENS,
      topP: 0.95,
      topK: 40,
    });
    this.recipeLLM = recipeModel as BaseChatModel;

    // LLM for chat conversations
    const chatModel = new ChatGoogleGenerativeAI({
      model: ENV.GEMINI_CHAT_MODEL,
      temperature: ENV.CHAT_TEMPERATURE,
      apiKey: ENV.GOOGLE_API_KEY,
      maxOutputTokens: 1024,
    });
    this.chatLLM = chatModel as BaseChatModel;

    // Structured output for recipes
    // Note: The 'parts' error from Gemini is usually due to rate limiting or API issues
    // The retry logic in llm.service.ts handles these errors
    this.structuredLLM = recipeModel.withStructuredOutput(RecipeSchema, {
      name: "recipe",
    });
    
    console.log(`Gemini configured: recipe=${ENV.GEMINI_RECIPE_MODEL}, chat=${ENV.GEMINI_CHAT_MODEL}`);
  }

  getRecipeLLM() {
    return this.recipeLLM;
  }

  getChatLLM() {
    return this.chatLLM;
  }

  getStructuredLLM() {
    return this.structuredLLM;
  }
  
  getProviderName(): string {
    return "gemini";
  }
  
  isAvailable(): boolean {
    return !!ENV.GOOGLE_API_KEY;
  }
}

