import { GeneratedContent } from '../shared/types.js';
import { logger } from '../shared/logger.js';
import { config } from '../shared/config.js';
import { Anthropic } from '@anthropic-ai/sdk';
import { HybridTopic, getRandomHybridTopic } from './hybridTopics.js';

export interface IHybridGenerator {
  generate(topic: HybridTopic): Promise<GeneratedContent>;
}

/**
 * Claude-based hybrid profile content generator
 */
export class ClaudeHybridGenerator implements IHybridGenerator {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: config.anthropicApiKey });
  }

  async generate(topic: HybridTopic): Promise<GeneratedContent> {
    const prompt = `You are crafting a LinkedIn post from someone with a unique hybrid profile: AI Developer + Electrical Technician/Installer.

Create engaging, authentic content about this intersection. Make it valuable for the audience: ${topic.targetAudience.join(', ')}.

Topic: ${topic.title}
Type: ${topic.type}
Description: ${topic.description}

Key points to touch:
${topic.keyPoints.map((p) => `- ${p}`).join('\n')}

Examples to reference:
${(topic.examples || []).map((e) => `- ${e}`).join('\n')}

Return ONLY valid JSON (no markdown, no extra text):
{
  "script": "15-30 second video script (engaging, conversational, personal)",
  "linkedinPost": "Professional but personal LinkedIn post (3-4 short paragraphs, mix of insight + personal perspective)",
  "hooks": ["Hook 1", "Hook 2", "Hook 3"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
  "summary": "1-line takeaway for analytics"
}

Make it sound authentic, not corporate. Include personal perspective about combining AI + electrical work.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-5-20250805',
        max_tokens: 900,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const content = JSON.parse(text);

      return {
        script: content.script,
        linkedinPost: content.linkedinPost,
        hooks: content.hooks,
        hashtags: content.hashtags,
        summary: content.summary,
      };
    } catch (err) {
      logger.warn(`Claude hybrid generation failed: ${err}, using template`);
      const template = new TemplateHybridGenerator();
      return template.generate(topic);
    }
  }
}

/**
 * Template-based hybrid content generator (fallback)
 */
export class TemplateHybridGenerator implements IHybridGenerator {
  async generate(topic: HybridTopic): Promise<GeneratedContent> {
    const emoji = {
      tutorial: '📚',
      insight: '💡',
      'case-study': '📊',
      'trend-analysis': '📈',
      'how-to': '🛠️',
    }[topic.type];

    const postContent = `${emoji} *${topic.title}*

Me encantan los proyectos donde cruzas IA + instalaciones eléctricas. Aquí va cómo:

${topic.keyPoints.slice(0, 3).map((p) => `• ${p}`).join('\n')}

${topic.examples ? `Ejemplo real: ${topic.examples[0]}` : ''}

¿Ya estás combinando ambas disciplinas? Me gustaría saber tu experiencia.

Audience: ${topic.targetAudience.join(' | ')}`;

    return {
      script: `"${topic.title}... Un tema que apasiona a developers y técnicos por igual. Aquí está mi perspectiva."`,
      linkedinPost: postContent,
      hooks: [
        `Si eres electricista + developer, esto te interesa: ${topic.title}`,
        `La combinación que falta en el mercado: ${topic.title}`,
        `De electricista a IA: cómo ${topic.title}`,
      ],
      hashtags: [
        '#AIandElectrical',
        '#IoT',
        '#SmartBuildings',
        '#HybridSkills',
        '#Electricidad',
      ],
      summary: topic.description,
    };
  }
}

/**
 * Factory para hybrid content generation
 */
export function getHybridGenerator(): IHybridGenerator {
  if (config.hasAnthropicKey) {
    logger.debug('Using Claude hybrid generator');
    return new ClaudeHybridGenerator();
  } else {
    logger.debug('Using template hybrid generator');
    return new TemplateHybridGenerator();
  }
}

/**
 * Generate hybrid content from random topic
 */
export async function generateHybridPost(): Promise<GeneratedContent & { topic: HybridTopic }> {
  const topic = getRandomHybridTopic();
  const generator = getHybridGenerator();
  const content = await generator.generate(topic);

  return { ...content, topic };
}
