import cron, { ScheduledTask } from 'node-cron';
import { logger } from './shared/logger.js';
import { config } from './shared/config.js';
import { runPipeline } from './pipeline.js';

let currentTask: ScheduledTask | null = null;
let currentTime = '09:00';

function toCronExpression(time: string): string {
  const match = time.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    throw new Error(`Invalid time format "${time}", expected HH:MM (24h)`);
  }
  const [, hour, minute] = match;
  return `${parseInt(minute, 10)} ${parseInt(hour, 10)} * * *`;
}

function scheduleAt(time: string): ScheduledTask {
  const task = cron.schedule(toCronExpression(time), async () => {
    logger.info(`⏰ Scheduled pipeline trigger (${time})`);
    try {
      await runPipeline();
    } catch (err) {
      logger.error(`Scheduled pipeline failed: ${err}`);
    }
  });
  currentTime = time;
  logger.info(`✅ Scheduler active: pipeline will run daily at ${time}`);
  return task;
}

export function startScheduler(): ScheduledTask | null {
  if (!config.schedulerEnabled) {
    logger.info('Scheduler is disabled (set SCHEDULER_ENABLED=true to enable)');
    return null;
  }

  currentTask = scheduleAt(currentTime);
  return currentTask;
}

/**
 * Stops the running daily schedule and starts a new one at the given HH:MM.
 * Used by the /schedule Telegram command so it actually reprograms the
 * pipeline instead of just acknowledging the request.
 */
export function rescheduleDailyRun(time: string): void {
  if (currentTask) {
    currentTask.stop();
  }
  currentTask = scheduleAt(time);
}

export function getScheduledTime(): string {
  return currentTime;
}

export function stopScheduler(task: ScheduledTask | null = currentTask): void {
  if (task) {
    task.stop();
    logger.info('Scheduler stopped');
  }
}
