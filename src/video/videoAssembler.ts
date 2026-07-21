import { logger } from '../shared/logger.js';
import { GeneratedContent } from '../shared/types.js';
import { scriptOptimizer } from './scriptOptimizer.js';
import { narrationGenerator } from './narrationGenerator.js';

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

    // 4. Create video asset structure
    const video: CompiledVideo = {
      id: `video-${articleId}-${Date.now()}`,
      title: content.title || 'Untitled Video',
      duration: narration.duration,
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
    logger.info(`   Assets: ${video.assets.length}`);
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

    let currentTimestamp = 0;
    let currentChunk = '';

    for (let i = 0; i < words.length; i++) {
      currentChunk += (currentChunk ? ' ' : '') + words[i];

      if (
        currentChunk.split(' ').length % 5 === 0 ||
        i === words.length - 1
      ) {
        subtitles.push({
          timestamp: Math.floor(currentTimestamp),
          text: currentChunk,
        });
        currentTimestamp += msPerWord * currentChunk.split(' ').length;
        currentChunk = '';
      }
    }

    return subtitles;
  }
}

export const videoAssembler = new VideoAssembler();
