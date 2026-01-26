-- FINAL PRODUCTION SECURITY ENFORCEMENT
-- Re-enables RLS on tracking tables to ensure data security.

-- 1. Enable RLS on Leads Activity
ALTER TABLE leads_activity ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on Property Views
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

-- 3. Verify Policies (Ensure 'Insert Public' exists)
-- If policies are missing, these commands ensure basic public insertion is allowed (required for tracking)
CREATE POLICY "Allow public insert tracking" ON leads_activity FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public view tracking" ON property_views FOR INSERT WITH CHECK (true);

-- 4. Enable RLS on Properties (Core Data)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
