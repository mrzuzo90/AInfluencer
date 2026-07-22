import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../shared/logger.js';
import { config } from '../shared/config.js';
import { articleRepo, postRepo, analyticsRepo } from '../shared/repository/factory.js';
import { getScheduledTime } from '../scheduler.js';
import { pipelineEvents } from './pipelineEvents.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseLimit(req: Request, fallback = 20): number {
  const raw = parseInt(String(req.query.limit ?? ''), 10);
  return Number.isFinite(raw) && raw > 0 ? Math.min(raw, 100) : fallback;
}

export function startDashboard() {
  const app = express();

  app.get('/api/status', async (_req: Request, res: Response) => {
    res.json({
      env: config.env,
      integrations: {
        anthropic: config.hasAnthropicKey,
        supabase: config.hasSupabase,
        telegram: config.hasTelegram,
        newsapi: config.hasNewsApi,
        linkedin: config.hasLinkedin,
        elevenlabs: config.hasElevenLabs,
        youtube: config.hasYoutube,
        pexels: config.hasPexels,
      },
      scheduler: {
        enabled: config.schedulerEnabled,
        time: getScheduledTime(),
      },
      hybrid: {
        enabled: config.hybridEnabled,
        ratio: config.hybridRatio,
      },
      publishLive: config.publishLive,
      publishVideo: config.publishVideo,
      lastRun: pipelineEvents.getLastRun(),
    });
  });

  app.get('/api/articles', async (req: Request, res: Response) => {
    const limit = parseLimit(req);
    const articles = await articleRepo.findAll();
    const sorted = [...articles]
      .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime())
      .slice(0, limit);
    res.json(sorted);
  });

  app.get('/api/posts', async (req: Request, res: Response) => {
    const limit = parseLimit(req);
    const posts = await postRepo.findAll();
    const sorted = [...posts]
      .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
      .slice(0, limit);
    res.json(sorted);
  });

  app.get('/api/analytics', async (_req: Request, res: Response) => {
    const [today, weekly] = await Promise.all([
      analyticsRepo.getTodaysAnalytics(),
      analyticsRepo.getWeeklyAnalytics(),
    ]);
    res.json({ today, weekly });
  });

  app.get('/api/events', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Snapshot so a client connecting mid-run (or after) isn't lost.
    send('snapshot', { current: pipelineEvents.getCurrentRun(), history: pipelineEvents.getHistory() });

    const onStart = (run: unknown) => send('run-start', run);
    const onStep = (payload: unknown) => send('step', payload);
    const onEnd = (run: unknown) => send('run-end', run);

    pipelineEvents.on('run-start', onStart);
    pipelineEvents.on('step', onStep);
    pipelineEvents.on('run-end', onEnd);

    req.on('close', () => {
      pipelineEvents.off('run-start', onStart);
      pipelineEvents.off('step', onStep);
      pipelineEvents.off('run-end', onEnd);
    });
  });

  app.use(express.static(path.join(__dirname, 'public')));

  app.listen(config.dashboardPort, () => {
    logger.info(`📊 Dashboard listening on http://localhost:${config.dashboardPort}`);
  });
}

export default startDashboard;
