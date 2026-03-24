-- Twitter/X tweet management for automated posting via @newbeeconnect
-- Stores AI-generated drafts, scheduled tweets, and published tweet records.

CREATE TABLE IF NOT EXISTS mkt_tweets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'manual',
  language TEXT NOT NULL DEFAULT 'en',
  topic TEXT,
  is_thread BOOLEAN NOT NULL DEFAULT FALSE,
  thread_tweets JSONB,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'scheduled', 'publishing', 'published', 'failed')),
  tweet_id TEXT,
  tweet_url TEXT,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mkt_tweets_user_status ON mkt_tweets(user_id, status);
CREATE INDEX idx_mkt_tweets_scheduled ON mkt_tweets(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_mkt_tweets_generated ON mkt_tweets(generated_at DESC);

-- RLS
ALTER TABLE mkt_tweets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tweets"
  ON mkt_tweets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tweets"
  ON mkt_tweets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tweets"
  ON mkt_tweets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own draft tweets"
  ON mkt_tweets FOR DELETE
  USING (auth.uid() = user_id AND status = 'draft');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION mkt_tweets_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mkt_tweets_updated_at
  BEFORE UPDATE ON mkt_tweets
  FOR EACH ROW
  EXECUTE FUNCTION mkt_tweets_update_timestamp();
