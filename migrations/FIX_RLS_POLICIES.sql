-- ============================================================================
-- COLLEGE EVENTS PORTAL - FIX RLS POLICIES
-- ============================================================================
-- Copy-paste this entire block into Supabase SQL Editor and run
-- This fixes the 406 errors and blank screen issues
-- ============================================================================

-- STEP 1: Drop all old broken policies
-- ============================================================================
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
-- STEP 2: Enable RLS on all tables
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create CORRECTED profiles policies (no ::text casting!)
-- ============================================================================

-- Policy 1: Users can view their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy 2: Users can create their own profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can view all profiles
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'::text);

-- Policy 5: Admins can update any profile
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'::text)
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'::text);

-- ============================================================================
-- STEP 4: Create CORRECTED events policies
-- ============================================================================

-- Policy 1: Everyone can view events
CREATE POLICY "events_select_all" ON events
  FOR SELECT 
  USING (true);

-- Policy 2: Organizers and admins can create events
CREATE POLICY "events_insert_organizer" ON events
  FOR INSERT 
  WITH CHECK (
    organizer_id = auth.uid() 
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('organizer', 'admin')
  );

-- Policy 3: Event organizers and admins can update events
CREATE POLICY "events_update_own" ON events
  FOR UPDATE 
  USING (
    organizer_id = auth.uid() 
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    organizer_id = auth.uid() 
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Policy 4: Event organizers and admins can delete events
CREATE POLICY "events_delete_own" ON events
  FOR DELETE 
  USING (
    organizer_id = auth.uid() 
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- STEP 5: Create CORRECTED registrations policies
-- ============================================================================

-- Policy 1: Users can view their own registrations
CREATE POLICY "registrations_select_own" ON registrations
  FOR SELECT 
  USING (profile_id = auth.uid());

-- Policy 2: Event organizers can view all registrations for their events
CREATE POLICY "registrations_select_organizer" ON registrations
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE id = event_id 
      AND organizer_id = auth.uid()
    )
  );

-- Policy 3: Admins can view all registrations
CREATE POLICY "registrations_select_admin" ON registrations
  FOR SELECT 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Policy 4: Authenticated users can create registrations
CREATE POLICY "registrations_insert_auth" ON registrations
  FOR INSERT 
  WITH CHECK (
    profile_id = auth.uid()
  );

-- Policy 5: Users can cancel their own registrations
CREATE POLICY "registrations_delete_own" ON registrations
  FOR DELETE 
  USING (profile_id = auth.uid());

-- ============================================================================
-- STEP 6: Verify everything is set up correctly
-- ============================================================================

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'events', 'registrations')
ORDER BY tablename;

-- Check all policies exist
SELECT
    schemaname,
    tablename,
    policyname,
    permissive
FROM pg_policies
WHERE tablename IN ('profiles', 'events', 'registrations')
ORDER BY tablename, policyname;

-- ============================================================================
-- DONE! RLS Policies are now fixed
-- ============================================================================
-- Your app should now:
-- ✅ Load without blank screen
-- ✅ Not show 406 errors
-- ✅ Allow registration
-- ✅ Properly handle user authentication
--
-- Test by signing in in your app
-- ============================================================================