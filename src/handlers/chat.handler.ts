// src/handlers/chat.handler.ts
import { Request, Response } from "express";
import { chatService } from "../services/chat.service";
import { log } from "../utils/logger";

export async function chatHandler(req: Request, res: Response) {
  const { userId, message } = req.body as {
    userId?: string;
    message?: string;
  };

  if (!userId || !message) {
    return res.status(400).json({
      error: "Vui lòng cung cấp 'userId' và 'message'",
    });
  }

  try {
    log.chat.message(userId, message.length);

    const response = await chatService.chat(userId, message);

    res.json({
      success: true,
      userId,
      ...response,
    });
  } catch (error: any) {
    log.error("Chat error", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function getChatHistoryHandler(req: Request, res: Response) {
  const { userId } = req.params;

  try {
    const history = await chatService.getChatHistory(userId);

    res.json({
      success: true,
      userId,
      ...history,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function clearChatHistoryHandler(req: Request, res: Response) {
  const { userId } = req.params;

  const deleted = chatService.clearSession(userId);

  res.json({
    success: true,
    userId,
    deleted,
    message: deleted ? "Đã xóa lịch sử chat" : "Không tìm thấy session",
  });
}

export function getActiveSessionsHandler(req: Request, res: Response) {
  const sessions = chatService.getAllSessions();

  res.json({
    success: true,
    totalSessions: chatService.getTotalSessions(),
    sessions,
  });
}

