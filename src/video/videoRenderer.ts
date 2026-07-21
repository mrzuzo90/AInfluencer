import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { logger } from '../shared/logger.js';
import { config } from '../shared/config.js';
import { StockClip } from './stockFootageProvider.js';

const execFileAsync = promisify(execFile);

const TARGET_WIDTH = 1080;
const TARGET_HEIGHT = 1920;

export interface RenderedVideo {
  filePath: string;
  sizeBytes: number;
  durationSeconds: number;
}

export interface RenderVideoOptions {
  outputBaseName: string;
  narrationAudio: Buffer;
  durationMs: number;
  clips: StockClip[];
  subtitles: Array<{ timestamp: number; text: string }>;
  watermarkText: string;
}

let ffmpegAvailable: boolean | null = null;

export async function isFfmpegAvailable(): Promise<boolean> {
  if (ffmpegAvailable !== null) return ffmpegAvailable;
  try {
    await execFileAsync('ffmpeg', ['-version']);
    ffmpegAvailable = true;
  } catch {
    ffmpegAvailable = false;
  }
  return ffmpegAvailable;
}

function toSrtTimestamp(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msRemainder = Math.floor(ms % 1000);
  const pad = (n: number, len = 2) => n.toString().padStart(len, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(msRemainder, 3)}`;
}

function buildSrt(
  subtitles: Array<{ timestamp: number; text: string }>,
  totalDurationMs: number
): string {
  return subtitles
    .map((sub, i) => {
      const start = sub.timestamp;
      const end = subtitles[i + 1]?.timestamp ?? totalDurationMs;
      return `${i + 1}\n${toSrtTimestamp(start)} --> ${toSrtTimestamp(end)}\n${sub.text}\n`;
    })
    .join('\n');
}

/** Escapes a path for use inside an ffmpeg filter string (colons/backslashes). */
function escapeForFilter(filePath: string): string {
  return filePath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
}

async function downloadClip(clip: StockClip, destDir: string, index: number): Promise<string> {
  const response = await fetch(clip.url);
  if (!response.ok) {
    throw new Error(`Failed to download clip ${clip.url}: ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const filePath = path.join(destDir, `clip_${index}.mp4`);
  await writeFile(filePath, buffer);
  return filePath;
}

/**
 * Assembles narration + stock footage + burned-in subtitles + a watermark
 * into a single vertical (1080x1920) mp4 via a local ffmpeg binary.
 * Returns null (never throws) when ffmpeg isn't installed, so callers can
 * fall back to the audio+metadata-only CompiledVideo, matching the same
 * graceful-degradation pattern used for ElevenLabs/Claude elsewhere.
 */
export async function renderVideo(
  options: RenderVideoOptions
): Promise<RenderedVideo | null> {
  if (!(await isFfmpegAvailable())) {
    logger.warn(
      '⚠️  ffmpeg not found on PATH — skipping real video render (audio+metadata only). Install ffmpeg to enable Shorts rendering.'
    );
    return null;
  }

  const workDir = await mkdtemp(path.join(tmpdir(), 'ainfluencer-video-'));
  const durationSeconds = Math.max(1, options.durationMs / 1000);

  try {
    // 1. Audio input: real narration if we have bytes, else a silent track
    // of matching duration (keeps preview renders working without ElevenLabs).
    let audioArgs: string[];
    if (options.narrationAudio.length > 0) {
      const audioPath = path.join(workDir, 'narration.mp3');
      await writeFile(audioPath, options.narrationAudio);
      audioArgs = ['-i', audioPath];
    } else {
      audioArgs = ['-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono:d=${durationSeconds}`];
    }

    // 2. Video input(s): downloaded stock clips, or a solid color background
    // when no footage provider is configured.
    const clipPaths: string[] = [];
    for (const [i, clip] of options.clips.entries()) {
      try {
        clipPaths.push(await downloadClip(clip, workDir, i));
      } catch (err) {
        logger.warn(`Skipping clip ${i}: ${err}`);
      }
    }

    const videoInputArgs: string[] =
      clipPaths.length > 0
        ? clipPaths.flatMap((p) => ['-i', p])
        : ['-f', 'lavfi', '-i', `color=c=black:s=${TARGET_WIDTH}x${TARGET_HEIGHT}:d=${durationSeconds}`];

    const videoInputCount = clipPaths.length > 0 ? clipPaths.length : 1;

    // 3. Burned-in subtitles file.
    const srtPath = path.join(workDir, 'subtitles.srt');
    await writeFile(srtPath, buildSrt(options.subtitles, options.durationMs));

    // 4. Build the filter graph: scale/crop each video input to 1080x1920,
    // concat if there's more than one clip, burn in subtitles, overlay the
    // watermark.
    const scaleLabels: string[] = [];
    let filterParts: string[] = [];
    for (let i = 0; i < videoInputCount; i++) {
      const label = `v${i}`;
      filterParts.push(
        `[${i}:v]scale=${TARGET_WIDTH}:${TARGET_HEIGHT}:force_original_aspect_ratio=increase,` +
          `crop=${TARGET_WIDTH}:${TARGET_HEIGHT},setsar=1,fps=30[${label}]`
      );
      scaleLabels.push(`[${label}]`);
    }

    let concatLabel = scaleLabels[0].replace(/[[\]]/g, '');
    if (videoInputCount > 1) {
      filterParts.push(`${scaleLabels.join('')}concat=n=${videoInputCount}:v=1:a=0[vconcat]`);
      concatLabel = 'vconcat';
    }

    const watermarkEscaped = options.watermarkText.replace(/'/g, "\\'").replace(/:/g, '\\:');

    filterParts.push(
      `[${concatLabel}]subtitles=${escapeForFilter(srtPath)}:force_style='FontSize=26,PrimaryColour=&HFFFFFF&,BorderStyle=3,Outline=1'[vsub]`,
      `[vsub]drawtext=text='${watermarkEscaped}':x=w-tw-24:y=h-th-48:fontsize=22:fontcolor=white@0.75:box=1:boxcolor=black@0.35:boxborderw=8[vout]`
    );

    const filterComplex = filterParts.join(';');
    const outputPath = path.join(
      path.resolve(config.videoOutputDir),
      `${options.outputBaseName}.mp4`
    );
    await mkdir(path.dirname(outputPath), { recursive: true });

    const args = [
      '-y',
      ...videoInputArgs,
      ...audioArgs,
      '-filter_complex',
      filterComplex,
      '-map',
      '[vout]',
      '-map',
      `${videoInputCount}:a`,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-c:a',
      'aac',
      '-shortest',
      '-movflags',
      '+faststart',
      outputPath,
    ];

    logger.info('🎬 Rendering video with ffmpeg...');
    await execFileAsync('ffmpeg', args, { maxBuffer: 1024 * 1024 * 32 });

    const { size } = await (await import('node:fs/promises')).stat(outputPath);
    logger.info(`✅ Video rendered: ${outputPath} (${(size / 1024).toFixed(0)} KB)`);

    return { filePath: outputPath, sizeBytes: size, durationSeconds };
  } catch (err) {
    logger.error(`Video rendering failed: ${err}`);
    return null;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
