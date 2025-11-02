-- ============================================================================
-- College Events Portal - Phase 4: Admin Dashboard & Image Upload
-- ============================================================================
-- This migration adds support for admin dashboard with:
-- 1. Add 'notes' column to registrations table for admin notes
-- 2. Create storage bucket for event images (manual setup required)
-- 3. Document image upload workflow
-- 4. Add RLS policies for admin access
-- ============================================================================

-- ============================================================================
-- STEP 1: Add notes column to registrations table
-- ============================================================================
-- Purpose: Allow admins to add notes to registrations (e.g., accessibility needs, dietary restrictions)

ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment for clarity
COMMENT ON COLUMN registrations.notes IS 'Admin notes for registration (accessibility needs, special requests, etc.)';

-- ============================================================================
-- STEP 2: Document Storage Setup
-- ============================================================================
-- 
-- Supabase Storage Bucket Setup (Manual - DO THIS IN SUPABASE DASHBOARD):
-- 
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create new bucket: "event-images"
-- 3. Set policies:
--    - Allow authenticated users to upload: 
--      CREATE POLICY "Allow authenticated upload" ON storage.objects
--      FOR INSERT TO authenticated
--      WITH CHECK (bucket_id = 'event-images');
--    
--    - Allow public read access:
--      CREATE POLICY "Allow public read" ON storage.objects  
--      FOR SELECT USING (bucket_id = 'event-images' AND auth.role() = 'authenticated_or_anonymous');
--    
--    - Allow authenticated delete:
--      CREATE POLICY "Allow authenticated delete" ON storage.objects
--      FOR DELETE TO authenticated
--      USING (bucket_id = 'event-images');
--
-- OR for production (more restrictive):
--    - Keep bucket PRIVATE and use createSignedUrl() to generate temporary access URLs
--    - Only allow authenticated users to upload
--    - Admin dashboard generates signed URLs for image display
--

-- ============================================================================
-- STEP 3: Create index for efficient admin queries
-- ============================================================================
-- Purpose: Speed up admin dashboard queries for event/registration management

CREATE INDEX IF NOT EXISTS idx_events_organizer_created
ON events(organizer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registrations_event_created
ON registrations(event_id, registered_at DESC);

-- ============================================================================
-- STEP 4: Document RLS Policies for Admin Access (Phase 4)
-- ============================================================================
--
-- IMPORTANT: These policies should be enabled in Supabase dashboard after careful testing
--
-- Policy 1: Admins can see all events (not just their own)
-- CREATE POLICY "admin_events_all_select" ON events
-- FOR SELECT USING (
--   (SELECT role FROM profiles WHERE id = auth.uid()::uuid) = 'admin'
-- );
--
-- Policy 2: Admins can update any event
-- CREATE POLICY "admin_events_all_update" ON events
-- FOR UPDATE USING (
--   (SELECT role FROM profiles WHERE id = auth.uid()::uuid) = 'admin'
-- ) WITH CHECK (true);
--
-- Policy 3: Admins can delete any event
-- CREATE POLICY "admin_events_all_delete" ON events
-- FOR DELETE USING (
--   (SELECT role FROM profiles WHERE id = auth.uid()::uuid) = 'admin'
-- );
--
-- Policy 4: Admins can see all registrations
-- CREATE POLICY "admin_registrations_all_select" ON registrations
-- FOR SELECT USING (
--   (SELECT role FROM profiles WHERE id = auth.uid()::uuid) = 'admin'
-- );
--
-- Policy 5: Admins can update registration status and notes
-- CREATE POLICY "admin_registrations_all_update" ON registrations
-- FOR UPDATE USING (
--   (SELECT role FROM profiles WHERE id = auth.uid()::uuid) = 'admin'
-- ) WITH CHECK (true);
--
-- Policy 6: Admins can delete registrations
-- CREATE POLICY "admin_registrations_all_delete" ON registrations
-- FOR DELETE USING (
--   (SELECT role FROM profiles WHERE id = auth.uid()::uuid) = 'admin'
-- );
--

-- ============================================================================
-- STEP 5: Verify migration success
-- ============================================================================
-- Run these queries to verify all changes were applied:

-- 1. Check notes column exists:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'registrations' AND column_name = 'notes';

-- 2. Check new indexes:
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename IN ('events', 'registrations') 
-- AND indexname LIKE 'idx_%' ORDER BY indexname;

-- ============================================================================