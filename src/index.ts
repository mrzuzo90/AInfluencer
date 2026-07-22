import { logger, config } from './shared/index.js';
import { runPipeline } from './pipeline.js';
import { startScheduler } from './scheduler.js';
import { botCommandHandler } from './telegram/index.js';
import { startDashboard } from './dashboard/server.js';

async function main() {
  logger.info('🚀 AInfluencer starting...');
  logger.info(`Environment: ${config.env}`);
  logger.info(`Log level: ${config.logLevel}`);
  logger.info(`Scheduler enabled: ${config.schedulerEnabled}`);
  logger.info(`Publish live: ${config.publishLive}`);

  // Start the dashboard first so the "pipeline en vivo" panel can pick up
  // the initial run below.
  if (config.dashboardEnabled) {
    startDashboard();
  }

  // Run pipeline immediately (demo/manual mode)
  logger.info('\n📡 Running initial pipeline...\n');
  await runPipeline();

  // Start scheduler if enabled
  if (config.schedulerEnabled) {
    startScheduler();
  }

  // Start the Telegram bot command listener if configured
  if (config.hasTelegram) {
    await botCommandHandler.startPolling();
  }

  // Keep the process alive if the scheduler, bot, or dashboard is running
  if (config.schedulerEnabled || config.hasTelegram || config.dashboardEnabled) {
    logger.info('AInfluencer ready. Press Ctrl+C to exit.');
    await new Promise(() => {});
  }
}

main().catch((err) => {
  logger.error(`Fatal error: ${err}`);
  process.exit(1);
});
