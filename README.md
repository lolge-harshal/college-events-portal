# College Events Portal

A modern, full-stack web application for managing and discovering college events. Built with React, Vite, and Supabase, featuring authentication, admin dashboards, event registration, and real-time updates.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Setup Instructions](#setup-instructions)
- [Database Migrations](#database-migrations)
- [Deployment](#deployment)
- [Security & RLS](#security--rls)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Contributing](#contributing)

## ✨ Features

### Public Features
- 🔍 **Browse Events**: View all upcoming college events with detailed information
- 🎯 **Search & Filter**: Find events by title, category, location, and date
- 📅 **Event Details**: View comprehensive event information including time, location, capacity, and organizer
- 🎨 **Responsive Design**: Fully responsive UI that works on mobile, tablet, and desktop

### User Features (Authenticated)
- 👤 **User Profiles**: Create and manage your profile information
- 📝 **Event Registration**: Register for events you're interested in
- 💾 **Registration History**: View your past registrations and upcoming events
- 🔐 **Secure Authentication**: Email/password authentication with Supabase Auth

### Admin Features
- 🏢 **Admin Dashboard**: Comprehensive event management interface
- ➕ **Create Events**: Create new events with image uploads and detailed information
- ✏️ **Edit Events**: Modify existing event details
- 🗑️ **Delete Events**: Remove events from the platform
- 📊 **View Registrations**: See all registrations for each event with attendee details
- 📝 **Add Notes**: Add admin notes to registrations (special requests, accessibility needs)
- 📤 **Export Data**: Export registration data to CSV format
- 🖼️ **Event Images**: Upload and manage event images in Supabase Storage

## 🛠 Tech Stack

### Frontend
- **React 18.2** - UI library with hooks
- **Vite 5.0** - Lightning-fast build tool
- **TypeScript 5.2** - Type-safe JavaScript
- **Tailwind CSS 3.3** - Utility-first CSS framework
- **React Router 6.16** - Client-side routing
- **Vitest** - Unit and integration testing framework
- **React Testing Library** - Component testing utilities

### Backend
- **Supabase** - Backend-as-a-Service (PostgreSQL database, authentication, storage)
- **PostgreSQL** - Relational database
- **Supabase Auth** - Authentication service
- **Supabase Storage** - File storage for event images

### Development Tools
- **ESLint** - Code quality and linting
- **Prettier** - Code formatting
- **TypeScript Compiler** - Type checking
- **PostCSS** - CSS processing

## 🏗 Project Architecture

```
college-events-portal/
├── src/
│   ├── pages/                    # Page components
│   │   ├── Home.tsx             # Landing page
│   │   ├── Events.tsx           # Events listing page
│   │   ├── EventDetail.tsx      # Single event details
│   │   ├── Profile.tsx          # User profile page
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx    # Admin dashboard
│   │   │   ├── EventForm.tsx    # Event create/edit form
│   │   │   └── Registrations.tsx # Event registrations view
│   │   └── auth/
│   │       ├── Login.tsx        # Login page
│   │       └── Signup.tsx       # Signup page
│   ├── components/              # Reusable components
│   │   ├── Header.tsx           # Navigation header
│   │   ├── Footer.tsx           # Footer
│   │   ├── ProtectedRoute.tsx   # Auth-protected route
│   │   ├── AdminProtectedRoute.tsx # Admin-protected route
│   │   └── RegisterButton.tsx   # Event registration button
│   ├── hooks/
│   │   └── useAuth.tsx          # Authentication context
│   ├── lib/
│   │   ├── supabaseClient.ts    # Supabase client setup
│   │   ├── imageUpload.ts       # Image upload utilities
│   │   ├── csvExport.ts         # CSV export utilities
│   │   └── queryTimeout.ts      # Query timeout wrapper
│   ├── App.tsx                  # Main app component with routing
│   ├── main.tsx                 # App entry point
│   └── index.css                # Global styles
├── tests/                       # Test files
│   ├── setup.ts                 # Test setup and mocks
│   ├── Home.test.tsx
│   ├── Events.test.tsx
│   └── AdminDashboard.test.tsx
├── migrations/                  # SQL migrations
│   ├── 001_init.sql
│   ├── 002_phase3_registrations.sql
│   ├── 003_fix_rls_issues.sql
│   ├── 004_phase4_admin_dashboard.sql
│   └── 005_add_is_admin_column.sql
├── seeds/                       # Sample data seeds
│   └── seed_sample_data.sql
├── public/                      # Static assets
├── tailwind.config.ts           # Tailwind CSS configuration
├── vite.config.ts               # Vite configuration
├── vitest.config.ts             # Vitest configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 16+ and npm/yarn
- Git
- A Supabase account (free tier available at https://supabase.com)

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Project Name**: college-events-portal (or your preference)
   - **Database Password**: Create a strong password
   - **Region**: Select closest to your location
4. Wait for the project to initialize (2-5 minutes)
5. Copy your project URL and anon key from the Settings tab

### Step 2: Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd college-events-portal

# Install dependencies
npm install
```

### Step 3: Setup Environment Variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
VITE_API_URL=http://localhost:5173
```

**Where to find these values:**
- Login to [Supabase Dashboard](https://app.supabase.com)
- Go to Settings → API
- Copy the URL and "anon" key

### Step 4: Run Database Migrations

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy and paste each migration file in order:
   - `migrations/001_init.sql`
   - `migrations/002_phase3_registrations.sql`
   - `migrations/003_fix_rls_issues.sql`
   - `migrations/004_phase4_admin_dashboard.sql`
   - `migrations/005_add_is_admin_column.sql`
4. Run each migration

### Step 5: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "Create New Bucket"
3. Name: `event-images`
4. Uncheck "Private bucket" to allow public read
5. Click Create

### Step 6: Setup Storage RLS Policies

Go to Storage → event-images → Policies and create these policies:

**Allow authenticated upload:**
```sql
CREATE POLICY "Allow authenticated upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');
```

**Allow public read:**
```sql
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-images');
```

**Allow authenticated delete:**
```sql
CREATE POLICY "Allow authenticated delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-images');
```

### Step 7: Seed Sample Data (Optional)

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Paste contents of `seeds/seed_sample_data.sql`
4. Run the migration

### Step 8: Run Development Server

```bash
npm run dev
```

Visit http://localhost:5173 in your browser.

### Step 9: Create Admin User (Optional)

1. Sign up at http://localhost:5173/auth/signup
2. Go to Supabase Dashboard → Auth → Users
3. Click on your user
4. Edit the `raw_user_meta_data` or `role` field
5. Set `"role": "admin"` in the is_admin column in the profiles table

Or run this in SQL Editor:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## 📚 Database Migrations

The project uses PostgreSQL with Supabase. All migrations are in the `migrations/` folder.

### Schema Overview

**profiles** table
- `id` (UUID, Primary Key)
- `email` (Text, Unique)
- `full_name` (Text)
- `role` (Text: 'user', 'organizer', 'admin')
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**events** table
- `id` (UUID, Primary Key)
- `title` (Text)
- `description` (Text)
- `location` (Text)
- `start_time` (Timestamp)
- `end_time` (Timestamp)
- `capacity` (Integer)
- `image_path` (Text, nullable)
- `organizer_id` (UUID, Foreign Key → profiles)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**registrations** table
- `id` (UUID, Primary Key)
- `event_id` (UUID, Foreign Key → events)
- `user_id` (UUID, Foreign Key → profiles)
- `status` (Text: 'registered', 'attended', 'cancelled')
- `notes` (Text, nullable - for admin use)
- `registered_at` (Timestamp)
- `updated_at` (Timestamp)

## 🌍 Deployment

### Deploying to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy ready"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the project

3. **Set Environment Variables**
   - Go to Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL` = your Supabase URL
     - `VITE_SUPABASE_ANON_KEY` = your anon key
     - `VITE_API_URL` = https://your-vercel-url.vercel.app

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy
   - Visit your live URL in ~1-2 minutes

**Vercel Deployment with Git Integration:**
- Every push to main automatically deploys
- Preview deployments for pull requests
- Easy rollback to previous versions

### Deploying to Hostinger (Static Build)

#### Prerequisites
- Hostinger hosting account with SSH access
- SSH key setup (or using File Manager)
- Domain pointed to Hostinger

#### Step 1: Build Static Files

```bash
# Build the project
npm run build

# This creates a 'dist' folder with static files
```

#### Step 2: Upload to Hostinger

**Option A: Using SSH**
```bash
# Connect to Hostinger
ssh username@your-domain.com

# Upload dist folder
scp -r dist/* username@your-domain.com:~/public_html/

# Or using rsync (faster for larger deployments)
rsync -avz dist/* username@your-domain.com:~/public_html/
```

**Option B: Using File Manager**
1. Login to Hostinger cPanel
2. Go to File Manager
3. Navigate to `public_html`
4. Upload all files from the `dist` folder

#### Step 3: Configure Apache for SPA Routing

Create/update `.htaccess` in `public_html`:

```apache
<IfModule mod_rewrite.c>
    # Enable rewrite engine
    RewriteEngine On
    
    # Set base path
    RewriteBase /
    
    # Don't rewrite if accessing actual files or directories
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]
    
    # Rewrite all other requests to index.html
    RewriteRule ^ index.html [QSA,L]
    
    # OPTIONAL: Redirect HTTP to HTTPS
    # RewriteCond %{HTTPS} !=on
    # RewriteRule ^/?(.*) https://%{SERVER_NAME}/$1 [R=-1,L]
</IfModule>

# Enable gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType text/javascript "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType application/woff "access plus 1 year"
    ExpiresByType application/woff2 "access plus 1 year"
</IfModule>
```

#### Step 4: Set Environment at Build Time

For Hostinger, you need to set environment variables at build time:

```bash
# Build with environment variables
export VITE_SUPABASE_URL=https://xxxxx.supabase.co
export VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
export VITE_API_URL=https://your-domain.com

npm run build
```

Or create `.env.production`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
VITE_API_URL=https://your-domain.com
```

#### Step 5: Verify Deployment

1. Visit https://your-domain.com
2. Test routing: Navigate to different pages
3. Test API calls: Try creating/registering for events
4. Check browser console for errors

#### Troubleshooting Hostinger Deployment

**Issue: 404 on page refresh**
- Ensure `.htaccess` is in `public_html`
- Check mod_rewrite is enabled: Contact Hostinger support if needed
- Verify Apache configuration with `.htaccess` syntax

**Issue: API calls fail**
- Verify CORS is enabled (Supabase handles this automatically)
- Check environment variables are set correctly
- Review browser console for actual error messages

**Issue: Images not loading**
- Ensure `event-images` bucket has public read policy
- Check image paths are correct in database

### Docker Deployment (Optional)

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=0 /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build and run:
```bash
docker build -t college-events-portal .
docker run -p 3000:3000 college-events-portal
```

## 🔒 Security & RLS

### Row Level Security (RLS)

RLS policies are configured in the Supabase dashboard. Key policies:

**Events Table:**
- Users can read all events
- Only organizers/admins can create events
- Only event organizer or admin can update/delete

**Registrations Table:**
- Users can read their own registrations
- Admins can read all registrations
- Users can create registration for themselves

**Profiles Table:**
- Users can read their own profile
- Users can update their own profile
- Admins can read all profiles

### Best Practices

1. **Keep RLS enabled** in production
2. **Use JWT tokens** - Supabase Auth automatically handles this
3. **Validate on both client and server**
4. **Never expose admin functions** to non-admin users
5. **Rotate secrets** regularly
6. **Use HTTPS** - Required for Supabase Auth
7. **Validate file uploads** - Check MIME types and sizes
8. **Rate limit** registration endpoints (implement at API level)

### To Enable RLS in Supabase

1. Go to Supabase Dashboard → Auth → Policies
2. Click "Enable RLS" for each table:
   - profiles
   - events
   - registrations
3. Create appropriate policies (see migrations for details)

## 📖 API Documentation

### Authentication Endpoints

All requests require the Supabase anon key in headers:
```
Authorization: Bearer VITE_SUPABASE_ANON_KEY
Content-Type: application/json
```

### Event Endpoints

**Get all events:**
```
GET /rest/v1/events
```

**Get single event:**
```
GET /rest/v1/events?id=eq.{eventId}
```

**Create event (admin/organizer):**
```
POST /rest/v1/events
{
  "title": "string",
  "description": "string",
  "location": "string",
  "start_time": "timestamp",
  "end_time": "timestamp",
  "capacity": "integer",
  "organizer_id": "uuid"
}
```

**Update event:**
```
PATCH /rest/v1/events?id=eq.{eventId}
```

**Delete event:**
```
DELETE /rest/v1/events?id=eq.{eventId}
```

### Registration Endpoints

**Get user registrations:**
```
GET /rest/v1/registrations?user_id=eq.{userId}
```

**Register for event:**
```
POST /rest/v1/registrations
{
  "event_id": "uuid",
  "user_id": "uuid",
  "status": "registered"
}
```

**Update registration:**
```
PATCH /rest/v1/registrations?id=eq.{registrationId}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm test -- --watch

# UI mode (visual test runner)
npm test:ui

# Coverage report
npm test -- --coverage
```

### Test Files

- **Home.test.tsx** - Homepage rendering and UI tests
- **Events.test.tsx** - Events page and listing tests
- **AdminDashboard.test.tsx** - Admin panel tests

### Writing Tests

Example test structure:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Component Name', () => {
    it('should render without crashing', () => {
        render(<Component />)
        expect(screen.getByText(/expected text/i)).toBeInTheDocument()
    })
})
```

### Test Coverage Goals

- Components: 80%+ coverage
- Pages: 70%+ coverage
- Utils: 90%+ coverage
- Integration: Smoke tests for main flows

## 📝 Development Guidelines

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Keep components focused and reusable
- Write meaningful commit messages

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: description of changes"

# Push and create pull request
git push origin feature/your-feature
```

### Code Quality

```bash
# Run linter
npm run lint

# Format code
npm run format

# Type check
npm run build
```

## 🔄 CI/CD

The project uses GitHub Actions for automated testing and deployment (if configured).

## 📱 Responsive Design

The app uses Tailwind CSS's responsive breakpoints:
- `sm` - 640px (mobile landscape)
- `md` - 768px (tablet)
- `lg` - 1024px (desktop)
- `xl` - 1280px (large desktop)

## 🎨 Design System

**Color Palette:**
- Primary: Blue (#0ea5e9 - sky-500)
- Secondary: Purple (#8b5cf6 - violet-500)
- Success: Green (#10b981)
- Error: Red (#ef4444)
- Warning: Yellow (#f59e0b)

**Typography:**
- Headings: Inter, Segoe UI, sans-serif
- Body: System font stack

**Spacing:**
- 8px unit system (4, 8, 12, 16, 20, 24, 32...)
- Consistent padding/margins across components

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Reporting Bugs

Please include:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support & Troubleshooting

### Common Issues

**Issue: "Cannot read property 'from' of undefined"**
- Solution: Check Supabase credentials in `.env.local`

**Issue: "RLS policy violation"**
- Solution: Ensure RLS is disabled during development or policies are correctly configured

**Issue: Images not uploading**
- Solution: Check `event-images` bucket exists and policies are set

**Issue: Authentication failing**
- Solution: Verify email/password and check Supabase Auth is enabled

### Getting Help

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review [React Documentation](https://react.dev)
3. Search [GitHub Issues](https://github.com/your-repo/issues)
4. Create a new issue with details and screenshots

## 📞 Contact

For questions or support, please reach out to [your-email@example.com]

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready ✅