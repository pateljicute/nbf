-- Create advertisements table
CREATE TABLE IF NOT EXISTS advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    desktop_media_url TEXT NOT NULL,
    desktop_media_type VARCHAR(50) NOT NULL CHECK (desktop_media_type IN ('image', 'video')),
    mobile_media_url TEXT NOT NULL,
    mobile_media_type VARCHAR(50) NOT NULL CHECK (mobile_media_type IN ('image', 'video')),
    action_url TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active ads
DROP POLICY IF EXISTS "Public can view active advertisements" ON advertisements;
CREATE POLICY "Public can view active advertisements" 
ON advertisements FOR SELECT 
USING (is_active = true);

-- Policy: Admins can do everything
DROP POLICY IF EXISTS "Admins have full access to advertisements" ON advertisements;
CREATE POLICY "Admins have full access to advertisements" 
ON advertisements FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
);
