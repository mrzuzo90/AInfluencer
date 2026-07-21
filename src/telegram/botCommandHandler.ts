import { logger } from '../shared/logger.js';
import { config } from '../shared/config.js';
import { runPipeline } from '../pipeline.js';
import { analyticsRepository } from '../shared/analyticsRepository.js';
import { getTodaysTopic, getTopicEmoji } from '../filtering/topicRotation.js';
import { hybridScheduler } from '../hybrid-profile/index.js';

export interface TelegramMessage {
  chat: { id: number };
  text: string;
}

/**
 * Phase 3: Telegram Bot Command Handler
 * Supports:
 * - /create-trending: Generate trending post now
 * - /create-hybrid [topic-id]: Generate hybrid post
 * - /schedule [time]: Schedule posting at specific time
 * - /analytics: Show today's performance
 * - /draft-list: List pending drafts
 * - /publish [draft-id]: Approve & publish draft
 * - /help: Show available commands
 */
export class BotCommandHandler {
  private botToken: string;
  private baseUrl = 'https://api.telegram.org/bot';

  constructor() {
    this.botToken = config.telegramBotToken || '';
  }

  async handleCommand(message: TelegramMessage): Promise<void> {
    if (!this.botToken) {
      logger.warn('Telegram bot token not configured');
      return;
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    try {
      if (text === '/start' || text === '/help') {
        await this.sendMessage(chatId, this.getHelpMessage());
      } else if (text === '/create-trending') {
        await this.createTrendingPost(chatId);
      } else if (text.startsWith('/create-hybrid')) {
        const topicId = text.split(' ')[1];
        await this.createHybridPost(chatId, topicId);
      } else if (text.startsWith('/schedule')) {
        const time = text.split(' ')[1];
        await this.schedulePosting(chatId, time);
      } else if (text === '/analytics') {
        await this.showAnalytics(chatId);
      } else if (text === '/draft-list') {
        await this.listDrafts(chatId);
      } else if (text.startsWith('/publish')) {
        const draftId = text.split(' ')[1];
        await this.publishDraft(chatId, draftId);
      } else {
        await this.sendMessage(
          chatId,
          '❓ Unknown command. Type /help for available commands.'
        );
      }
    } catch (err) {
      logger.error(`Command handler error: ${err}`);
      await this.sendMessage(
        chatId,
        `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  private async createTrendingPost(chatId: number): Promise<void> {
    await this.sendMessage(chatId, '⏳ Generating trending post...');

    try {
      await runPipeline();
      await this.sendMessage(
        chatId,
        '✅ Trending post generated! Check drafts with /draft-list'
      );
    } catch (err) {
      throw err;
    }
  }

  private async createHybridPost(
    chatId: number,
    _topicId?: string
  ): Promise<void> {
    await this.sendMessage(chatId, '⏳ Generating hybrid profile post...');

    try {
      // TODO: Implement on-demand hybrid post generation with specific topic
      // For now, just trigger pipeline which will route based on scheduler
      await runPipeline();
      await this.sendMessage(
        chatId,
        '✅ Hybrid post created! Check with /draft-list'
      );
    } catch (err) {
      throw err;
    }
  }

  private async schedulePosting(chatId: number, time?: string): Promise<void> {
    const scheduleTime = time || '09:00';
    await this.sendMessage(
      chatId,
      `⏰ Scheduling next post for ${scheduleTime}\n(Requires scheduler setup)`
    );
  }

  private async showAnalytics(chatId: number): Promise<void> {
    try {
      const analytics = await analyticsRepository.getTodaysAnalytics();

      if (!analytics) {
        await this.sendMessage(
          chatId,
          '📊 No analytics available yet for today'
        );
        return;
      }

      const report = `
📊 **Today's Analytics**
━━━━━━━━━━━━━━━━━━━━━━━━━
Posts: ${analytics.totalPosts}
Impressions: ${analytics.totalImpressions.toLocaleString()}
Engagement: ${analytics.totalEngagement}
Avg Engagement Rate: ${(analytics.avgEngagementRate * 100).toFixed(1)}%
${analytics.topPost ? `\n🏆 Top Post: ${analytics.topPost.postId}\nClicks: ${analytics.topPost.clicks} | Engagement Rate: ${(analytics.topPost.engagementRate * 100).toFixed(1)}%` : ''}
      `.trim();

      await this.sendMessage(chatId, report);
    } catch (err) {
      throw err;
    }
  }

  private async listDrafts(chatId: number): Promise<void> {
    await this.sendMessage(
      chatId,
      '📝 Drafts:\n(Database integration pending)\n\nUse /publish [draft-id] to approve & publish'
    );
  }

  private async publishDraft(chatId: number, draftId?: string): Promise<void> {
    if (!draftId) {
      await this.sendMessage(chatId, '❌ Usage: /publish [draft-id]');
      return;
    }

    await this.sendMessage(
      chatId,
      `🚀 Publishing draft ${draftId}...\n(Requires database integration)`
    );
  }

  private getHelpMessage(): string {
    const today = getTodaysTopic();
    const emoji = getTopicEmoji(today);

    return `
🤖 **AInfluencer Bot Commands**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📰 *Content Creation*
  /create-trending     - Generate post from today's news
  /create-hybrid [id]  - Generate hybrid (AI + Electrical)
  /draft-list          - View pending drafts

⏰ *Publishing*
  /schedule [HH:MM]    - Schedule next post
  /publish [draft-id]  - Approve & publish draft

📊 *Analytics*
  /analytics           - Show today's performance

ℹ️ *Other*
  /help                - Show this message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗓️ Today's Topic: ${emoji} ${today}
🔄 Hybrid Rotation: ${hybridScheduler.shouldGenerateHybrid() ? '✅ Enabled' : '⏭️ Next rotation'}
    `.trim();
  }

  async sendMessage(chatId: number, text: string): Promise<void> {
    if (!this.botToken) {
      logger.warn('Cannot send Telegram message: bot token not configured');
      return;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'Markdown',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      logger.info(`✉️  Telegram message sent to ${chatId}`);
    } catch (err) {
      logger.error(`Failed to send Telegram message: ${err}`);
    }
  }

  async startPolling(): Promise<void> {
    if (!this.botToken) {
      logger.info('Telegram bot not configured');
      return;
    }

    logger.info('🤖 Telegram bot polling started...');
    let offset = 0;
    let consecutiveFailures = 0;

    const poll = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(
          `${this.baseUrl}${this.botToken}/getUpdates?offset=${offset}`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Telegram API error: ${response.statusText}`);
        }

        const data = (await response.json()) as {
          ok: boolean;
          result: Array<{ update_id: number; message?: TelegramMessage }>;
        };

        if (!data.ok) {
          logger.error('Telegram API returned error');
          return;
        }

        for (const update of data.result) {
          if (update.message?.text) {
            await this.handleCommand(update.message);
          }
          offset = update.update_id + 1;
        }

        consecutiveFailures = 0;
      } catch (err) {
        logger.error(`Polling error: ${err}`);
        consecutiveFailures++;
      }

      const backoffMs = Math.min(5000 * 2 ** consecutiveFailures, 60000);
      setTimeout(poll, backoffMs);
    };

    poll();
  }
}

export const botCommandHandler = new BotCommandHandler();
