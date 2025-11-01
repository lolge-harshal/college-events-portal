-- ============================================================================
-- College Events Portal - Phase 1: Sample Data Seed
-- ============================================================================
-- This seed script populates the database with realistic sample data:
-- - 4 profiles (2 students, 1 organizer, 1 admin)
-- - 3 events created by organizers
-- - 2 registrations linking students to events
-- 
-- Purpose: Provides test data for development and demonstration
-- 
-- Note: These UUIDs are generated fresh each time; in production, you might
--       want to use fixed UUIDs for reproducibility in tests.
-- ============================================================================

-- ============================================================================
-- PROFILES: Sample Users
-- ============================================================================

-- Student 1: Alice Johnson
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'alice.johnson@college.edu',
  'Alice Johnson',
  'student',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Student 2: Bob Chen
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'bob.chen@college.edu',
  'Bob Chen',
  'student',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Organizer: Carol Martinez (can create and manage events)
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'carol.martinez@college.edu',
  'Carol Martinez',
  'organizer',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Admin: David Lee (has full system access)
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'david.lee@college.edu',
  'David Lee',
  'admin',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- ============================================================================
-- EVENTS: Sample Events
-- ============================================================================
-- Note: Event IDs and organizer IDs will be fetched from the database
--       to maintain referential integrity

-- Event 1: Python Workshop
-- Organized by Carol Martinez
-- Scheduled for next month
INSERT INTO events (
  id,
  organizer_id,
  title,
  description,
  capacity,
  start_time,
  end_time,
  location,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  p.id,
  'Python Workshop: Data Science Basics',
  'Learn the fundamentals of Python for data science. This workshop covers NumPy, Pandas, and Matplotlib basics. Perfect for beginners looking to start their data science journey. Bring your laptop and a curious mind!',
  50,
  CURRENT_TIMESTAMP + INTERVAL '30 days',
  CURRENT_TIMESTAMP + INTERVAL '30 days 2 hours',
  'Science Building, Room 201',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM profiles p
WHERE p.email = 'carol.martinez@college.edu'
LIMIT 1;

-- Event 2: Annual Tech Conference
-- Organized by Carol Martinez
-- Scheduled for 2 months from now
INSERT INTO events (
  id,
  organizer_id,
  title,
  description,
  capacity,
  start_time,
  end_time,
  location,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  p.id,
  'Annual Tech Conference 2024',
  'Join us for our flagship annual tech conference featuring keynote speeches from industry leaders, networking sessions, and hands-on workshops. Explore topics like AI, cloud computing, cybersecurity, and more. Register early as spots fill quickly!',
  200,
  CURRENT_TIMESTAMP + INTERVAL '60 days',
  CURRENT_TIMESTAMP + INTERVAL '60 days 8 hours',
  'Main Auditorium',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM profiles p
WHERE p.email = 'carol.martinez@college.edu'
LIMIT 1;

-- Event 3: Web Development Bootcamp
-- Organized by Carol Martinez
-- Scheduled for 45 days from now
INSERT INTO events (
  id,
  organizer_id,
  title,
  description,
  capacity,
  start_time,
  end_time,
  location,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  p.id,
  'Full Stack Web Development Bootcamp',
  'Intensive bootcamp covering HTML, CSS, JavaScript, React, Node.js, and databases. This 6-week program transforms beginners into junior developers ready for entry-level positions. Includes career mentorship and job placement assistance.',
  30,
  CURRENT_TIMESTAMP + INTERVAL '45 days',
  CURRENT_TIMESTAMP + INTERVAL '45 days 6 hours',
  'Tech Innovation Hub, Building A',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM profiles p
WHERE p.email = 'carol.martinez@college.edu'
LIMIT 1;

-- ============================================================================
-- REGISTRATIONS: Link Students to Events
-- ============================================================================
-- Note: Similar to events, we fetch the IDs dynamically to ensure integrity

-- Registration 1: Alice Johnson registers for Python Workshop
INSERT INTO registrations (
  id,
  profile_id,
  event_id,
  registered_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE email = 'alice.johnson@college.edu'),
  (SELECT id FROM events WHERE title = 'Python Workshop: Data Science Basics'),
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM profiles WHERE email = 'alice.johnson@college.edu')
  AND EXISTS (SELECT 1 FROM events WHERE title = 'Python Workshop: Data Science Basics');

-- Registration 2: Bob Chen registers for Annual Tech Conference
INSERT INTO registrations (
  id,
  profile_id,
  event_id,
  registered_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE email = 'bob.chen@college.edu'),
  (SELECT id FROM events WHERE title = 'Annual Tech Conference 2024'),
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM profiles WHERE email = 'bob.chen@college.edu')
  AND EXISTS (SELECT 1 FROM events WHERE title = 'Annual Tech Conference 2024');

-- ============================================================================
-- SEED COMPLETION NOTICE
-- ============================================================================
-- Sample data has been successfully seeded into the database.
-- 
-- Summary of inserted data:
--   ✓ 4 profiles (2 students, 1 organizer, 1 admin)
--   ✓ 3 events
--   ✓ 2 registrations
-- 
-- Key takeaways for testing:
-- 1. Alice Johnson is registered for the Python Workshop
-- 2. Bob Chen is registered for the Annual Tech Conference
-- 3. Carol Martinez is the organizer of all events
-- 4. David Lee can administer the system
-- 
-- Common test queries are documented in README-phase1.md
-- ============================================================================