import { logger } from '../shared/logger.js';
import { GeneratedContent } from '../shared/types.js';
import { config } from '../shared/config.js';
import Anthropic from '@anthropic-ai/sdk';

interface VideoScript {
  narration: string;
  duration: number;
  hooks: string[];
  visualCues: string[];
  subTitle?: string;
}

class ClaudeScriptOptimizer {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
  }

  async optimizeForVideo(content: GeneratedContent): Promise<VideoScript> {
    const prompt = `You are a video content expert. Convert this social media content into a tight, engaging video script (15-30 seconds).

Original content:
Title: ${content.title || '(no title)'}
Post: ${content.linkedinPost || '(no post)'}
Script: ${content.script || '(no script provided)'}

Requirements:
1. Narration should be punchy and conversational (max 100 words for 30s video)
2. Start with a hook that grabs attention in first 2 seconds
3. Include 2-3 visual cues (what's shown on screen at each moment)
4. Optimize for mobile vertical viewing (9:16 aspect ratio)
5. Include call-to-action at the end
6. Add a concise subtitle (max 15 words) that summarizes the value

Return JSON with:
{
  "narration": "script text",
  "duration": 20,
  "hooks": ["hook1", "hook2"],
  "visualCues": ["cue1@0s", "cue2@10s"],
  "subtitle": "your summary"
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const block = response.content[0];
      const rawText = block && block.type === 'text' ? block.text : '';
      const text = rawText.replace(/```(?:json)?\n?|```/g, '').trim();
      const json = JSON.parse(text);

      if (typeof json.narration !== 'string' || json.narration.length === 0) {
        throw new Error('Claude response missing required "narration" field');
      }

      return {
        narration: json.narration,
        duration: typeof json.duration === 'number' ? json.duration : 20,
        hooks: Array.isArray(json.hooks) ? json.hooks : [],
        visualCues: Array.isArray(json.visualCues) ? json.visualCues : [],
        subTitle: json.subtitle,
      };
    } catch (err) {
      logger.warn(`Claude script optimization failed: ${err}, using template`);
      return new TemplateScriptOptimizer().optimizeForVideo(content);
    }
  }
}

class TemplateScriptOptimizer {
  optimizeForVideo(content: GeneratedContent): VideoScript {
    const script = content.script || '';
    const hasScript = script.length > 0;
    const narration = hasScript
      ? script.substring(0, 100)
      : (content.linkedinPost || '').substring(0, 100);

    return {
      narration: narration,
      duration: 20,
      hooks: content.hooks || ['Check this out!'],
      visualCues: ['Opening shot@0s', 'Key visual@8s', 'Closing@15s'],
      subTitle: content.title || 'Watch till the end',
    };
  }
}

export class ScriptOptimizer {
  private optimizer: ClaudeScriptOptimizer | TemplateScriptOptimizer;

  constructor() {
    this.optimizer = config.hasAnthropicKey
      ? new ClaudeScriptOptimizer()
      : new TemplateScriptOptimizer();
  }

  async optimize(content: GeneratedContent): Promise<VideoScript> {
    logger.info('🎬 Optimizing script for video format...');
    return this.optimizer.optimizeForVideo(content);
  }
}

export const scriptOptimizer = new ScriptOptimizer();
