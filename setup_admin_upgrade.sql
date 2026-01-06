-- Upgrade Schema for Master Admin Control

-- 1. Upgrade Users Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role text DEFAULT 'user';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_verified') THEN
        ALTER TABLE public.users ADD COLUMN is_verified boolean DEFAULT false;
    END IF;
END $$;

-- 2. Upgrade Properties Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'is_verified') THEN
        ALTER TABLE public.properties ADD COLUMN is_verified boolean DEFAULT false;
    END IF;
END $$;

-- 3. Create Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
    key text PRIMARY KEY,
    value text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policies for site_settings (Viewable by everyone, Editable only by Admins)
-- Note: 'Admins' here logically means users in public.admin_users table OR users with role='admin'
-- For simplicity in RLS, we stick to checking admin_users table or we update this policy later.
-- For now, generic public read:
CREATE POLICY "Settings are viewable by everyone." ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Settings areupdatable by admins." ON public.site_settings FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
);

-- Seed Default Settings
INSERT INTO public.site_settings (key, value) VALUES 
('homepage_title', 'Find Your Perfect Home – Zero Brokerage, Zero Stress'),
('homepage_description', 'Discover verified rooms, PGs, and shared flats in Mandsaur and nearby cities.'),
('whatsapp_number', '7470724553')
ON CONFLICT (key) DO NOTHING;
