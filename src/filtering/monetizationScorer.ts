import { Article } from '../shared/types.js';
import { config } from '../shared/config.js';
import { Anthropic } from '@anthropic-ai/sdk';
import { logger } from '../shared/logger.js';

export interface IMonetizationScorer {
  score(article: Article): Promise<number>;
}

/**
 * Claude-based monetization scorer using CLAUDE.md formula:
 * MONETIZATION_SCORE = (
 *   emotionality_rating × 0.35 +
 *   shareability_rating × 0.35 +
 *   personal_relevance × 0.20 +
 *   engagement_hook_potential × 0.10
 * ) × 100
 */
export class ClaudeMonetizationScorer implements IMonetizationScorer {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: config.anthropicApiKey });
  }

  async score(article: Article): Promise<number> {
    try {
      const prompt = `Analyze this article for monetization potential (0-100 scale). Score factors:
- Emotionality (surprise +30, fear +20, inspiration +25, curiosity +35): how much will it trigger emotion?
- Shareability (0-100): will people share this with friends? (avoid extreme polarization)
- Personal Relevance (0-100): impacts career/money/trends?
- Hook Potential (0-100): does the title/premise make you click?

Article:
Title: ${article.title}
Description: ${article.description}
Source: ${article.source}

Respond with ONLY a JSON object: {"emotionality":N,"shareability":N,"relevance":N,"hook":N} where each N is 0-100.`;

      const response = await this.client.messages.create({
        model: 'claude-opus-4-5-20250805',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const scores = JSON.parse(text);

      const monetizationScore =
        (scores.emotionality * 0.35 + scores.shareability * 0.35 + scores.relevance * 0.2 + scores.hook * 0.1) / 100;

      return Math.round(monetizationScore);
    } catch (err) {
      logger.warn(`Claude scoring failed: ${err}, falling back to heuristic`);
      const heuristic = new HeuristicMonetizationScorer();
      return heuristic.score(article);
    }
  }
}

/**
 * Heuristic monetization scorer (fallback, no LLM required)
 * Uses keyword detection for emotionality + basic heuristics
 */
export class HeuristicMonetizationScorer implements IMonetizationScorer {
  private emotionalKeywords = {
    surprise: ['breakthrough', 'first', 'shocking', 'unexpected', 'unprecedented', 'historic'],
    fear: ['crisis', 'collapse', 'danger', 'threat', 'attack', 'disaster'],
    inspiration: ['success', 'triumph', 'achieve', 'breakthrough', 'record', 'milestone'],
    curiosity: ['why', 'how', 'secret', 'mystery', 'hidden', 'revealed', 'leaked'],
  };

  async score(article: Article): Promise<number> {
    const text = `${article.title} ${article.description}`.toLowerCase();

    // Emotionality: detect keywords (0-100)
    let emotionality = 0;
    for (const [emotion, keywords] of Object.entries(this.emotionalKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          emotionality += emotion === 'curiosity' ? 35 : emotion === 'surprise' ? 30 : emotion === 'inspiration' ? 25 : 20;
        }
      }
    }
    emotionality = Math.min(emotionality, 100);

    // Shareability: reward trending topics, punish extreme (0-100)
    let shareability = 50; // baseline
    const hasHashtag = text.includes('#');
    const wordCount = text.split(' ').length;
    if (wordCount > 10 && wordCount < 150) shareability += 20; // ideal length
    if (hasHashtag) shareability += 10;
    shareability = Math.min(shareability, 100);

    // Personal relevance: tech/finance/career keywords (0-100)
    const relevanceKeywords = ['ai', 'tech', 'startup', 'money', 'career', 'salary', 'invest', 'market', 'trend'];
    let relevance = 30; // baseline
    for (const keyword of relevanceKeywords) {
      if (text.includes(keyword)) relevance += 10;
    }
    relevance = Math.min(relevance, 100);

    // Hook potential: presence of numbers, punctuation, length (0-100)
    let hook = 40; // baseline
    if (/\d+/.test(article.title)) hook += 20; // numbers in title
    if (/[!?]/.test(article.title)) hook += 15; // exclamation/question
    if (article.title.length > 15 && article.title.length < 80) hook += 15; // ideal length
    hook = Math.min(hook, 100);

    const monetizationScore = (emotionality * 0.35 + shareability * 0.35 + relevance * 0.2 + hook * 0.1) / 100;

    return Math.round(monetizationScore);
  }
}
