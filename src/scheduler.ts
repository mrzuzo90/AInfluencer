import cron, { ScheduledTask } from 'node-cron';
import { logger } from './shared/logger.js';
import { config } from './shared/config.js';
import { runPipeline } from './pipeline.js';

export function startScheduler(): ScheduledTask | null {
  if (!config.schedulerEnabled) {
    logger.info('Scheduler is disabled (set SCHEDULER_ENABLED=true to enable)');
    return null;
  }

  // Schedule pipeline to run every day at 9:00 AM
  // Format: 0 9 * * * (minute hour day_of_month month day_of_week)
  const task = cron.schedule('0 9 * * *', async () => {
    logger.info('⏰ Scheduled pipeline trigger (9:00 AM)');
    try {
      await runPipeline();
    } catch (err) {
      logger.error(`Scheduled pipeline failed: ${err}`);
    }
  });

  logger.info('✅ Scheduler started: pipeline will run daily at 9:00 AM');

  return task;
}

export function stopScheduler(task: any): void {
  if (task) {
    task.stop();
    task.destroy();
    logger.info('Scheduler stopped');
  }
}
