import { logger } from './shared/logger.js';
import { articleRepo, postRepo } from './shared/repository/factory.js';
import { newsAggregator } from './aggregation/aggregator.js';
import { articleSelector } from './filtering/select.js';
import { ClaudeContentGenerator, TemplateContentGenerator } from './generation/contentGenerator.js';
import { selectPublisher } from './publishing/videoPublisher.js';
import { getNotifier } from './notifications/notifier.js';
import { config } from './shared/config.js';
import { getTodaysTopic, getTopicEmoji } from './filtering/topicRotation.js';
import { hybridScheduler, generateHybridPost } from './hybrid-profile/index.js';
import { pipelineEvents } from './dashboard/pipelineEvents.js';

/**
 * Generates and publishes a hybrid profile post (AI + Electrical), regardless
 * of the scheduler's rotation cadence. Used by the daily pipeline when the
 * scheduler picks hybrid, and directly by /create-hybrid so the command name
 * actually reflects what gets generated.
 */
export async function runHybridPost(): Promise<void> {
  logger.info('\n🧠 HYBRID PROFILE MODE: AI + Electrical Technical Content\n');
  pipelineEvents.startRun('hybrid');

  try {
    // 1. Generate hybrid topic
    logger.info('1️⃣ Selecting hybrid profile topic...');
    pipelineEvents.emitStep('select-topic', 'Selecting hybrid profile topic', 'running');
    const { topic, ...generatedContent } = await generateHybridPost();
    logger.info(`   Topic: ${topic.title}`);
    logger.info(`   Type: ${topic.type}`);
    logger.info(`   Audience: ${topic.targetAudience.join(', ')}`);
    pipelineEvents.emitStep('select-topic', 'Selecting hybrid profile topic', 'done', topic.title);

    // 2. Create pseudo-article for tracking
    pipelineEvents.emitStep('create-article', 'Creating hybrid content record', 'running');
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
    pipelineEvents.emitStep('create-article', 'Creating hybrid content record', 'done');

    // 3. Publish (use VideoPublisher if video is enabled)
    logger.info('\n3️⃣ Publishing hybrid content...');
    pipelineEvents.emitStep('publish', 'Publishing hybrid content', 'running');
    const publisher = selectPublisher(postRepo);
    const post = await publisher.publish(hybridArticle.id, generatedContent);
    pipelineEvents.emitStep('publish', 'Publishing hybrid content', 'done', post.platform);

    // 4. Notify
    logger.info('\n4️⃣ Sending notification...');
    pipelineEvents.emitStep('notify', 'Sending notification', 'running');
    const notifier = getNotifier();
    await notifier.notify(post, `[HYBRID] ${topic.title}`);
    pipelineEvents.emitStep('notify', 'Sending notification', 'done');

    pipelineEvents.endRun('success', topic.title);
  } catch (err) {
    pipelineEvents.emitStep('error', 'Hybrid post failed', 'error', String(err));
    pipelineEvents.endRun('error', String(err));
    throw err;
  }
}

/**
 * Generates and publishes a post from today's trending news, regardless of
 * the scheduler's rotation cadence. Used by the daily pipeline when the
 * scheduler picks trending, and directly by /create-trending so the command
 * name actually reflects what gets generated.
 */
export async function runTrendingPost(): Promise<void> {
  const topic = getTodaysTopic();
  pipelineEvents.startRun('trending');

  try {
    // 1. Aggregate news
    logger.info(`\n1️⃣ Aggregating news for ${getTopicEmoji(topic)} ${topic}...`);
    pipelineEvents.emitStep('aggregate', `Aggregating news for ${topic}`, 'running');
    const articles = await newsAggregator.aggregate(topic);
    logger.info(`   Found ${articles.length} articles`);
    pipelineEvents.emitStep('aggregate', `Aggregating news for ${topic}`, 'done', `${articles.length} articles found`);

    // Save all articles to repository
    for (const article of articles) {
      await articleRepo.save(article);
    }

    // 2. Filter & select top article
    logger.info('\n2️⃣ Filtering and scoring articles...');
    pipelineEvents.emitStep('filter', 'Filtering and scoring articles', 'running');
    const selectedArticle = await articleSelector.selectTopArticle(articles);

    if (!selectedArticle) {
      logger.error('No article selected');
      pipelineEvents.emitStep('filter', 'Filtering and scoring articles', 'error', 'No article selected');
      pipelineEvents.endRun('error', 'No article selected');
      return;
    }
    pipelineEvents.emitStep('filter', 'Filtering and scoring articles', 'done', selectedArticle.title);

    await articleRepo.save(selectedArticle);

    // 3. Generate content
    logger.info('\n3️⃣ Generating content...');
    pipelineEvents.emitStep('generate', 'Generating content', 'running');
    const contentGenerator = config.hasAnthropicKey
      ? new ClaudeContentGenerator()
      : new TemplateContentGenerator();
    const generatedContent = await contentGenerator.generate(selectedArticle);
    pipelineEvents.emitStep('generate', 'Generating content', 'done');

    // 4. Publish (use VideoPublisher if video is enabled)
    logger.info('\n4️⃣ Publishing...');
    pipelineEvents.emitStep('publish', 'Publishing', 'running');
    const publisher = selectPublisher(postRepo);
    const post = await publisher.publish(selectedArticle.id, generatedContent);
    pipelineEvents.emitStep('publish', 'Publishing', 'done', post.platform);

    // 5. Notify
    logger.info('\n5️⃣ Sending notification...');
    pipelineEvents.emitStep('notify', 'Sending notification', 'running');
    const notifier = getNotifier();
    await notifier.notify(post, selectedArticle.title);
    pipelineEvents.emitStep('notify', 'Sending notification', 'done');

    pipelineEvents.endRun('success', selectedArticle.title);
  } catch (err) {
    pipelineEvents.emitStep('error', 'Trending post failed', 'error', String(err));
    pipelineEvents.endRun('error', String(err));
    throw err;
  }
}

export async function runPipeline(): Promise<void> {
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('🚀 Starting AInfluencer Pipeline');
  logger.info('═══════════════════════════════════════════════════════════');

  try {
    const isHybridPost = hybridScheduler.shouldGenerateHybrid();

    if (isHybridPost) {
      await runHybridPost();
    } else {
      await runTrendingPost();
    }

    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info('✅ Pipeline completed successfully');
    logger.info('═══════════════════════════════════════════════════════════\n');
  } catch (err) {
    logger.error(`Pipeline error: ${err}`);
    throw err;
  }
}
