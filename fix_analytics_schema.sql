-- FIX Analytics Setup (Run this to fix "Not Working" dashboard)

-- 1. Drop existing tables to reset (Clean Slate)
DROP TABLE IF EXISTS public.poster_logs;
DROP TABLE IF EXISTS public.daily_stats;

-- 2. Create Daily Stats Table
CREATE TABLE public.daily_stats (
    date date PRIMARY KEY DEFAULT CURRENT_DATE,
    visits numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 3. Create Poster Logs Table
-- CRITICAL CHANGE: referencing public.users(id) instead of auth.users(id) to allow JOINs in API
CREATE TABLE public.poster_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE, 
    property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
    poster_type text CHECK (poster_type IN ('single', 'catalog')),
    created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.poster_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Allow public read for daily stats (so admin dashboard can fetch it easily, and anonymous tracking can work if needed)
CREATE POLICY "Public read daily_stats" ON public.daily_stats FOR SELECT TO public USING (true);
CREATE POLICY "Public insert daily_stats" ON public.daily_stats FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update daily_stats" ON public.daily_stats FOR UPDATE TO public USING (true);

-- Allow authenticated read for poster logs
CREATE POLICY "Admin read poster_logs" ON public.poster_logs FOR SELECT TO authenticated USING (true);
-- Allow authenticated insert
CREATE POLICY "Auth insert poster_logs" ON public.poster_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 6. RPC Functions
-- Function to increment visits (Security Definer to bypass any potential RLS issues)
CREATE OR REPLACE FUNCTION increment_daily_visits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.daily_stats (date, visits)
    VALUES (CURRENT_DATE, 1)
    ON CONFLICT (date)
    DO UPDATE SET visits = daily_stats.visits + 1;
END;
$$;

-- Function to record poster logs
CREATE OR REPLACE FUNCTION record_poster_generation(
    p_user_id uuid,
    p_property_id uuid,
    p_poster_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.poster_logs (user_id, property_id, poster_type)
    VALUES (p_user_id, p_property_id, p_poster_type);
EXCEPTION WHEN OTHERS THEN
    -- Prevent crash if user/property doesn't exist
    RAISE WARNING 'Could not log poster generation: %', SQLERRM;
END;
$$;
