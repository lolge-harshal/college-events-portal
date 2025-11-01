-- ============================================================================
-- College Events Portal - Phase 1: Database Schema Initialization
-- ============================================================================
-- This migration creates the core tables for the events portal:
-- 1. profiles - User accounts with roles (student, organizer, admin)
-- 2. events - Event listings with capacity, timing, and organizer info
-- 3. registrations - Join table for student-to-event relationships
-- 
-- All tables use UUID primary keys with gen_random_uuid() for distributed 
-- system compatibility and security. Foreign keys maintain referential integrity.
-- Indexes optimize common query patterns.
-- ============================================================================

-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: profiles
-- ============================================================================
-- Purpose: Store user account information and role-based access control
-- 
-- Columns:
--   - id (UUID): Unique identifier, auto-generated. Primary key.
--     Rationale: UUIDs are globally unique and don't reveal sequence info.
--   - email (VARCHAR): User email. Unique constraint ensures no duplicate accounts.
--     Rationale: Email is used for authentication and communication.
--   - full_name (VARCHAR): User's full name for display purposes.
--   - role (VARCHAR): User's role - 'student', 'organizer', or 'admin'.
--     Rationale: Used for authorization in RLS policies (see below).
--     Note: Could use ENUM type for stricter type safety; keeping VARCHAR for flexibility.
--   - created_at (TIMESTAMP): Account creation timestamp. Auto-set to UTC now.
--     Rationale: Audit trail, sorting by recency.
--   - updated_at (TIMESTAMP): Last modification timestamp. Auto-set on every update.
--     Rationale: Track when profile was last modified.
-- 
-- Constraints:
--   - PRIMARY KEY (id): Ensures uniqueness of each profile
--   - UNIQUE (email): Prevents duplicate email registrations
--   - NOT NULL (email, full_name, role): These fields are required
-- 
-- Indexes:
--   - id (automatic via PRIMARY KEY)
--   - email (explicit UNIQUE index for fast lookups)
--   - role (useful for queries filtering by user type)
--
-- RLS Policy Recommendations (to be enabled in Supabase dashboard):
-- 
--   Policy 1: Users can view their own profile (SELECT)
--     CREATE POLICY "profiles_select_own" ON profiles
--     FOR SELECT USING (auth.uid()::text = id::text);
-- 
--   Policy 2: Users can update their own profile (UPDATE)
--     CREATE POLICY "profiles_update_own" ON profiles
--     FOR UPDATE USING (auth.uid()::text = id::text)
--     WITH CHECK (auth.uid()::text = id::text);
-- 
--   Policy 3: Public SELECT for organizer/admin discovery (optional, for listing organizers)
--     CREATE POLICY "profiles_select_public" ON profiles
--     FOR SELECT USING (role IN ('organizer', 'admin'))
--     WHERE role = 'organizer' OR role = 'admin';
--
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student', -- 'student', 'organizer', 'admin'
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for fast lookups (also enforced by UNIQUE constraint)
CREATE INDEX idx_profiles_email ON profiles(email);

-- Index on role for filtering by user type
CREATE INDEX idx_profiles_role ON profiles(role);

-- Trigger to auto-update updated_at timestamp on profile changes
-- (Trigger creation shown below after the events table)

-- ============================================================================
-- TABLE: events
-- ============================================================================
-- Purpose: Store event information including capacity, timing, and organizer
-- 
-- Columns:
--   - id (UUID): Unique identifier, auto-generated. Primary key.
--     Rationale: Same as profiles - globally unique and secure.
--   - organizer_id (UUID): Foreign key to profiles table.
--     Rationale: Links each event to the user who created/manages it.
--     Constraint: FOREIGN KEY ensures referential integrity.
--   - title (VARCHAR): Event name/title (required).
--     Rationale: Primary identifier for events displayed to users.
--   - description (TEXT): Detailed description of the event.
--     Rationale: Provides full context; TEXT allows longer content than VARCHAR.
--   - capacity (INTEGER): Maximum number of participants allowed.
--     Rationale: Used to prevent overbooking (check in registrations table).
--   - start_time (TIMESTAMP): When the event begins (UTC).
--     Rationale: Critical for scheduling and filtering by date.
--   - end_time (TIMESTAMP): When the event ends (UTC).
--     Rationale: Duration information, prevents end < start validation.
--   - location (VARCHAR): Physical or virtual location of event.
--     Rationale: Essential info for attendees.
--   - created_at (TIMESTAMP): When event was created. Auto-set to UTC now.
--     Rationale: Audit trail and sorting.
--   - updated_at (TIMESTAMP): Last modification timestamp.
--     Rationale: Track event changes (e.g., description updates, capacity changes).
-- 
-- Constraints:
--   - PRIMARY KEY (id): Ensures uniqueness
--   - FOREIGN KEY (organizer_id): Links to profiles, CASCADE on delete
--   - NOT NULL: All columns required
--   - CHECK (start_time < end_time): Ensures events don't end before they start
--   - CHECK (capacity > 0): Events must have at least 1 spot
-- 
-- Indexes:
--   - id (automatic)
--   - organizer_id (for finding events by organizer)
--   - start_time (for sorting/filtering by date)
--   - title (for search functionality, optional but recommended)
--
-- RLS Policy Recommendations (to be enabled):
-- 
--   Policy 1: All authenticated users can view events (SELECT)
--     CREATE POLICY "events_select_all" ON events
--     FOR SELECT USING (true);
-- 
--   Policy 2: Only organizers can create events (INSERT)
--     CREATE POLICY "events_insert_organizer" ON events
--     FOR INSERT USING (
--       auth.uid()::text = organizer_id::text 
--       AND (SELECT role FROM profiles WHERE id = auth.uid()::uuid) IN ('organizer', 'admin')
--     );
-- 
--   Policy 3: Event organizers can update their own events (UPDATE)
--     CREATE POLICY "events_update_own" ON events
--     FOR UPDATE USING (auth.uid()::text = organizer_id::text)
--     WITH CHECK (auth.uid()::text = organizer_id::text);
-- 
--   Policy 4: Event organizers or admins can delete their own events (DELETE)
--     CREATE POLICY "events_delete_own" ON events
--     FOR DELETE USING (
--       auth.uid()::text = organizer_id::text 
--       OR (SELECT role FROM profiles WHERE id = auth.uid()::uuid) = 'admin'
--     );
--
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT check_event_times CHECK (start_time < end_time),
  CONSTRAINT check_capacity_positive CHECK (capacity > 0)
);

-- Index on organizer_id for finding events by organizer
CREATE INDEX idx_events_organizer_id ON events(organizer_id);

-- Index on start_time for sorting/filtering by date
CREATE INDEX idx_events_start_time ON events(start_time);

-- Index on title for search functionality
CREATE INDEX idx_events_title ON events(title);

-- ============================================================================
-- TABLE: registrations
-- ============================================================================
-- Purpose: Join table for many-to-many relationship between profiles and events
--         Tracks which students are registered for which events
-- 
-- Columns:
--   - id (UUID): Unique identifier, auto-generated. Primary key.
--     Rationale: Allows unique tracking of each registration record.
--   - profile_id (UUID): Foreign key to profiles table.
--     Rationale: Identifies the student/user registering.
--     Constraint: FOREIGN KEY ensures referential integrity.
--   - event_id (UUID): Foreign key to events table.
--     Rationale: Identifies the event being registered for.
--     Constraint: FOREIGN KEY ensures referential integrity.
--   - registered_at (TIMESTAMP): When the registration was made (UTC).
--     Rationale: Determines registration order for waitlist scenarios.
-- 
-- Constraints:
--   - PRIMARY KEY (id): Unique registration record
--   - UNIQUE (profile_id, event_id): Prevents duplicate registrations
--     Rationale: A user can only register once per event.
--   - FOREIGN KEY (profile_id): Links to profiles table
--   - FOREIGN KEY (event_id): Links to events table
-- 
-- Indexes:
--   - id (automatic)
--   - profile_id (for finding user's registrations)
--   - event_id (for finding registrations for an event)
--   - Combined (profile_id, event_id) - implicit from UNIQUE constraint
--
-- RLS Policy Recommendations (to be enabled):
-- 
--   Policy 1: Users can view their own registrations (SELECT)
--     CREATE POLICY "registrations_select_own" ON registrations
--     FOR SELECT USING (auth.uid()::text = profile_id::text);
-- 
--   Policy 2: Event organizers can view all registrations for their events (SELECT)
--     CREATE POLICY "registrations_select_organizer" ON registrations
--     FOR SELECT USING (
--       EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()::uuid)
--     );
-- 
--   Policy 3: Authenticated users can register for events (INSERT)
--     CREATE POLICY "registrations_insert_auth" ON registrations
--     FOR INSERT WITH CHECK (
--       auth.uid()::text = profile_id::text
--       AND (SELECT COUNT(*) FROM registrations WHERE event_id = NEW.event_id) < 
--           (SELECT capacity FROM events WHERE id = NEW.event_id)
--     );
-- 
--   Policy 4: Users can cancel their own registrations (DELETE)
--     CREATE POLICY "registrations_delete_own" ON registrations
--     FOR DELETE USING (auth.uid()::text = profile_id::text);
--
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  event_id UUID NOT NULL,
  registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE (profile_id, event_id),
  CONSTRAINT fk_registrations_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Index on profile_id for finding user's registrations
CREATE INDEX idx_registrations_profile_id ON registrations(profile_id);

-- Index on event_id for finding registrations for an event
CREATE INDEX idx_registrations_event_id ON registrations(event_id);

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- ============================================================================
-- Purpose: Automatically set updated_at to current timestamp whenever 
--         a record is modified

-- Trigger function (shared by all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles table
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to events table
CREATE TRIGGER trigger_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS (ROW LEVEL SECURITY) - ENABLE WHEN READY
-- ============================================================================
-- To enable RLS, run these commands in Supabase SQL editor:
--   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE events ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
-- 
-- Then create the policies as documented above.
-- For now, they are commented out to allow full table access during development.
-- ============================================================================