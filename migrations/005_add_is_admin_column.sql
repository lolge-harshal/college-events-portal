-- ============================================================================
-- College Events Portal - Phase 4.1: Add is_admin Column
-- ============================================================================
-- This migration adds the is_admin boolean column to the profiles table
-- to properly identify admin users in the system
-- ============================================================================

-- Add is_admin column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN profiles.is_admin IS 'Boolean flag indicating if user has admin privileges';

-- Create index on is_admin for faster admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- ============================================================================
-- IMPORTANT: After running this migration, set admin users:
-- ============================================================================
-- 
-- To manually set a user as admin in Supabase dashboard:
-- 1. Go to Table Editor
-- 2. Open profiles table
-- 3. Find your user record
-- 4. Set is_admin = true
--
-- OR use this SQL to set a specific user as admin:
-- UPDATE profiles SET is_admin = true WHERE email = 'admin@demo.college-events.edu';
--
-- ============================================================================

-- Verify the column was added
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name = 'is_admin';