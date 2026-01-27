-- 12_seed_data.sql
-- PURPOSE: Insert initial required data.
-- ORDER: 12/12

-- 1. Insert Default Collections
INSERT INTO public.collections (id, handle, title, description, path) VALUES
('joyco-root', 'all', 'All Properties', 'Browse all properties', '/shop'),
('apartments', 'apartments', 'Apartments', 'Find the best apartments', '/search/apartments'),
('pg', 'pg', 'PG / Hostels', 'Affordable PGs and Hostels', '/search/pg'),
('rooms', 'rooms', 'Private Rooms', 'Cozy private rooms', '/search/rooms'),
('1bhk', '1bhk', '1 BHK', '1 BHK Flats', '/search/1bhk'),
('2bhk', '2bhk', '2 BHK', '2 BHK Flats', '/search/2bhk'),
('3bhk', '3bhk', '3 BHK', '3 BHK Flats', '/search/3bhk')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Default Site Settings
INSERT INTO public.site_settings (key, value) VALUES 
('homepage_title', 'Find Your Perfect Home – Zero Brokerage, Zero Stress'),
('homepage_description', 'Discover verified rooms, PGs, and shared flats in Mandsaur and nearby cities.'),
('whatsapp_number', '7470724553')
ON CONFLICT (key) DO NOTHING;

-- 3. Grant Admin Access (Sushil Bhai)
-- Update the user role if the email exists.
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'sushilpatel7489@gmail.com';

-- Logic: Ensure user exists in admin_users table for high-security checks.
INSERT INTO public.admin_users (user_id)
SELECT id FROM public.users WHERE email = 'sushilpatel7489@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
