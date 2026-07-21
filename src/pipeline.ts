import { logger } from './shared/logger.js';
import { articleRepo, postRepo } from './shared/repository/factory.js';
import { newsAggregator } from './aggregation/aggregator.js';
import { articleSelector } from './filtering/select.js';
import { ClaudeContentGenerator, TemplateContentGenerator } from './generation/contentGenerator.js';
import { DraftPublisher } from './publishing/draftPublisher.js';
import { getNotifier } from './notifications/notifier.js';
import { config } from './shared/config.js';
import { getTodaysTopic, getTopicEmoji } from './filtering/topicRotation.js';
import { hybridScheduler, generateHybridPost } from './hybrid-profile/index.js';

export async function runPipeline(): Promise<void> {
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('🚀 Starting AInfluencer Pipeline');
  logger.info('═══════════════════════════════════════════════════════════');

  try {
    const isHybridPost = hybridScheduler.shouldGenerateHybrid();

    if (isHybridPost) {
      // HYBRID PROFILE PATH
      logger.info('\n🧠 HYBRID PROFILE MODE: AI + Electrical Technical Content\n');

      // 1. Generate hybrid topic
      logger.info('1️⃣ Selecting hybrid profile topic...');
      const { topic, ...generatedContent } = await generateHybridPost();
      logger.info(`   Topic: ${topic.title}`);
      logger.info(`   Type: ${topic.type}`);
      logger.info(`   Audience: ${topic.targetAudience.join(', ')}`);

      // 2. Create pseudo-article for tracking
      const hybridArticle = {
        id: `hybrid-${Date.now()}`,
        title: topic.title,
        description: topic.description,
        url: `#hybrid-profile`,
        source: 'Hybrid Profile Content',
        publishedAt: new Date().toISOString(),
        content: topic.description,
        category: 'hybrid-profile',
        trendingScore: 75,
        monetizationScore: 80,
        finalScore: 78,
        evaluatedAt: new Date().toISOString(),
      };

      await articleRepo.save(hybridArticle);

      // 3. Publish
      logger.info('\n3️⃣ Publishing hybrid content...');
      const publisher = new DraftPublisher(postRepo);
      const post = await publisher.publish(hybridArticle.id, generatedContent);

      // 4. Notify
      logger.info('\n4️⃣ Sending notification...');
      const notifier = getNotifier();
      await notifier.notify(post, `[HYBRID] ${topic.title}`);
    } else {
      // TRENDING NEWS PATH (original)
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
      const contentGenerator = config.hasAnthropicKey
        ? new ClaudeContentGenerator()
        : new TemplateContentGenerator();
      const generatedContent = await contentGenerator.generate(selectedArticle);

      // 4. Publish (draft by default)
      logger.info('\n4️⃣ Publishing...');
      const publisher = new DraftPublisher(postRepo);
      const post = await publisher.publish(selectedArticle.id, generatedContent);

      // 5. Notify
      logger.info('\n5️⃣ Sending notification...');
      const notifier = getNotifier();
      await notifier.notify(post, selectedArticle.title);
    }

    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info('✅ Pipeline completed successfully');
    logger.info('═══════════════════════════════════════════════════════════\n');
  } catch (err) {
    logger.error(`Pipeline error: ${err}`);
    throw err;
  }
}
