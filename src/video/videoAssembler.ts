import { logger } from '../shared/logger.js';
import { GeneratedContent } from '../shared/types.js';
import { config } from '../shared/config.js';
import { scriptOptimizer } from './scriptOptimizer.js';
import { narrationGenerator } from './narrationGenerator.js';
import { stockFootageProvider } from './stockFootageProvider.js';
import { renderVideo } from './videoRenderer.js';

export interface VideoAsset {
  id: string;
  type: 'video' | 'audio' | 'subtitle';
  data: Buffer;
  metadata: Record<string, unknown>;
}

export interface CompiledVideo {
  id: string;
  title: string;
  duration: number;
  assets: VideoAsset[];
  subtitles: Array<{ timestamp: number; text: string }>;
  /** Path to the rendered mp4 (burned-in subtitles + footage + watermark), if ffmpeg + footage were available. */
  filePath: string | null;
  metadata: {
    script: string;
    hooks: string[];
    visualCues: string[];
    createdAt: string;
  };
}

export class VideoAssembler {
  async assemble(
    articleId: string,
    content: GeneratedContent
  ): Promise<CompiledVideo> {
    logger.info('🎬 Assembling video...');

    // 1. Optimize script for video
    const videoScript = await scriptOptimizer.optimize(content);

    // 2. Generate narration
    const narration = await narrationGenerator.generate(videoScript.narration);

    // 3. Generate subtitles
    const subtitles = this.generateSubtitles(
      videoScript.narration,
      narration.duration
    );

    const videoId = `video-${articleId}-${Date.now()}`;

    // 4. Fetch stock footage and render the actual mp4 (burned-in subtitles +
    // watermark). Best-effort: falls back to null (audio+metadata only) when
    // ffmpeg or footage aren't available — the caller/publisher already
    // treats a null render as "not a real video" and stays honest about it.
    const keywords = [content.title, ...(videoScript.hooks || [])]
      .filter((s): s is string => !!s)
      .flatMap((s) => s.split(/\s+/))
      .filter((w) => w.length > 3)
      .slice(0, 5);

    const clips = await stockFootageProvider.fetchClips(keywords, 3);
    const rendered = await renderVideo({
      outputBaseName: videoId,
      narrationAudio: narration.audioBuffer,
      durationMs: narration.duration,
      clips,
      subtitles,
      watermarkText: config.videoWatermarkText,
    });

    // 5. Create video asset structure
    const video: CompiledVideo = {
      id: videoId,
      title: content.title || 'Untitled Video',
      duration: narration.duration,
      filePath: rendered?.filePath ?? null,
      assets: [
        {
          id: 'narration',
          type: 'audio',
          data: narration.audioBuffer,
          metadata: {
            duration: narration.duration,
            format: 'mp3',
          },
        },
        {
          id: 'subtitles',
          type: 'subtitle',
          data: Buffer.from(JSON.stringify(subtitles)),
          metadata: {
            format: 'json',
            count: subtitles.length,
          },
        },
      ],
      subtitles,
      metadata: {
        script: videoScript.narration,
        hooks: videoScript.hooks,
        visualCues: videoScript.visualCues,
        createdAt: new Date().toISOString(),
      },
    };

    logger.info(`✅ Video compiled: ${video.id}`);
    logger.info(`   Duration: ${video.duration}ms`);
    logger.info(`   Rendered file: ${video.filePath || '(none — audio+metadata only)'}`);
    logger.info(`   Subtitles: ${subtitles.length}`);

    return video;
  }

  private generateSubtitles(
    narration: string,
    totalDuration: number
  ): Array<{ timestamp: number; text: string }> {
    const words = narration.split(' ');
    const msPerWord = totalDuration / words.length;
    const subtitles: Array<{ timestamp: number; text: string }> = [];

    const CHUNK_SIZE = 5;
    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
      const chunk = words.slice(i, i + CHUNK_SIZE);
      subtitles.push({
        timestamp: Math.floor(i * msPerWord),
        text: chunk.join(' '),
      });
    }

    return subtitles;
  }
}

export const videoAssembler = new VideoAssembler();
