// src/utils/logger.ts
import pino from "pino";
import { ENV } from "../config/env";

const isDevelopment = ENV.NODE_ENV === "development" || !ENV.NODE_ENV;

export const logger = pino({
  level: "trace", // Log all levels: trace, debug, info, warn, error, fatal
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
        levelFirst: true,
      },
    },
  }),
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

// Helper functions for common log patterns
export const log = {
  trace: (msg: string, data?: any) => logger.trace(data || {}, msg),
  debug: (msg: string, data?: any) => logger.debug(data || {}, msg),
  info: (msg: string, data?: any) => logger.info(data || {}, msg),
  warn: (msg: string, data?: any) => logger.warn(data || {}, msg),
  error: (msg: string, error?: any) => logger.error({ error }, msg),
  fatal: (msg: string, error?: any) => logger.fatal({ error }, msg),

  // Domain-specific loggers
  recipe: {
    generating: (dishName: string) =>
      logger.info({ dishName }, "🍳 Generating recipe"),
    generated: (dishName: string, duration: number) =>
      logger.info({ dishName, duration }, "✅ Recipe generated"),
    stored: (dishName: string) => logger.info({ dishName }, "💾 Recipe stored"),
  },

  rag: {
    searching: (query: string) => logger.debug({ query }, "🔍 RAG search"),
    found: (count: number, threshold: number) =>
      logger.info({ count, threshold }, "📊 RAG results"),
    similarity: (dishName: string, score: number) =>
      logger.debug({ dishName, score }, "📈 Similarity score"),
  },

  chat: {
    message: (userId: string, messageLength: number) =>
      logger.info({ userId, messageLength }, "💬 Chat message"),
    sessionCreated: (userId: string) =>
      logger.info({ userId }, "✨ Session created"),
    sessionCleaned: (userId: string) =>
      logger.info({ userId }, "🗑️  Session cleaned"),
  },

  server: {
    starting: (port: number) => logger.info({ port }, "🚀 Server starting"),
    started: (port: number) => logger.info({ port }, "✅ Server started"),
    shutdown: () => logger.info("🛑 Shutting down gracefully"),
  },

  db: {
    connected: () => logger.info("✅ MongoDB connected"),
    disconnected: () => logger.info("✅ MongoDB disconnected"),
    vectorStoreInit: () => logger.info("✅ Vector store initialized"),
    vectorStoreDisabled: () => logger.warn("⚠️  Vector store disabled"),
  },
};
