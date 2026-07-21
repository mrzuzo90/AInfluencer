import { logger, config, db } from './shared/index.js';

async function main() {
  logger.info('🚀 AInfluencer starting...');
  logger.info(`Environment: ${config.env}`);
  logger.info(`Log level: ${config.logLevel}`);

  try {
    const { data, error } = await db.from('articles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    logger.info('✅ Database connection OK');
  } catch (err) {
    logger.warn('⚠️ Database not ready yet (normal if tables not created)', err);
  }

  logger.info('Phase 0 setup complete. Ready for Phase 1.');
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
