-- AInfluencer - Initial Schema
-- Created for Supabase PostgreSQL

-- Articles table: stores aggregated news
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'technology',
  trending_score NUMERIC(5, 2),
  monetization_score NUMERIC(5, 2),
  final_score NUMERIC(5, 2),
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Posts table: generated content ready to publish
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('draft', 'linkedin', 'youtube', 'tiktok', 'instagram')),
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'published', 'failed')) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  url TEXT,
  hooks TEXT,
  hashtags TEXT,
  script TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Analytics events table: track engagement
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'share', 'engagement')),
  count INTEGER DEFAULT 1,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_article_id ON posts(article_id);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_analytics_post_id ON analytics_events(post_id);

-- Enable RLS (Row Level Security) if needed
-- For now, allow public read/write (will be restricted in production)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Public access policies (permissive, for MVP)
CREATE POLICY "Enable read access for all users" ON articles FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON articles FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON posts FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON posts FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON analytics_events FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON analytics_events FOR INSERT WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE articles IS 'Aggregated articles from news sources (Reddit, NewsAPI, etc.)';
COMMENT ON TABLE posts IS 'Generated content posts ready to publish';
COMMENT ON TABLE analytics_events IS 'Engagement analytics for published posts';
