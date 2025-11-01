# College Events Portal - Phase 1: Supabase Schema & Seeds

## Overview

**Phase 1** establishes the complete database schema and sample data for the College Events Portal. This phase implements:

✅ **Three core tables** with UUID primary keys, proper indexing, and foreign key relationships  
✅ **Role-based access control** (student, organizer, admin)  
✅ **Row-Level Security (RLS) policies** with detailed recommendations  
✅ **Sample data** for development and testing  
✅ **Triggers** for automatic timestamp management  

**Status**: Ready for deployment. All SQL is production-ready; RLS policies are included as comments for manual enablement.

---

## Architecture Overview

### Entity Relationship Diagram (Conceptual)

```
┌─────────────┐
│  profiles   │
├─────────────┤
│ id (UUID)   │ ◄───────────────────────┐
│ email       │                         │
│ full_name   │                         │
│ role        │                         │ FOREIGN KEY
│ created_at  │                         │ (organizer_id)
│ updated_at  │                         │
└─────────────┘                         │
      ▲                                 │
      │ FOREIGN KEY                     │
      │ (profile_id)                    │
      │                          ┌──────────────┐
      │                          │    events    │
      │                          ├──────────────┤
      │                          │ id (UUID)    │
      ├──────────────────────────│ organizer_id │ (REFERENCES profiles)
      │                          │ title        │
      │                          │ description  │
      │                          │ capacity     │
      │ FOREIGN KEY              │ start_time   │
      │ (event_id)               │ end_time     │
      │                          │ location     │
      │                          │ created_at   │
      │                          │ updated_at   │
      │                          └──────────────┘
      │                                 ▲
      │                                 │
 ┌────┴──────┐                          │
 │registrations                         │
 ├────────────┤                         │
 │ id (UUID)  │                         │
 │ profile_id ├─────────────────────────┘
 │ event_id   ├─────────────────────────┘
 │registered_at
 └────────────┘
```

---

## File Structure

```
college-events-portal/
├── migrations/
│   └── 001_init.sql              # Database schema initialization
├── seeds/
│   └── seed_sample_data.sql      # Sample data for development/testing
├── README-phase1.md              # This file
└── [other Phase 0 files]
```

---

## SQL Schema Explanation

### Table 1: `profiles`

**Purpose**: Stores user accounts with role-based access control

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Column-by-Column Explanation

| Column | Type | Constraints | Rationale |
|--------|------|-------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Globally unique identifier for distributed systems. `gen_random_uuid()` is cryptographically secure and doesn't leak sequence information. |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Primary identifier for authentication. UNIQUE constraint ensures no duplicate accounts. |
| `full_name` | VARCHAR(255) | NOT NULL | Display name for UI (greetings, profile cards, etc.). |
| `role` | VARCHAR(50) | NOT NULL, DEFAULT 'student' | Controls permissions via RLS policies. Values: `'student'`, `'organizer'`, `'admin'`. Defaults to 'student' for new sign-ups. |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Audit trail. Set automatically when record is created. |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Modified whenever profile is updated (via trigger). Used to detect changes. |

#### Indexes

```sql
CREATE INDEX idx_profiles_email ON profiles(email);  -- UNIQUE constraint already indexes this
CREATE INDEX idx_profiles_role ON profiles(role);    -- Fast filtering by user type
```

**Why these indexes?**
- `email`: Fast user lookups during login (O(log n) instead of O(n))
- `role`: Fast queries like "find all organizers" or counting admins

#### Trigger

```sql
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Why?** Automatically updates `updated_at` timestamp whenever any profile field changes. No manual management needed.

---

### Table 2: `events`

**Purpose**: Stores event listings with capacity limits and timing constraints

```sql
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
  
  CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_id) 
    REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT check_event_times CHECK (start_time < end_time),
  CONSTRAINT check_capacity_positive CHECK (capacity > 0)
);
```

#### Column-by-Column Explanation

| Column | Type | Constraints | Rationale |
|--------|------|-------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique event identifier. Same security benefits as profiles. |
| `organizer_id` | UUID | NOT NULL, FOREIGN KEY | Links to profiles.id. Identifies who created/manages the event. `ON DELETE CASCADE` ensures orphaned events are cleaned up if organizer is deleted. |
| `title` | VARCHAR(255) | NOT NULL | Event name displayed in listings. VARCHAR(255) is reasonable for titles. |
| `description` | TEXT | NOT NULL | Detailed event info. TEXT allows unlimited length (vs. VARCHAR's limit). |
| `capacity` | INTEGER | NOT NULL, CHECK > 0 | Max attendees. Positive integer constraint prevents zero/negative capacities. |
| `start_time` | TIMESTAMP | NOT NULL | Event begins (UTC timezone recommended). Used for sorting, filtering, and validation. |
| `end_time` | TIMESTAMP | NOT NULL | Event ends (UTC timezone recommended). |
| `location` | VARCHAR(255) | NOT NULL | Physical/virtual venue. Could store GPS coords in future versions. |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Audit trail. Event creation time. |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last modification. Useful for detecting stale data in cache. |

#### Constraints

```sql
-- Ensures event times are logical
CONSTRAINT check_event_times CHECK (start_time < end_time)

-- Prevents invalid capacities
CONSTRAINT check_capacity_positive CHECK (capacity > 0)

-- Maintains referential integrity; cascades on organizer deletion
CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_id) 
  REFERENCES profiles(id) ON DELETE CASCADE
```

**Why CASCADE?** If an organizer account is deleted, their events should also be deleted to maintain data consistency.

#### Indexes

```sql
CREATE INDEX idx_events_organizer_id ON events(organizer_id);  -- Find events by organizer
CREATE INDEX idx_events_start_time ON events(start_time);      -- Sort/filter by date
CREATE INDEX idx_events_title ON events(title);                -- Search functionality
```

**Why these indexes?**
- `organizer_id`: Queries like "show Carol's events" (JOIN on organizer_id)
- `start_time`: Queries like "list events next week" (WHERE start_time BETWEEN ...)
- `title`: Full-text search or filtering by event name

---

### Table 3: `registrations`

**Purpose**: Many-to-many join table linking students to events

```sql
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  event_id UUID NOT NULL,
  registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (profile_id, event_id),
  CONSTRAINT fk_registrations_profile FOREIGN KEY (profile_id) 
    REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) 
    REFERENCES events(id) ON DELETE CASCADE
);
```

#### Column-by-Column Explanation

| Column | Type | Constraints | Rationale |
|--------|------|-------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique registration record. Allows independent deletion/modification. |
| `profile_id` | UUID | NOT NULL, FOREIGN KEY | References profiles.id. Identifies the registering user. Cascades on deletion. |
| `event_id` | UUID | NOT NULL, FOREIGN KEY | References events.id. Identifies the registered event. Cascades on deletion. |
| `registered_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When registration was made. Used for waitlist ordering (first-come-first-served). |

#### Constraints

```sql
-- Prevents duplicate registrations (user can only register once per event)
UNIQUE (profile_id, event_id)

-- Cascades on user or event deletion
CONSTRAINT fk_registrations_profile FOREIGN KEY (profile_id) 
  REFERENCES profiles(id) ON DELETE CASCADE,
CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) 
  REFERENCES events(id) ON DELETE CASCADE
```

**Why UNIQUE?** If a student tries to register for the same event twice, the database rejects it (prevents accidental duplicates, simplifies cancellation logic).

#### Indexes

```sql
CREATE INDEX idx_registrations_profile_id ON registrations(profile_id);  -- Find user's registrations
CREATE INDEX idx_registrations_event_id ON registrations(event_id);      -- Find attendees for event
```

**Why these indexes?**
- `profile_id`: Queries like "show Alice's registered events"
- `event_id`: Queries like "list all students registered for Event X" (capacity checks, email lists)

---

## Row-Level Security (RLS) Policies

RLS enforces access control at the database level—no record is returned unless the policy allows it.

### Enabling RLS in Supabase

1. **Go to Supabase Dashboard** → Your Project
2. **Navigate to** SQL Editor → Run a new query
3. **Enable RLS** on each table:

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
```

### RLS Policies (Ready to Deploy)

#### Profiles Policies

**Policy 1: Users can view their own profile**
```sql
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT 
  USING (auth.uid()::text = id::text);
```
**When**: User queries SELECT on profiles  
**Effect**: Only their own profile row is returned

**Policy 2: Users can update their own profile**
```sql
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE 
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);
```
**When**: User runs UPDATE  
**Effect**: Only their own profile can be modified

#### Events Policies

**Policy 1: All authenticated users can view events**
```sql
CREATE POLICY "events_select_all" ON events
  FOR SELECT 
  USING (true);  -- Anyone can see all events
```
**When**: User queries SELECT on events  
**Effect**: All events are visible (no restriction)

**Policy 2: Only organizers/admins can create events**
```sql
CREATE POLICY "events_insert_organizer" ON events
  FOR INSERT 
  WITH CHECK (
    auth.uid()::text = organizer_id::text 
    AND (SELECT role FROM profiles WHERE id = auth.uid()::uuid) IN ('organizer', 'admin')
  );
```
**When**: User runs INSERT  
**Effect**: Creates event only if user is setting themselves as organizer AND their role is organizer/admin

**Policy 3: Event organizers can edit their own events**
```sql
CREATE POLICY "events_update_own" ON events
  FOR UPDATE 
  USING (auth.uid()::text = organizer_id::text)
  WITH CHECK (auth.uid()::text = organizer_id::text);
```
**When**: User runs UPDATE  
**Effect**: Can only modify events they organized

**Policy 4: Event organizers/admins can delete their events**
```sql
CREATE POLICY "events_delete_own" ON events
  FOR DELETE 
  USING (
    auth.uid()::text = organizer_id::text 
    OR (SELECT role FROM profiles WHERE id = auth.uid()::uuid) = 'admin'
  );
```
**When**: User runs DELETE  
**Effect**: Event organizer or admin can delete

#### Registrations Policies

**Policy 1: Users can view their own registrations**
```sql
CREATE POLICY "registrations_select_own" ON registrations
  FOR SELECT 
  USING (auth.uid()::text = profile_id::text);
```
**When**: User queries SELECT on registrations  
**Effect**: Only their own registrations are visible

**Policy 2: Event organizers can view all registrations for their events**
```sql
CREATE POLICY "registrations_select_organizer" ON registrations
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE id = event_id 
      AND organizer_id = auth.uid()::uuid
    )
  );
```
**When**: Organizer queries SELECT on registrations  
**Effect**: Sees all registrations for their events

**Policy 3: Authenticated users can register for events**
```sql
CREATE POLICY "registrations_insert_auth" ON registrations
  FOR INSERT 
  WITH CHECK (
    auth.uid()::text = profile_id::text
    AND (SELECT COUNT(*) FROM registrations WHERE event_id = NEW.event_id) 
        < (SELECT capacity FROM events WHERE id = NEW.event_id)
  );
```
**When**: User runs INSERT  
**Effect**: Can only register as themselves; prevents double-booking capacity

**Policy 4: Users can cancel their own registrations**
```sql
CREATE POLICY "registrations_delete_own" ON registrations
  FOR DELETE 
  USING (auth.uid()::text = profile_id::text);
```
**When**: User runs DELETE  
**Effect**: Can only delete their own registrations

---

## Executing the Migrations & Seeds

### Step 1: Run the Migration

1. **In Supabase Dashboard**, go to **SQL Editor** → **New Query**
2. **Copy-paste** the entire contents of `migrations/001_init.sql`
3. **Click Run**
4. **Verify**: Tables appear in **Database** → **Tables** sidebar (profiles, events, registrations)

**Expected output**: "Success" message. If you see errors, check for:
- Foreign key references that don't exist (run profiles creation first)
- Duplicate indexes (usually safe to ignore)

### Step 2: Seed Sample Data

1. **In Supabase Dashboard**, go to **SQL Editor** → **New Query**
2. **Copy-paste** the entire contents of `seeds/seed_sample_data.sql`
3. **Click Run**
4. **Verify**: In **Data Editor** tab, you see:
   - 4 rows in `profiles` table
   - 3 rows in `events` table
   - 2 rows in `registrations` table

---

## Supabase Storage: event-images Bucket

Events may have cover images or promotional material. Here's how to create and configure the bucket:

### Step 1: Create the Storage Bucket

1. **In Supabase Dashboard**, click **Storage** (sidebar)
2. **Click "New Bucket"**
3. **Name**: `event-images`
4. **Make it public**: Toggle **"Public bucket"** ON
   - This allows direct URL access to images (e.g., in <img> tags)
5. **Click "Create Bucket"**

### Step 2: Set Storage Policies

By default, authenticated users can upload. To refine permissions:

1. **Click the bucket** → **Policies** tab
2. **For public read access**, create:

```sql
CREATE POLICY "Allow public read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'event-images');
```

3. **For authenticated upload**, create:

```sql
CREATE POLICY "Allow authenticated upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images'
    AND auth.role() = 'authenticated'
  );
```

4. **For user-owned deletion**, create:

```sql
CREATE POLICY "Allow users to delete their own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'event-images'
    AND auth.uid() = owner
  );
```

### Step 3: Upload & Reference Images

**Via Supabase Dashboard** (manual):
1. Click the `event-images` bucket
2. Click "Upload" and select image files

**Via React Code** (programmatic):

```typescript
const { data, error } = await supabase.storage
  .from('event-images')
  .upload(`events/${eventId}/cover.jpg`, file);

// Public URL for image display:
const imageUrl = supabase.storage
  .from('event-images')
  .getPublicUrl(`events/${eventId}/cover.jpg`).data.publicUrl;
```

---

## Example SQL Queries

These queries demonstrate common use cases. Run them in Supabase **SQL Editor** to test.

### Query 1: List All Events

```sql
SELECT
  e.id,
  e.title,
  e.description,
  e.capacity,
  e.start_time,
  e.location,
  p.full_name AS organizer
FROM events e
JOIN profiles p ON e.organizer_id = p.id
ORDER BY e.start_time ASC;
```

**Output**: All events sorted by date, including organizer name.

**Breakdown**:
- `SELECT`: Fetch event details and organizer name
- `JOIN profiles`: Get organizer's full name from profiles table
- `ORDER BY e.start_time ASC`: Chronological order

---

### Query 2: Get Registrations Per Event

```sql
SELECT
  e.title,
  COUNT(r.id) AS registered_count,
  e.capacity,
  e.capacity - COUNT(r.id) AS spots_remaining
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
GROUP BY e.id, e.title, e.capacity
ORDER BY e.title;
```

**Output**: Shows how many students registered for each event and remaining capacity.

**Breakdown**:
- `COUNT(r.id) AS registered_count`: Counts registrations per event
- `e.capacity - COUNT(r.id)`: Calculates remaining spots
- `LEFT JOIN`: Includes events with no registrations (count = 0)
- `GROUP BY`: Aggregates by event

---

### Query 3: Count Participants Per Event

```sql
SELECT
  e.title,
  COUNT(DISTINCT r.profile_id) AS participant_count,
  COUNT(DISTINCT r.profile_id)::float / e.capacity * 100 AS capacity_percentage
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
GROUP BY e.id, e.title, e.capacity
ORDER BY participant_count DESC;
```

**Output**: Lists events with participant count and capacity utilization %.

**Breakdown**:
- `DISTINCT r.profile_id`: Prevents duplicate counts if someone registered twice (shouldn't happen with UNIQUE constraint)
- `::float / e.capacity * 100`: Converts count to percentage
- `ORDER BY participant_count DESC`: Most popular events first

---

### Query 4: Find a Student's Registrations

```sql
SELECT
  p.full_name,
  e.title,
  e.start_time,
  e.location,
  r.registered_at
FROM registrations r
JOIN profiles p ON r.profile_id = p.id
JOIN events e ON r.event_id = e.id
WHERE p.email = 'alice.johnson@college.edu'
ORDER BY e.start_time ASC;
```

**Output**: All events Alice is registered for.

**Breakdown**:
- `WHERE p.email = '...'`: Filter by student email
- `ORDER BY e.start_time`: Chronological order

---

### Query 5: List Events by Organizer

```sql
SELECT
  e.title,
  e.start_time,
  COUNT(r.id) AS registered_students,
  e.capacity
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
WHERE e.organizer_id = (SELECT id FROM profiles WHERE email = 'carol.martinez@college.edu')
GROUP BY e.id, e.title, e.start_time, e.capacity
ORDER BY e.start_time;
```

**Output**: All events organized by Carol with registration counts.

---

### Query 6: Check for Capacity Violations

```sql
SELECT
  e.title,
  e.capacity,
  COUNT(r.id) AS registered_count,
  CASE
    WHEN COUNT(r.id) > e.capacity THEN 'OVER CAPACITY'
    WHEN COUNT(r.id) = e.capacity THEN 'FULL'
    ELSE 'Available'
  END AS status
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
GROUP BY e.id, e.title, e.capacity
HAVING COUNT(r.id) >= e.capacity;
```

**Output**: Events that are at or over capacity (useful for debugging).

---

### Query 7: Find Upcoming Events (Next 7 Days)

```sql
SELECT
  e.title,
  e.start_time,
  e.location,
  COUNT(r.id) AS registered_participants,
  e.capacity - COUNT(r.id) AS spots_available
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
WHERE e.start_time BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '7 days'
GROUP BY e.id, e.title, e.start_time, e.location, e.capacity
ORDER BY e.start_time ASC;
```

**Output**: Events happening in the next week with availability.

---

### Query 8: Admin Dashboard: System Statistics

```sql
SELECT
  (SELECT COUNT(*) FROM profiles) AS total_users,
  (SELECT COUNT(*) FROM profiles WHERE role = 'student') AS total_students,
  (SELECT COUNT(*) FROM profiles WHERE role = 'organizer') AS total_organizers,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') AS total_admins,
  (SELECT COUNT(*) FROM events) AS total_events,
  (SELECT COUNT(*) FROM registrations) AS total_registrations,
  (SELECT AVG(capacity) FROM events)::INTEGER AS avg_event_capacity,
  (SELECT MAX(capacity) FROM events) AS largest_event_capacity;
```

**Output**: High-level system metrics for dashboard/reporting.

---

## Development Workflow

### Phase 1 Checklist

- [x] Create `migrations/001_init.sql` with 3 tables (profiles, events, registrations)
- [x] Create `seeds/seed_sample_data.sql` with realistic sample data
- [x] Document schema in `README-phase1.md`
- [x] Include RLS policy recommendations (commented, ready to enable)
- [x] Create Supabase storage bucket setup guide
- [x] Provide example SQL queries
- [x] Commit with message: "phase1: supabase schema + seeds"

### Next Steps (Phase 2+)

- Implement authentication with Supabase Auth (email/password, social)
- Create React hooks for data fetching (useEvents, useRegistrations, etc.)
- Build event listing UI component
- Build event detail page with registration form
- Implement user profile page
- Add image upload for event covers
- Implement search/filter functionality

---

## Troubleshooting

### Issue: "Column does not exist" error

**Cause**: Tried to run seed before migration.  
**Fix**: Run `migrations/001_init.sql` first.

### Issue: "Unique constraint violation"

**Cause**: Tried to seed duplicate data.  
**Fix**: Clear tables first:

```sql
DELETE FROM registrations;
DELETE FROM events;
DELETE FROM profiles;
```

Then re-run seeds.

### Issue: Foreign key constraint violated

**Cause**: Profile/event referenced in seed doesn't exist.  
**Fix**: Verify migration created all tables correctly. Check table list in Supabase dashboard.

### Issue: RLS policies blocking queries

**Cause**: Enabled RLS but didn't create policies.  
**Fix**: Create policies as documented above, or disable RLS temporarily:

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
```

---

## Deployment Checklist

Before moving to production:

- [ ] Run migration on production database
- [ ] Verify all tables, indexes, and constraints created
- [ ] Seed test data or migrate production data
- [ ] Enable RLS policies in correct order (profiles → events → registrations)
- [ ] Test RLS policies with sample queries
- [ ] Create storage bucket `event-images` with correct permissions
- [ ] Set up database backups in Supabase
- [ ] Document any custom fields added to schema

---

## Git Commit

```bash
git add migrations/001_init.sql seeds/seed_sample_data.sql README-phase1.md
git commit -m "phase1: supabase schema + seeds

- Create profiles, events, registrations tables with UUID PKs
- Add foreign keys, indexes, and CHECK constraints
- Implement triggers for auto-updating timestamps
- Seed 4 profiles (2 students, 1 organizer, 1 admin)
- Seed 3 events with realistic descriptions
- Seed 2 registrations linking students to events
- Document RLS policies (ready to enable)
- Provide example SQL queries for common operations
- Include Supabase storage bucket setup guide"
```

---

## Additional Resources

- **Supabase Documentation**: https://supabase.com/docs
- **PostgreSQL Constraints**: https://www.postgresql.org/docs/current/ddl-constraints.html
- **Row-Level Security**: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **UUID Best Practices**: https://wiki.postgresql.org/wiki/UUID_and_BIGINT_Comparison
- **Indexes**: https://use-the-index-luke.com/

---

**End of Phase 1 Documentation**