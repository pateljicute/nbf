-- ============================================================
-- NBF Homes: Reviews Table Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID,
    rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content     TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'rejected', 'blocked')),
    admin_reply TEXT,
    admin_reply_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Index for faster queries
CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews(status);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews(user_id);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews(created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Anyone can read approved reviews (public)
DROP POLICY IF EXISTS "Public can read approved reviews" ON reviews;
CREATE POLICY "Public can read approved reviews"
    ON reviews FOR SELECT
    USING (status = 'approved');

-- Logged-in users can insert their own review
DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON reviews;
CREATE POLICY "Authenticated users can submit reviews"
    ON reviews FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
CREATE POLICY "Users can delete own reviews"
    ON reviews FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Admins can do everything (via service role / admin check)
DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;
CREATE POLICY "Admins can manage all reviews"
    ON reviews FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users WHERE user_id = auth.uid()
        )
    );

-- 5. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reviews_updated_at_trigger ON reviews;
CREATE TRIGGER reviews_updated_at_trigger
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_reviews_updated_at();

-- Done!
-- Verify with: SELECT * FROM reviews LIMIT 5;
