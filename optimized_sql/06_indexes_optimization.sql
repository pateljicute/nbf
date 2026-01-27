-- 06_indexes_optimization.sql
-- PURPOSE: Add high-performance indexes to speed up all common queries.
-- ORDER: 6/12

-- 1. Properties Indexes
-- Speed up "Active Properties" on Homepage
CREATE INDEX IF NOT EXISTS idx_properties_status_available 
ON public.properties (status, available_for_sale);

-- Speed up "My Listings" for Owners
CREATE INDEX IF NOT EXISTS idx_properties_user_id 
ON public.properties (user_id);

-- Speed up "Search by City"
CREATE INDEX IF NOT EXISTS idx_properties_city 
ON public.properties (city);

-- Speed up geospatial Proximity Search
CREATE INDEX IF NOT EXISTS idx_properties_location_geo 
ON public.properties 
USING GIST (location_geo);

-- Speed up Filter by Price (Range queries)
CREATE INDEX IF NOT EXISTS idx_properties_price_numeric 
ON public.properties ((price::numeric));

-- 2. Users Indexes
-- Speed up Ban Checks (Middleware frequent query)
CREATE INDEX IF NOT EXISTS idx_users_is_banned 
ON public.users (is_banned);

-- Speed up Role Checks
CREATE INDEX IF NOT EXISTS idx_users_role 
ON public.users (role);

-- 3. Interactions Indexes
-- Speed up "Total Leads" count for Dashboard
CREATE INDEX IF NOT EXISTS idx_leads_property_id 
ON public.leads_activity (property_id);

-- Speed up "My Leads" for Owners
CREATE INDEX IF NOT EXISTS idx_leads_owner_id 
ON public.leads_activity (owner_id);

-- 4. Collections Indexes
-- Speed up Router Lookup
CREATE INDEX IF NOT EXISTS idx_collections_handle 
ON public.collections (handle);
