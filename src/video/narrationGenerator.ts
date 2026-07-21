import { logger } from '../shared/logger.js';
import { config } from '../shared/config.js';

interface NarrationAudio {
  audioBuffer: Buffer;
  duration: number;
  mimeType: string;
}

const WORDS_PER_MINUTE = 150;

function estimateDurationMs(script: string): number {
  const wordCount = script.split(' ').length;
  return Math.ceil((wordCount / WORDS_PER_MINUTE) * 60000);
}

class ElevenLabsNarrationGenerator {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private voiceId: string;

  constructor() {
    this.apiKey = config.elevenLabsApiKey || '';
    this.voiceId = config.elevenLabsVoiceId || 'eleven_monolingual_v1';
  }

  async generateNarration(script: string): Promise<NarrationAudio> {
    if (!this.apiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${this.voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: script,
            model_id: 'eleven_monolingual_v2_1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();

      logger.info(`🎙️  Generated narration (${audioBuffer.byteLength} bytes)`);

      return {
        audioBuffer: Buffer.from(audioBuffer),
        duration: estimateDurationMs(script),
        mimeType: 'audio/mpeg',
      };
    } catch (err) {
      logger.error(`Narration generation failed: ${err}`);
      throw err;
    }
  }
}

class TemplateNarrationGenerator {
  async generateNarration(script: string): Promise<NarrationAudio> {
    // Return empty audio buffer for template (in real usage, this would be a placeholder)
    const estimatedDuration = estimateDurationMs(script);

    logger.info(
      `🎙️  (Template) Narration estimated at ${estimatedDuration}ms`
    );

    return {
      audioBuffer: Buffer.from([]),
      duration: estimatedDuration,
      mimeType: 'audio/mpeg',
    };
  }
}

export class NarrationGenerator {
  private generator:
    | ElevenLabsNarrationGenerator
    | TemplateNarrationGenerator;

  constructor() {
    this.generator = config.elevenLabsApiKey
      ? new ElevenLabsNarrationGenerator()
      : new TemplateNarrationGenerator();
  }

  async generate(script: string): Promise<NarrationAudio> {
    logger.info('🎬 Generating narration...');
    return this.generator.generateNarration(script);
  }
}

export const narrationGenerator = new NarrationGenerator();
