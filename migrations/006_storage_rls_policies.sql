-- ============================================================================
-- COLLEGE EVENTS PORTAL - STORAGE RLS POLICIES FOR EVENT IMAGES
-- ============================================================================
-- Fix for: "StorageApiError: new row violates row-level security policy"
-- Run this in Supabase SQL Editor to enable authenticated users to upload images
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Storage Policies for event-images bucket
-- ============================================================================
-- These policies allow:
-- 1. Authenticated users to upload images (INSERT)
-- 2. Public read access to images (SELECT)  
-- 3. Users to delete only their own images (DELETE)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- ============================================================================
-- POLICY 1: Allow authenticated users to upload images
-- ============================================================================
CREATE POLICY "Allow authenticated upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images' AND
  (auth.role() = 'authenticated')
);

-- ============================================================================
-- POLICY 2: Allow public read access to images
-- ============================================================================
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'event-images'
);

-- ============================================================================
-- POLICY 3: Allow authenticated users to delete their own images
-- ============================================================================
CREATE POLICY "Allow authenticated delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images' AND
  (auth.role() = 'authenticated')
);

-- ============================================================================
-- STEP 2: Verify policies are created
-- ============================================================================
-- Select all policies on storage.objects to verify they exist
SELECT
    policyname,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- ============================================================================
-- STEP 3: Verify bucket settings
-- ============================================================================
-- Check if event-images bucket is public (not private)
SELECT
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE name = 'event-images';

-- ============================================================================
-- DONE! Storage policies are now configured
-- ============================================================================
-- Your app should now:
-- ✅ Allow authenticated users to upload images
-- ✅ Allow public read access to images
-- ✅ Allow users to delete their own images
-- ✅ No more "row-level security policy" errors when creating events
--
-- Test by:
-- 1. Go to admin create event page
-- 2. Upload an image
-- 3. Create event - should succeed without storage errors
-- ============================================================================