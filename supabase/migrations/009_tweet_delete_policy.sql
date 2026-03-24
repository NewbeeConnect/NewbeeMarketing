-- Allow users to delete their own draft and failed tweets (previously only draft)
DROP POLICY IF EXISTS "Users can delete own draft tweets" ON mkt_tweets;

CREATE POLICY "Users can delete own tweets"
  ON mkt_tweets FOR DELETE
  USING (auth.uid() = user_id AND status IN ('draft', 'failed'));
