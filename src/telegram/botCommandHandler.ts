import { logger } from '../shared/logger.js';
import { config } from '../shared/config.js';
import { runTrendingPost, runHybridPost } from '../pipeline.js';
import { analyticsRepo, postRepo } from '../shared/repository/factory.js';
import { getTodaysTopic, getTopicEmoji } from '../filtering/topicRotation.js';
import { hybridScheduler } from '../hybrid-profile/index.js';
import { TelegramClient, TelegramUpdate } from '../shared/telegramClient.js';
import { rescheduleDailyRun, getScheduledTime } from '../scheduler.js';
import { LinkedInPublisher } from '../publishing/draftPublisher.js';
import { YouTubePublisher } from '../publishing/youtubePublisher.js';
import { videoAssembler } from '../video/videoAssembler.js';
import { GeneratedContent } from '../shared/types.js';
import {
  fetchVideoStats,
  extractYouTubeVideoId,
} from '../publishing/youtubeAnalytics.js';

export type TelegramMessage = NonNullable<TelegramUpdate['message']>;

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
  private client: TelegramClient;

  constructor() {
    this.botToken = config.telegramBotToken || '';
    this.client = new TelegramClient(this.botToken);
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
    await runTrendingPost();
    await this.sendMessage(
      chatId,
      '✅ Trending post generated! Check drafts with /draft-list'
    );
  }

  private async createHybridPost(
    chatId: number,
    _topicId?: string
  ): Promise<void> {
    await this.sendMessage(chatId, '⏳ Generating hybrid profile post...');
    // TODO: honor a specific topic id instead of the scheduler's random pick
    await runHybridPost();
    await this.sendMessage(
      chatId,
      '✅ Hybrid post created! Check with /draft-list'
    );
  }

  private async schedulePosting(chatId: number, time?: string): Promise<void> {
    if (!time) {
      await this.sendMessage(
        chatId,
        `⏰ Current schedule: ${getScheduledTime()}\nUsage: /schedule HH:MM (24h)`
      );
      return;
    }

    try {
      rescheduleDailyRun(time);
      await this.sendMessage(chatId, `✅ Daily pipeline rescheduled to run at ${time}`);
    } catch (err) {
      await this.sendMessage(
        chatId,
        `❌ ${err instanceof Error ? err.message : 'Invalid time'} — use HH:MM, e.g. /schedule 09:30`
      );
    }
  }

  /**
   * Best-effort refresh of live YouTube view/like counts for published
   * videos before reading the analytics rollup, so /analytics reflects
   * real YouTube Analytics data when credentials are configured.
   */
  private async refreshYouTubeMetrics(): Promise<void> {
    if (!config.hasYoutube) return;

    const posts = await postRepo.findAll();
    const youtubePosts = posts.filter(
      (p) => p.platform === 'youtube' && p.status === 'published' && p.url
    );

    for (const post of youtubePosts) {
      const videoId = extractYouTubeVideoId(post.url!);
      if (!videoId) continue;

      const stats = await fetchVideoStats(videoId);
      if (!stats) continue;

      const now = new Date().toISOString();
      await analyticsRepo.saveMetrics({
        postId: post.id,
        platform: 'youtube',
        impressions: stats.views,
        clicks: 0,
        shares: 0,
        comments: stats.comments,
        engagementRate: stats.views > 0 ? stats.likes / stats.views : 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  private async showAnalytics(chatId: number): Promise<void> {
    await this.refreshYouTubeMetrics().catch((err) =>
      logger.warn(`YouTube metrics refresh failed (non-fatal): ${err}`)
    );

    const analytics = await analyticsRepo.getTodaysAnalytics();

    if (!analytics) {
      await this.sendMessage(chatId, '📊 No analytics available yet for today');
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
  }

  private async listDrafts(chatId: number): Promise<void> {
    const posts = await postRepo.findAll();
    const drafts = posts.filter((p) => p.status === 'draft').slice(-10);

    if (drafts.length === 0) {
      await this.sendMessage(chatId, '📝 No pending drafts.');
      return;
    }

    const lines = drafts.map((d) => {
      const snippet = d.content.replace(/\n/g, ' ').slice(0, 60);
      return `\`${d.id.slice(0, 8)}\` [${d.platform}] ${snippet}${snippet.length === 60 ? '…' : ''}`;
    });

    await this.sendMessage(
      chatId,
      `📝 **Pending Drafts** (${drafts.length})\n━━━━━━━━━━━━━━━━━━━━━━━━━\n${lines.join('\n')}\n\nUse /publish <id> to approve & publish one.`
    );
  }

  private async publishDraft(chatId: number, draftId?: string): Promise<void> {
    if (!draftId) {
      await this.sendMessage(chatId, '❌ Usage: /publish [draft-id]');
      return;
    }

    const posts = await postRepo.findAll();
    const draft = posts.find((p) => p.id.startsWith(draftId));

    if (!draft) {
      await this.sendMessage(chatId, `❌ No draft found matching "${draftId}"`);
      return;
    }

    if (draft.status !== 'draft') {
      await this.sendMessage(chatId, `⚠️ That post is already "${draft.status}", not a pending draft.`);
      return;
    }

    await this.sendMessage(chatId, `🚀 Publishing draft ${draft.id.slice(0, 8)}...`);

    const content: GeneratedContent = {
      linkedinPost: draft.content,
      hooks: draft.hooks?.split(' | '),
      hashtags: draft.hashtags?.split(' '),
      script: draft.script,
    };

    let resultStatus: string;
    if (draft.platform === 'youtube') {
      const video = await videoAssembler.assemble(draft.articleId, content);
      const youtubePublisher = new YouTubePublisher(postRepo);
      const published = await youtubePublisher.publishVideo(draft.articleId, content, video);
      resultStatus = published.status;
    } else {
      const linkedinPublisher = new LinkedInPublisher(postRepo);
      const published = await linkedinPublisher.publish(draft.articleId, content);
      resultStatus = published.status;
    }

    await postRepo.updateStatus(draft.id, resultStatus as 'draft' | 'scheduled' | 'published' | 'failed');

    await this.sendMessage(
      chatId,
      resultStatus === 'draft'
        ? `⚠️ Publish attempted but credentials aren't configured for ${draft.platform} — still a draft.`
        : `✅ Draft ${draft.id.slice(0, 8)} is now "${resultStatus}"`
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
    await this.client.sendMessage(chatId, text);
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
        const updates = await this.client.getUpdates(offset);

        for (const update of updates) {
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
