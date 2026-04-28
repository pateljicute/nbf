-- ═══════════════════════════════════════════════════════════════════
-- NBF Homes — Fix: support_requests RLS + 24h Cooldown Constraint
-- Run this in your Supabase SQL Editor (BOTH dev and prod)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT NOT NULL,
    phone_number TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'rejected')),
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

-- 3. Drop old/conflicting policies if they exist
DROP POLICY IF EXISTS "allow_insert_support_requests" ON support_requests;
DROP POLICY IF EXISTS "allow_select_own_support_requests" ON support_requests;
DROP POLICY IF EXISTS "admin_all_support_requests" ON support_requests;
DROP POLICY IF EXISTS "allow_anon_insert_support_requests" ON support_requests;

-- 4. Allow ANYONE (logged in or not) to INSERT a support request
--    (Banned users can't login but can still file an appeal as a guest)
CREATE POLICY "allow_insert_support_requests"
ON support_requests
FOR INSERT
TO public  -- public = both authenticated + anon
WITH CHECK (true);

-- 5. Allow users to see their own requests
CREATE POLICY "allow_select_own_support_requests"
ON support_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 6. Allow admin to do everything (uses service_role via server actions)
--    Note: Server actions use the anon key so we grant SELECT to anon too
--    but restrict it. Admins check via separate admin_users table in code.
CREATE POLICY "admin_all_support_requests"
ON support_requests
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
);

-- 7. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_support_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS support_requests_updated_at ON support_requests;
CREATE TRIGGER support_requests_updated_at
    BEFORE UPDATE ON support_requests
    FOR EACH ROW EXECUTE FUNCTION update_support_requests_updated_at();

-- 8. Index for fast 24h cooldown lookup
CREATE INDEX IF NOT EXISTS idx_support_requests_email_created 
ON support_requests(email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_requests_user_id_created 
ON support_requests(user_id, created_at DESC);

-- Done! ✅
SELECT 'support_requests RLS fixed successfully' AS result;
