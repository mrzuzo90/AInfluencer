import { Post } from '../shared/types.js';
import { config } from '../shared/config.js';
import { logger } from '../shared/logger.js';

export interface INotifier {
  notify(post: Post, articleTitle: string): Promise<void>;
}

/**
 * Console notifier: logs to console (no external service required)
 * Default fallback
 */
export class ConsoleNotifier implements INotifier {
  async notify(post: Post, articleTitle: string): Promise<void> {
    logger.info('🔔 NOTIFICATION:');
    logger.info(`   📝 Post generated (${post.status}): "${articleTitle}"`);
    logger.info(`   💬 ${post.platform === 'draft' ? 'Review before publishing' : 'Scheduled for publication'}`);
    logger.info(`   🔗 ${post.url || 'Draft - not yet published'}`);
  }
}

/**
 * Telegram notifier: sends to Telegram Bot API
 * Only used if TELEGRAM_BOT_TOKEN is configured
 */
export class TelegramNotifier implements INotifier {
  private botToken: string;
  private chatId: string = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID';
  private apiUrl = 'https://api.telegram.org/bot';

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  async notify(post: Post, articleTitle: string): Promise<void> {
    const message = `📝 *Post Generated* (${post.status})\n\n*Article:* ${articleTitle}\n\n*Platform:* ${post.platform}\n\n*Status:* ${post.status === 'draft' ? '⏳ Review needed' : '✅ Scheduled'}`;

    try {
      const url = `${this.apiUrl}${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        logger.warn(`Telegram notification failed: ${response.status}`);
      } else {
        logger.info('✅ Telegram notification sent');
      }
    } catch (err) {
      logger.error(`Telegram send error: ${err}`);
    }
  }
}

/**
 * Factory to get the right notifier
 */
export function getNotifier(): INotifier {
  if (config.hasTelegram) {
    logger.debug('Using Telegram notifier');
    return new TelegramNotifier(config.telegramBotToken!);
  } else {
    logger.debug('Using console notifier (Telegram not configured)');
    return new ConsoleNotifier();
  }
}
