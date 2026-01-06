-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    media_url TEXT NOT NULL,
    media_type TEXT CHECK (media_type IN ('image', 'video')) NOT NULL DEFAULT 'image',
    cta_text TEXT,
    cta_link TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access" ON ads FOR SELECT USING (true);

-- Allow full access to admins/authenticated users (simplifying for now, ideally admin only)
CREATE POLICY "Allow authenticated update" ON ads FOR ALL USING (auth.role() = 'authenticated');

-- Insert header row if not exists (we only need one active ad for this feature)
INSERT INTO ads (id, media_url, media_type, cta_text, cta_link, is_active)
SELECT '00000000-0000-0000-0000-000000000001', '', 'image', 'Learn More', '#', true
WHERE NOT EXISTS (SELECT 1 FROM ads);
