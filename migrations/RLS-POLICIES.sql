-- ============================================================================
-- College Events Portal - Phase 1 Step 5: Enable RLS Policies
-- ============================================================================
-- Run these SQL commands in Supabase SQL Editor to enable Row-Level Security
-- This script enables RLS on all three tables and creates all necessary policies
-- ============================================================================

-- Step 1: Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Policy 1: Users can view their own profile (SELECT)
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT 
  USING (auth.uid()::text = id::text);

-- Policy 2: Users can update their own profile (UPDATE)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE 
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Policy 3: Admins can view all profiles (SELECT)
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()::uuid) = 'admin'
  );

-- Policy 4: Admins can update any profile (UPDATE)
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()::uuid) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()::uuid) = 'admin'
  );

-- ============================================================================
-- EVENTS TABLE POLICIES
-- ============================================================================

-- Policy 1: All authenticated users can view events (SELECT)
CREATE POLICY "events_select_all" ON events
  FOR SELECT 
  USING (true);

-- Policy 2: Only organizers and admins can create events (INSERT)
CREATE POLICY "events_insert_organizer" ON events
  FOR INSERT 
  WITH CHECK (
    auth.uid()::text = organizer_id::text 
    AND (SELECT role FROM profiles WHERE id = auth.uid()::uuid) IN ('organizer', 'admin')
  );

-- Policy 3: Event organizers and admins can update events (UPDATE)
CREATE POLICY "events_update_own" ON events
  FOR UPDATE 
  USING (
    auth.uid()::text = organizer_id::text 
    OR (SELECT role FROM profiles WHERE id = auth.uid()::uuid) = 'admin'
  )
  WITH CHECK (
    auth.uid()::text = organizer_id::text 
    OR (SELECT role FROM profiles WHERE id = auth.uid()::uuid) = 'admin'
  );

-- Policy 4: Event organizers and admins can delete events (DELETE)
CREATE POLICY "events_delete_own" ON events
  FOR DELETE 
  USING (
    auth.uid()::text = organizer_id::text 
    OR (SELECT role FROM profiles WHERE id = auth.uid()::uuid) = 'admin'
  );

-- ============================================================================
-- REGISTRATIONS TABLE POLICIES
-- ============================================================================

-- Policy 1: Users can view their own registrations (SELECT)
CREATE POLICY "registrations_select_own" ON registrations
  FOR SELECT 
  USING (auth.uid()::text = profile_id::text);

-- Policy 2: Event organizers can view all registrations for their events (SELECT)
CREATE POLICY "registrations_select_organizer" ON registrations
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE id = event_id 
      AND organizer_id = auth.uid()::uuid
    )
  );

-- Policy 3: Admins can view all registrations (SELECT)
CREATE POLICY "registrations_select_admin" ON registrations
  FOR SELECT 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()::uuid) = 'admin'
  );

-- Policy 4: Authenticated users can create registrations (INSERT)
CREATE POLICY "registrations_insert_auth" ON registrations
  FOR INSERT 
  WITH CHECK (
    auth.uid()::text = profile_id::text
  );

-- Policy 5: Users can cancel their own registrations (DELETE)
CREATE POLICY "registrations_delete_own" ON registrations
  FOR DELETE 
  USING (auth.uid()::text = profile_id::text);

-- ============================================================================
-- RLS POLICIES COMPLETE
-- ============================================================================
-- All RLS policies have been successfully created.
-- Your database is now secured with row-level security.
-- ============================================================================