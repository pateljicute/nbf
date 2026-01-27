-- Enable trigram extension for efficient text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes to frequently filtered/sorted columns in 'properties' table

-- 1. Date Sorting (Speed up 'Newest First')
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties (created_at DESC);

-- 2. Status Filtering (Speed up 'Approved' only queries)
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties (status);

-- 3. Availability (Speed up 'Available' check)
CREATE INDEX IF NOT EXISTS idx_properties_available ON public.properties (available_for_sale);

-- 4. City/Location Search (Speed up text search filters)
-- Using trigram index might be overkill for simple equality/ilike, sticking to btree for now for simple lookups
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties (city);

-- Full text search index on location (requires pg_trgm enabled above)
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties USING gin(location gin_trgm_ops);

-- 5. User ID (Speed up 'My Properties')
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties (user_id);

-- 6. Composite Index for common Home Page query: Status + Available + Created At
CREATE INDEX IF NOT EXISTS idx_properties_home_feed ON public.properties (status, available_for_sale, created_at DESC);
