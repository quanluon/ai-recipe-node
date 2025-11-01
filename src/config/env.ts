// src/config/env.ts
import * as dotenv from "dotenv";

dotenv.config();

export const ENV = {
  // Server
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  API_URL: process.env.API_URL || "http://localhost:3000",
  // Google AI
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || "",
  
  // MongoDB Atlas
  MONGODB_ATLAS_URI: process.env.MONGODB_ATLAS_URI || "",
  MONGODB_ATLAS_DB_NAME: process.env.MONGODB_ATLAS_DB_NAME || "ai_recipe_db",
  MONGODB_ATLAS_COLLECTION_NAME: process.env.MONGODB_ATLAS_COLLECTION_NAME || "recipes",
  MONGODB_ATLAS_INDEX_NAME: process.env.MONGODB_ATLAS_INDEX_NAME || "vector_index",
  
  // Chat
  CHAT_HISTORY_COLLECTION: "chat_history",
  SESSION_INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  
  // AI Model Settings
  RECIPE_MODEL: "gemini-flash-latest",
  CHAT_MODEL: "gemini-flash-latest",
  EMBEDDING_MODEL: "text-embedding-004",
  
  // Generation Settings
  MAX_OUTPUT_TOKENS: 2048,
  TEMPERATURE: 0.3,
  CHAT_TEMPERATURE: 0.7,
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // RAG Settings
  RAG_TOP_K: 5,
  RAG_SIMILARITY_THRESHOLD: 0.15, // Lowered from 0.4 - cosine similarity with embeddings is typically < 0.3
  RAG_CONTEXT_LIMIT: 3,
} as const;

export function validateEnv(): void {
  if (!ENV.GOOGLE_API_KEY) {
    console.warn("⚠️  GOOGLE_API_KEY not set - AI features will not work");
  }
  
  if (!ENV.MONGODB_ATLAS_URI) {
    console.warn("⚠️  MONGODB_ATLAS_URI not set - Vector search and chat persistence disabled");
  }
}

