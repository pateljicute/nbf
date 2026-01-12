-- 1. Create Poster Logs Table
CREATE TABLE IF NOT EXISTS public.poster_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    property_id uuid REFERENCES public.properties(id),
    poster_type text CHECK (poster_type IN ('single', 'catalog')),
    created_at timestamptz DEFAULT now()
);

-- 2. Create Daily Stats Table
CREATE TABLE IF NOT EXISTS public.daily_stats (
    date date PRIMARY KEY DEFAULT CURRENT_DATE,
    visits numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.poster_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Allow anyone to insert logs (controlled by backend/API)
CREATE POLICY "Allow authenticated inserts for poster_logs" 
ON public.poster_logs FOR INSERT TO authenticated 
WITH CHECK (true);

-- Allow admins (or anyone for now, refine later) to read logs
CREATE POLICY "Allow read access for poster_logs" 
ON public.poster_logs FOR SELECT TO authenticated 
USING (true);

-- Allow anyone to read/update daily stats (for incrementing)
CREATE POLICY "Public read access for daily_stats" 
ON public.daily_stats FOR SELECT TO public 
USING (true);

-- 5. RPC Functions for safe atomic increments

-- Function to record a visit
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

-- Function to record poster generation
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
END;
$$;
