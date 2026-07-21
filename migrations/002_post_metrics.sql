-- AInfluencer - Post Metrics (Phase 3 Analytics)
-- Aggregated per-post metrics snapshot, used by /analytics bot command.
-- Complements analytics_events (raw event log from 001_init.sql) with a
-- rollup shape that's cheap to read on every /analytics call.

CREATE TABLE IF NOT EXISTS post_metrics (
  post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(6, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_metrics_created_at ON post_metrics(created_at DESC);

ALTER TABLE post_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON post_metrics FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON post_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON post_metrics FOR UPDATE USING (true);

COMMENT ON TABLE post_metrics IS 'Per-post aggregated metrics snapshot, read by the /analytics Telegram command';
