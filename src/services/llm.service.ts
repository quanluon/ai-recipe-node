// src/services/llm.service.ts
import { ENV } from "../config/env";
import { ILLMProvider } from "./llm-provider.interface";
import { GeminiProvider } from "./providers/gemini.provider";
import { OpenAIProvider } from "./providers/openai.provider";
import { log } from "../utils/logger";

export class LLMService {
  private provider: ILLMProvider;

  constructor() {
    // Select provider based on ENV
    this.provider = this.createProvider();
    
    if (!this.provider.isAvailable()) {
      throw new Error(`LLM Provider '${this.provider.getProviderName()}' is not available - check API key`);
    }
    
    log.info(`LLM Service initialized with provider: ${this.provider.getProviderName()}`);
  }
  
  private createProvider(): ILLMProvider {
    switch (ENV.LLM_PROVIDER) {
      case "gemini":
        return new GeminiProvider();
      case "openai":
        return new OpenAIProvider();
      default:
        log.warn(`Unknown provider: ${ENV.LLM_PROVIDER}, falling back to Gemini`);
        return new GeminiProvider();
    }
  }
  
  getProvider(): ILLMProvider {
    return this.provider;
  }
  
  getProviderName(): string {
    return this.provider.getProviderName();
  }

  getRecipeLLM() {
    return this.provider.getRecipeLLM();
  }

  getChatLLM() {
    return this.provider.getChatLLM();
  }

  getStructuredLLM() {
    return this.provider.getStructuredLLM();
  }

  async generateRecipe(prompt: string, timeout: number = ENV.REQUEST_TIMEOUT, retries: number = 3) {
    const startTime = Date.now();
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retry (exponential backoff with jitter)
          const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          const jitter = Math.random() * 500; // Add random jitter to avoid thundering herd
          const delay = baseDelay + jitter;
          
          log.warn(`Retry attempt ${attempt}/${retries} after ${Math.round(delay)}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Add timeout wrapper
        const result = await Promise.race([
          this.getStructuredLLM().invoke(prompt),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), timeout)
          ),
        ]);
        
        const duration = Date.now() - startTime;
        
        // Validate result structure
        if (!result || typeof result !== 'object') {
          throw new Error("Invalid response from LLM: result is not an object");
        }
        
        // Additional validation for required fields
        if (!result.dishName || !result.ingredients || !result.steps) {
          throw new Error("Invalid response from LLM: missing required fields");
        }
        
        log.info(`Recipe generated successfully in ${duration}ms (attempt ${attempt + 1})`);
        return { result, duration };
        
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || error.toString();
        
        // Check if it's a retryable error
        const isPartsError = errorMsg.includes('parts') || errorMsg.includes('Cannot read properties of undefined');
        const isRateLimitError = errorMsg.includes('rate_limit') || errorMsg.includes('429') || errorMsg.includes('quota');
        const isTimeoutError = errorMsg.includes('timeout');
        const isNetworkError = errorMsg.includes('ECONNRESET') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('fetch failed');
        
        // Don't retry on validation errors or final timeout
        if (errorMsg.includes('Invalid response') && !isPartsError) {
          log.error(`Non-retryable validation error: ${errorMsg}`);
          break;
        }
        
        // Log detailed error for debugging
        log.error(`Attempt ${attempt + 1}/${retries + 1} failed`, {
          error: errorMsg,
          provider: this.getProviderName(),
          isPartsError,
          isRateLimitError,
          isTimeoutError,
          isNetworkError,
        });
        
        // If this is the last attempt, break
        if (attempt >= retries) {
          break;
        }
        
        // For parts errors, wait longer before retry
        if (isPartsError && attempt < retries) {
          const extraDelay = 2000;
          log.warn(`Parts error detected, adding extra ${extraDelay}ms delay before retry...`);
          await new Promise(resolve => setTimeout(resolve, extraDelay));
        }
      }
    }
    
    // Build user-friendly error message
    const providerName = this.getProviderName();
    const errorMsg = lastError?.message || lastError?.toString() || 'Unknown error';
    
    // Parts error (common Gemini issue)
    if (errorMsg.includes('parts') || errorMsg.includes('Cannot read properties of undefined')) {
      throw new Error(
        `${providerName === 'gemini' ? 'Gemini' : 'LLM'} API returned malformed response. This is usually temporary. Please try again in a few seconds.`
      );
    }
    
    // Rate limit errors
    if (errorMsg.includes('rate_limit') || errorMsg.includes('429')) {
      throw new Error(
        `${providerName.toUpperCase()} rate limit exceeded. Please wait a moment and try again.`
      );
    }
    
    // Quota errors
    if (errorMsg.includes('quota') || errorMsg.includes('InsufficientQuota')) {
      throw new Error(
        `${providerName.toUpperCase()} quota exceeded. ${providerName === 'openai' ? 'Try switching to Gemini (free) by setting LLM_PROVIDER=gemini' : 'Please check your API quota.'}`
      );
    }
    
    // Timeout errors
    if (errorMsg.includes('timeout')) {
      throw new Error(
        `Request timeout after ${timeout}ms. The recipe might be too complex. Try a simpler dish or increase REQUEST_TIMEOUT in .env`
      );
    }
    
    // Network errors
    if (errorMsg.includes('ECONNRESET') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('fetch failed')) {
      throw new Error(
        `Network error connecting to ${providerName.toUpperCase()} API. Please check your internet connection and try again.`
      );
    }
    
    // Generic error with context
    throw new Error(
      `[${providerName.toUpperCase()}] Recipe generation failed after ${retries + 1} attempts: ${errorMsg}`
    );
  }
}

// Singleton instance
export const llmService = new LLMService();

