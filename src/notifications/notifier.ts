import { Post } from '../shared/types.js';
import { config } from '../shared/config.js';
import { logger } from '../shared/logger.js';
import { TelegramClient } from '../shared/telegramClient.js';

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
  private client: TelegramClient;
  private chatId: string;

  constructor(botToken: string) {
    this.client = new TelegramClient(botToken);
    this.chatId = config.telegramChatId?.toString() || process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID';
  }

  async notify(post: Post, articleTitle: string): Promise<void> {
    const message = `📝 *Post Generated* (${post.status})\n\n*Article:* ${articleTitle}\n\n*Platform:* ${post.platform}\n\n*Status:* ${post.status === 'draft' ? '⏳ Review needed' : '✅ Scheduled'}`;
    const sent = await this.client.sendMessage(this.chatId, message);
    if (sent) {
      logger.info('✅ Telegram notification sent');
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
