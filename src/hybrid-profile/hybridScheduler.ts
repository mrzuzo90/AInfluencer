import { logger } from '../shared/logger.js';

export interface HybridScheduleConfig {
  ratio: number; // 1/N posts are hybrid (default 1/5 = 20%)
  enabled: boolean;
}

export class HybridScheduler {
  private config: HybridScheduleConfig;
  private postCount = 0;

  constructor(ratio: number = 5, enabled: boolean = true) {
    this.config = { ratio, enabled };
    logger.info(
      `Hybrid content scheduler initialized: 1/${ratio} posts will be hybrid (${(100 / ratio).toFixed(0)}%) - ${enabled ? 'ENABLED' : 'DISABLED'}`
    );
  }

  /**
   * Decide if next post should be hybrid or trending
   */
  shouldGenerateHybrid(): boolean {
    if (!this.config.enabled) return false;

    this.postCount++;
    const isHybrid = this.postCount % this.config.ratio === 0;

    if (isHybrid) {
      logger.info(`📊 Post #${this.postCount}: HYBRID profile content (1 of every ${this.config.ratio})`);
    }

    return isHybrid;
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    logger.info(`Hybrid content ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  setRatio(ratio: number): void {
    this.config.ratio = ratio;
    logger.info(`Hybrid content ratio updated to 1/${ratio} posts`);
  }

  reset(): void {
    this.postCount = 0;
    logger.info('Hybrid post counter reset');
  }
}

// Global singleton
export const hybridScheduler = new HybridScheduler(
  parseInt(process.env.HYBRID_RATIO || '5'),
  process.env.HYBRID_ENABLED !== 'false'
);

export default hybridScheduler;
