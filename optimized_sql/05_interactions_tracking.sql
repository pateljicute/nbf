-- 05_interactions_tracking.sql
-- PURPOSE: Track user interactions (leads, views, inquiries) efficiently.
-- ORDER: 5/12

-- 1. Leads Activity Table
-- Tracks every WhatsApp click or Phone reveal.
CREATE TABLE IF NOT EXISTS public.leads_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- optional: if logged in
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE, -- link to property
    owner_id UUID, -- Denormalized for RLS performance (avoid joining properties)
    
    -- Action Details
    action_type TEXT NOT NULL, -- 'whatsapp', 'contact'
    status TEXT DEFAULT 'new', -- 'new', 'seen', 'contacted'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Property Views Table
-- Tracks unique page views for analytics.
CREATE TABLE IF NOT EXISTS public.property_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Inquiries Table (Contact Form)
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User Info
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    
    -- Message Info
    subject TEXT,
    message TEXT NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL, -- Optional linking
    
    -- Status
    status TEXT DEFAULT 'unread', -- 'unread', 'read', 'replied'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
