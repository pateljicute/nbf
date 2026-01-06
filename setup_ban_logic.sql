-- Add is_banned column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_banned') THEN
        ALTER TABLE public.users ADD COLUMN is_banned boolean DEFAULT false;
    END IF;
END $$;
