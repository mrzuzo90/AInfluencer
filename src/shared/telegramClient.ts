import { logger } from './logger.js';

export interface TelegramUpdate {
  update_id: number;
  message?: {
    chat: { id: number };
    text: string;
  };
}

/**
 * Thin wrapper around the Telegram Bot API's HTTP endpoints.
 * Single source of truth for both outgoing notifications
 * (notifications/notifier.ts) and the bot command handler
 * (telegram/botCommandHandler.ts) so retry/error-handling behavior
 * only needs to change in one place.
 */
export class TelegramClient {
  private baseUrl: string;

  constructor(private botToken: string) {
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
  }

  async sendMessage(chatId: number | string, text: string): Promise<boolean> {
    if (!this.botToken) {
      logger.warn('Cannot send Telegram message: bot token not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        logger.warn(`Telegram sendMessage failed: ${response.status}`);
        return false;
      }

      logger.info(`✉️  Telegram message sent to ${chatId}`);
      return true;
    } catch (err) {
      logger.error(`Telegram sendMessage error: ${err}`);
      return false;
    }
  }

  async getUpdates(offset: number, timeoutMs = 30000): Promise<TelegramUpdate[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/getUpdates?offset=${offset}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Telegram getUpdates error: ${response.statusText}`);
      }

      const data = (await response.json()) as { ok: boolean; result: TelegramUpdate[] };
      if (!data.ok) {
        throw new Error('Telegram API returned ok:false');
      }

      return data.result;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
