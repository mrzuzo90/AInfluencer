import { Article, GeneratedContent } from '../shared/types.js';
import { config } from '../shared/config.js';
import { logger } from '../shared/logger.js';
import { Anthropic } from '@anthropic-ai/sdk';

export interface IContentGenerator {
  generate(article: Article): Promise<GeneratedContent>;
}

/**
 * Claude-based content generator using structured prompts for JSON output
 */
export class ClaudeContentGenerator implements IContentGenerator {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: config.anthropicApiKey });
  }

  async generate(article: Article): Promise<GeneratedContent> {
    const prompt = `You are a viral marketing expert. Create engaging content for a LinkedIn post about this trending news.

Return ONLY valid JSON (no markdown, no extra text):
{
  "script": "15-30 second video script (engaging, conversational)",
  "linkedinPost": "Professional LinkedIn post (2-3 short paragraphs, actionable insight)",
  "hooks": ["Hook 1 (curiosity-driven)", "Hook 2 (problem-solution)", "Hook 3 (controversial)"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
  "summary": "1-line takeaway for analytics"
}

Trending News:
Title: ${article.title}
Description: ${article.description}
Source: ${article.source}
URL: ${article.url}`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-5-20250805',
        max_tokens: 800,
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
      logger.warn(`Claude generation failed: ${err}, using template`);
      const template = new TemplateContentGenerator();
      return template.generate(article);
    }
  }
}

/**
 * Template-based fallback generator (no LLM required)
 */
export class TemplateContentGenerator implements IContentGenerator {
  async generate(article: Article): Promise<GeneratedContent> {
    const title = article.title;
    const source = article.source;
    const link = article.url;

    return {
      script: `"Did you see this? ${title.substring(0, 60)}... Check it out." [Show article] "This is huge for the industry."`,
      linkedinPost: `🔥 Just read this on ${source}:\n\n"${title}"\n\nThe implications are significant. What's your take?\n\n${link}`,
      hooks: [
        `You need to know about ${title.split(' ').slice(0, 3).join(' ')}...`,
        `The real story behind ${source}: ${title.substring(0, 40)}...`,
        `This changes everything: ${title.split(':')[0]}...`,
      ],
      hashtags: ['#trending', '#news', '#innovation', '#industry', '#insights'],
      summary: title.substring(0, 100),
    };
  }
}
