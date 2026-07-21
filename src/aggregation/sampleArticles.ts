import { Article } from '../shared/types.js';

export const SAMPLE_ARTICLES: Record<string, Article[]> = {
  technology: [
    {
      id: 'sample-1',
      title: 'Claude 3.5 Sonnet Shows Breakthrough Performance in Reasoning Tasks',
      description: 'Anthropic releases new frontier LLM with improved context window and reasoning',
      url: 'https://example.com/claude-breakthrough',
      source: 'Tech News Daily',
      publishedAt: new Date().toISOString(),
      content:
        'Claude 3.5 Sonnet demonstrates significant improvements in complex reasoning, mathematical tasks, and multi-step problem solving...',
      category: 'technology',
      trendingScore: 0,
      monetizationScore: 0,
      finalScore: 0,
      evaluatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-2',
      title: 'Quantum Computing Reaches New Milestone with 1000-Qubit Processor',
      description: 'Google and IBM announce breakthroughs in quantum error correction',
      url: 'https://example.com/quantum-milestone',
      source: 'Innovation Weekly',
      publishedAt: new Date().toISOString(),
      content: 'Quantum computing has entered a new era as researchers achieve unprecedented qubit counts while maintaining error rates below critical thresholds...',
      category: 'technology',
      trendingScore: 0,
      monetizationScore: 0,
      finalScore: 0,
      evaluatedAt: new Date().toISOString(),
    },
  ],
  business: [
    {
      id: 'sample-3',
      title: 'Tech Giants Report Record Q3 Earnings Amid AI Investment Surge',
      description: 'Microsoft, Google, and Meta exceed analyst expectations with AI revenue streams',
      url: 'https://example.com/earnings-ai',
      source: 'Business Insider',
      publishedAt: new Date().toISOString(),
      content: 'The latest earnings reports show that AI-driven products and services are becoming significant revenue contributors for major technology companies...',
      category: 'business',
      trendingScore: 0,
      monetizationScore: 0,
      finalScore: 0,
      evaluatedAt: new Date().toISOString(),
    },
  ],
  finance: [
    {
      id: 'sample-4',
      title: 'Stock Markets Rally as AI Adoption Accelerates Global Economy',
      description: 'S&P 500 reaches record high; tech sector leads gains',
      url: 'https://example.com/market-rally',
      source: 'Finance Times',
      publishedAt: new Date().toISOString(),
      content: 'Markets reflect optimism about AI integration in enterprise workflows and productivity gains expected over the next decade...',
      category: 'finance',
      trendingScore: 0,
      monetizationScore: 0,
      finalScore: 0,
      evaluatedAt: new Date().toISOString(),
    },
  ],
};

export function getSampleArticlesByCategory(category: string): Article[] {
  return SAMPLE_ARTICLES[category] || SAMPLE_ARTICLES['technology'];
}
