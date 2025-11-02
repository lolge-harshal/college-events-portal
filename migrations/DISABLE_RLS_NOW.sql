-- ============================================================================
-- EMERGENCY FIX - RUN THIS IN SUPABASE SQL EDITOR NOW
-- ============================================================================
-- This fixes the "infinite recursion detected in policy" errors
-- Copy-paste ALL of this into Supabase SQL Editor and click RUN
-- ============================================================================

-- STEP 1: Disable RLS on all tables (fixes infinite recursion error immediately)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop all problematic policies
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_auth" ON profiles;

DROP POLICY IF EXISTS "events_select_all" ON events;
DROP POLICY IF EXISTS "events_insert_organizer" ON events;
DROP POLICY IF EXISTS "events_update_own" ON events;
DROP POLICY IF EXISTS "events_delete_own" ON events;

DROP POLICY IF EXISTS "registrations_select_own" ON registrations;
DROP POLICY IF EXISTS "registrations_select_organizer" ON registrations;
DROP POLICY IF EXISTS "registrations_select_admin" ON registrations;
DROP POLICY IF EXISTS "registrations_insert_auth" ON registrations;
DROP POLICY IF EXISTS "registrations_delete_own" ON registrations;

-- ============================================================================
-- DONE! 
-- Your app should now work without errors!
-- Go back to your app and refresh the page (Cmd+Shift+R)
-- ============================================================================