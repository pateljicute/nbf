-- 16_critical_speed_up.sql
-- PURPOSE: "Zero-Lag" Performance Overhaul
-- ACTION: Run this to instantly boost DB speed.

-- 1. Aggressive GIN Indexing (For Instant Search)
-- Allows the database to search text instantly instead of scanning row-by-row.
CREATE EXTENSION IF NOT EXISTS btree_gin;

CREATE INDEX IF NOT EXISTS idx_properties_search_gin 
ON public.properties 
USING GIN (to_tsvector('english', 
  COALESCE(title, '') || ' ' || 
  COALESCE(city, '') || ' ' || 
  COALESCE(locality, '')
));

-- 2. Partial Indexing (Smart Indexing)
-- Instead of indexing ALL rows, we only index the ones that actually show up on the site.
-- This makes the index smaller and faster to read.
CREATE INDEX IF NOT EXISTS idx_properties_active_only 
ON public.properties (created_at DESC)
WHERE status = 'approved' AND available_for_sale = true;

CREATE INDEX IF NOT EXISTS idx_properties_price_active
ON public.properties ("price")
WHERE status = 'approved' AND available_for_sale = true;

-- 3. Maintenance & Cleanup (Garbage Collection)
-- NOTE: "VACUUM cannot run inside a transaction block". 
-- Supabase handles auto-vacuuming, so we can skip this manual step in the script to avoid errors.
-- IF YOU WANT TO RUN IT: Run these commands one by one in a separate query tab.
-- VACUUM ANALYZE public.properties;
-- VACUUM ANALYZE public.users;
-- VACUUM ANALYZE public.leads_activity;

-- 4. Connection Warming (Optional hint, not runnable code)
-- "Prepared Statements" are handled by the application (Next.js), 
-- but ensuring indexes exist allows prepared statements to execute instantly.
