import { describe, it, expect } from 'vitest';
import { logger } from './logger.js';

describe('logger', () => {
  it('should export a logger instance', () => {
    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
  });
});
