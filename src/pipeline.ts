import { logger } from './shared/logger.js';
import { articleRepo, postRepo } from './shared/repository/factory.js';
import { newsAggregator } from './aggregation/aggregator.js';
import { articleSelector } from './filtering/select.js';
import { ClaudeContentGenerator, TemplateContentGenerator } from './generation/contentGenerator.js';
import { DraftPublisher } from './publishing/draftPublisher.js';
import { getNotifier } from './notifications/notifier.js';
import { config } from './shared/config.js';
import { getTodaysTopic, getTopicEmoji } from './filtering/topicRotation.js';

export async function runPipeline(): Promise<void> {
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('🚀 Starting AInfluencer Pipeline');
  logger.info('═══════════════════════════════════════════════════════════');

  try {
    const topic = getTodaysTopic();

    // 1. Aggregate news
    logger.info(`\n1️⃣ Aggregating news for ${getTopicEmoji(topic)} ${topic}...`);
    const articles = await newsAggregator.aggregate(topic);
    logger.info(`   Found ${articles.length} articles`);

    // Save all articles to repository
    for (const article of articles) {
      await articleRepo.save(article);
    }

    // 2. Filter & select top article
    logger.info('\n2️⃣ Filtering and scoring articles...');
    const selectedArticle = await articleSelector.selectTopArticle(articles);

    if (!selectedArticle) {
      logger.error('No article selected');
      return;
    }

    await articleRepo.save(selectedArticle);

    // 3. Generate content
    logger.info('\n3️⃣ Generating content...');
    const contentGenerator = config.hasAnthropicKey ? new ClaudeContentGenerator() : new TemplateContentGenerator();
    const generatedContent = await contentGenerator.generate(selectedArticle);

    // 4. Publish (draft by default)
    logger.info('\n4️⃣ Publishing...');
    const publisher = new DraftPublisher(postRepo);
    const post = await publisher.publish(selectedArticle.id, generatedContent);

    // 5. Notify
    logger.info('\n5️⃣ Sending notification...');
    const notifier = getNotifier();
    await notifier.notify(post, selectedArticle.title);

    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info('✅ Pipeline completed successfully');
    logger.info('═══════════════════════════════════════════════════════════\n');
  } catch (err) {
    logger.error(`Pipeline error: ${err}`);
    throw err;
  }
}
