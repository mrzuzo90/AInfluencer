import { logger, config } from './shared/index.js';
import { runPipeline } from './pipeline.js';
import { startScheduler } from './scheduler.js';

async function main() {
  logger.info('🚀 AInfluencer starting...');
  logger.info(`Environment: ${config.env}`);
  logger.info(`Log level: ${config.logLevel}`);
  logger.info(`Scheduler enabled: ${config.schedulerEnabled}`);
  logger.info(`Publish live: ${config.publishLive}`);

  // Run pipeline immediately (demo/manual mode)
  logger.info('\n📡 Running initial pipeline...\n');
  await runPipeline();

  // Start scheduler if enabled
  if (config.schedulerEnabled) {
    startScheduler();
    logger.info('Scheduler ready. Press Ctrl+C to exit.');
    // Keep process alive
    await new Promise(() => {});
  }
}

main().catch((err) => {
  logger.error(`Fatal error: ${err}`);
  process.exit(1);
});
