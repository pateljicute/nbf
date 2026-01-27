-- Database Performance Indexing Script
-- Run this in your Supabase SQL Editor to speed up queries.

-- 1. Properties Table Indexes
-- Speeds up filtering by status (approved/pending) and availability
CREATE INDEX IF NOT EXISTS idx_properties_status_available 
ON public.properties (status, available_for_sale);

-- Speeds up fetching properties by owner (My Listings)
CREATE INDEX IF NOT EXISTS idx_properties_user_id 
ON public.properties (user_id);

-- Speeds up Geolocation Search (Latitude/Longitude)
CREATE INDEX IF NOT EXISTS idx_properties_lat_long 
ON public.properties (latitude, longitude);

-- 2. Users Table Index
-- Speeds up the Ban Check in Middleware and Auth
CREATE INDEX IF NOT EXISTS idx_users_is_banned 
ON public.users (is_banned);

-- 3. Leads Activity Index
-- Speeds up counting leads for Admin Dashboard
CREATE INDEX IF NOT EXISTS idx_leads_property_id 
ON public.leads_activity (property_id);

-- 4. Collections
CREATE INDEX IF NOT EXISTS idx_collections_handle 
ON public.collections (handle);
