# College Events Portal - Phase 0: Project Skeleton

## Overview

This is **Phase 0** of the College Events Portal project. This phase establishes the complete project skeleton and development infrastructure for a modern React + TypeScript + Supabase web application.

**Current Status**: ✅ Project setup complete with all foundational files and configurations in place. Ready for feature development in Phase 1.

---

## Project Stack

- **Frontend Framework**: React 18.2.0 with TypeScript
- **Build Tool**: Vite 5.0.8
- **Styling**: Tailwind CSS 3.3.6 with PostCSS & Autoprefixer
- **Routing**: React Router v6.16.0
- **Database/Backend**: Supabase (client-side only, for now)
- **Code Quality**: ESLint + Prettier
- **Language**: TypeScript 5.2.2

---

## Complete File Structure

```
college-events-portal/
├── src/
│   ├── main.tsx                 # React app entry point
│   ├── App.tsx                  # Root component with routing
│   ├── index.css                # Tailwind CSS directives
│   ├── components/
│   │   ├── Header.tsx           # Navigation header component
│   │   └── Footer.tsx           # Footer component
│   ├── pages/
│   │   ├── Home.tsx             # Homepage with hero and features
│   │   └── NotFound.tsx         # 404 page
│   └── lib/
│       └── supabaseClient.ts    # Supabase client initialization
├── public/
│   └── vite.svg                 # Favicon/Logo
├── index.html                   # HTML entry point
├── package.json                 # Project dependencies & scripts
├── tsconfig.json                # TypeScript configuration
├── tsconfig.node.json           # TypeScript config for build tools
├── vite.config.ts               # Vite build configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── .eslintrc.cjs                # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── .gitignore                    # Git ignore rules
├── .env.example                 # Environment variables template
├── README-phase0.md             # This file
└── .git/                        # Git repository

```

---

## File-by-File Explanation

### Entry Point Files

#### `index.html`
- **Purpose**: HTML entry point for the Vite application
- **What it does**: 
  - Defines the `<div id="root"></div>` where React renders the app
  - Imports `src/main.tsx` as a module to bootstrap the React app
  - Sets the page title and meta tags (viewport, charset)
- **Non-dev explanation**: This is the "skeleton" of your webpage. When you visit the site, your browser loads this file first, then React uses it to inject the interactive UI.

#### `src/main.tsx`
- **Purpose**: React application bootstrap
- **What it does**:
  - Imports React and ReactDOM
  - Imports the main `App` component and global styles
  - Renders the `App` component into the `#root` DOM element
  - Uses React StrictMode for development warnings and checks
- **Non-dev explanation**: This is the JavaScript "launcher" that starts your React app inside the HTML file.

#### `src/index.css`
- **Purpose**: Global styles with Tailwind CSS setup
- **What it does**:
  - Contains Tailwind CSS directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`)
  - These directives inject Tailwind's entire CSS framework into your app
  - Any global styles should be added here
- **Non-dev explanation**: This file tells Tailwind CSS to generate all its utility classes that you'll use to style your site.

### Core Application Files

#### `src/App.tsx`
- **Purpose**: Root component and main router
- **What it does**:
  - Sets up React Router with BrowserRouter
  - Defines all application routes using `<Routes>` and `<Route>`
  - Implements a flex layout with header, main content area, and footer
  - Currently has 2 routes:
    - `/` → Home page
    - `*` → 404 NotFound page
- **Non-dev explanation**: Think of this as your app's "main blueprint." It defines how pages are organized and navigated, and wraps everything with a consistent header and footer.

### Component Files

#### `src/components/Header.tsx`
- **Purpose**: Navigation header for the entire app
- **What it does**:
  - Displays a blue navigation bar
  - Shows the site logo/branding with a link to home
  - Contains navigation links (currently just "Home")
  - Uses React Router's `Link` component for SPA-style navigation without page reloads
  - Styled with Tailwind CSS utility classes
- **Non-dev explanation**: This is the top navigation bar you see on every page. It stays the same across your entire site and helps users navigate.

#### `src/components/Footer.tsx`
- **Purpose**: Footer displayed on all pages
- **What it does**:
  - Displays copyright information
  - Shows tech stack attribution
  - Dark gray background with white text for contrast
  - Uses Tailwind CSS for styling
- **Non-dev explanation**: This is the bottom section of every page with credits and info. It appears consistently across the site.

### Page Files

#### `src/pages/Home.tsx`
- **Purpose**: Homepage of the College Events Portal
- **What it does**:
  - **Hero Section**: Large gradient banner with headline, description, and CTA button
  - **Features Section**: Three-column grid showcasing key features:
    - Easy Scheduling (calendar icon)
    - Filter & Search (target icon)
    - Save Favorites (star icon)
  - **Coming Soon Section**: Lists features planned for future phases
  - Fully styled with Tailwind CSS utility classes
  - Responsive design (mobile-first approach with Tailwind breakpoints)
- **Non-dev explanation**: This is what users see when they land on your site. It has a big welcoming banner and cards explaining what your app does. It's a showcase page that demonstrates the app's purpose.

#### `src/pages/NotFound.tsx`
- **Purpose**: 404 error page for undefined routes
- **What it does**:
  - Displays when user navigates to a URL that doesn't exist
  - Shows "404" heading and explanatory text
  - Provides a button to go back to the home page
  - Centered, friendly design using Tailwind CSS
- **Non-dev explanation**: This is a "Sorry, page not found" screen. If someone tries to visit a URL that doesn't exist, they see this page instead of a broken error.

### Backend/API Files

#### `src/lib/supabaseClient.ts`
- **Purpose**: Supabase client initialization and export
- **What it does**:
  - Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from environment variables
  - Creates a Supabase client using `@supabase/supabase-js`
  - **Does NOT** contain hardcoded keys (security best practice)
  - Throws an error if environment variables are missing
  - Exports the `supabase` client for use throughout the app
- **Non-dev explanation**: This file creates a "connection" to your Supabase database. It reads connection details from environment files (secrets) rather than storing them in code, which is secure. Other parts of your app will import this to talk to the database.

### Configuration Files

#### `package.json`
- **Purpose**: Project metadata and dependency management
- **Key sections**:
  - `scripts`: Command shortcuts for development
    - `dev`: Start Vite dev server (hot reload)
    - `build`: Build optimized production bundle
    - `preview`: Preview production build locally
    - `lint`: Check code quality with ESLint
    - `format`: Auto-format code with Prettier
    - `start`: Alias for `dev`
  - `dependencies`: Runtime libraries (React, React Router, Supabase)
  - `devDependencies`: Development-only tools (TypeScript, ESLint, Prettier, etc.)
- **Non-dev explanation**: This file is like a manifest for your project. It lists all the tools and libraries your app needs, and the commands to run the app or check for code problems.

#### `tsconfig.json`
- **Purpose**: TypeScript compiler configuration
- **Key settings**:
  - `target`: ES2020 (modern JavaScript syntax)
  - `lib`: Includes ES2020, DOM, and DOM.Iterable for browser APIs
  - `jsx`: react-jsx (modern React JSX transform)
  - `strict`: true (enforces strict type checking)
  - `noUnusedLocals` & `noUnusedParameters`: Warns about unused code
  - Ignores `node_modules` via `skipLibCheck`
- **Non-dev explanation**: This tells TypeScript (our type-checker) how strictly to check your code for errors and what JavaScript features to assume are available.

#### `tsconfig.node.json`
- **Purpose**: TypeScript config for build-time tools (Vite config file)
- **What it does**:
  - Separate config so build files can be checked independently
  - Referenced by main tsconfig.json via `"references"`
- **Non-dev explanation**: This is a specialized TypeScript config just for the build process configuration file.

#### `vite.config.ts`
- **Purpose**: Vite bundler and dev server configuration
- **Key settings**:
  - Registers React plugin for JSX support
  - Dev server port: 5173
  - Auto-opens browser when dev server starts
- **Non-dev explanation**: This file tells the build tool (Vite) how to bundle your code and run the development server.

#### `tailwind.config.ts`
- **Purpose**: Tailwind CSS configuration
- **Key settings**:
  - `content`: Tells Tailwind where your HTML/component files are so it can scan for class usage
  - `theme.extend`: Custom theme values (empty for now, can add custom colors, fonts, etc.)
  - `plugins`: Tailwind plugins (none currently)
- **Non-dev explanation**: This tells Tailwind CSS which files to scan for styling classes and lets you customize colors, fonts, and other design tokens.

#### `postcss.config.js`
- **Purpose**: PostCSS plugin configuration
- **What it does**:
  - Registers Tailwind CSS plugin to inject Tailwind classes
  - Registers Autoprefixer plugin to add vendor prefixes for older browsers (e.g., `-webkit-`, `-moz-`)
- **Non-dev explanation**: PostCSS is a tool that processes CSS. This config file tells it to apply Tailwind and add browser compatibility prefixes automatically.

#### `.eslintrc.cjs`
- **Purpose**: ESLint code quality rules
- **Key settings**:
  - Extends `eslint:recommended` (standard rules)
  - Extends `@typescript-eslint/recommended` (TypeScript-specific rules)
  - Extends `plugin:react-hooks/recommended` (React Hooks rules)
  - Extends `prettier` (disables ESLint rules that conflict with Prettier)
  - Custom rules:
    - `react-hooks/rules-of-hooks`: "error" (enforces React Hook rules)
    - `react-hooks/exhaustive-deps`: "warn" (warns about missing dependencies in useEffect)
- **Non-dev explanation**: ESLint is a code quality checker. This file defines rules that warn or error when code doesn't follow best practices.

#### `.prettierrc`
- **Purpose**: Prettier code formatter configuration
- **Settings**:
  - `semi`: true (add semicolons)
  - `singleQuote`: true (use single quotes instead of double)
  - `tabWidth`: 2 (2-space indentation)
  - `trailingComma`: "es5" (add trailing commas where valid in ES5)
  - `arrowParens`: "always" (always wrap arrow function params in parens)
- **Non-dev explanation**: Prettier automatically formats your code to be consistent. This file defines the style rules (spacing, quotes, etc.).

#### `.env.example`
- **Purpose**: Template for environment variables
- **Content**:
  ```
  VITE_SUPABASE_URL=https://your-project-ref.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-here
  ```
- **What it does**: Shows developers which environment variables they need to set up. This file is committed to git, but `.env.local` (the actual secrets) is not.
- **Non-dev explanation**: This is a template that shows which secrets/settings you need to configure. You copy this to `.env.local` and fill in your real values.

#### `.gitignore`
- **Purpose**: Tells Git which files NOT to track
- **Important entries**:
  - `node_modules/`: Huge folder of dependencies (not stored in git)
  - `dist/`: Production build output
  - `.env` & `.env.local`: Secret files with API keys (never committed)
  - `.vscode/`, `.idea/`: IDE settings
  - `*.log`, `*.swp`: Temporary files
- **Non-dev explanation**: Git is a version control system. This file tells it which files to ignore (like secrets, temporary files, etc.) so they don't get uploaded to the repository.

#### `README-phase0.md` (this file)
- **Purpose**: Documentation for Phase 0 setup
- **Explains**: File structure, purpose of each file, how to run the project, environment setup
- **Audience**: Developers and non-technical reviewers

#### `public/vite.svg`
- **Purpose**: Favicon/Logo for the browser tab
- **Format**: SVG vector graphic
- **Used in**: `index.html` link tag
- **Non-dev explanation**: This is the small icon that appears in your browser tab when you visit the site.

---

## Environment Variables (Supabase Integration)

### How Environment Variables Work

Environment variables are **secrets and configuration** that change between environments (development, staging, production) but shouldn't be hardcoded in your source code.

**Vite + React**: Environment variables prefixed with `VITE_` are bundled into your JavaScript and are safe to expose to the browser (they're meant to be public). Never put secret API keys in `VITE_` variables.

### Setting Up Supabase Env Variables

1. **Copy the template file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Create a Supabase project**:
   - Go to https://app.supabase.com
   - Create a new project (free tier available)
   - Wait for it to be provisioned

3. **Get your credentials**:
   - In your Supabase dashboard, click **Settings** → **API**
   - Find and copy:
     - **Project URL** → Set as `VITE_SUPABASE_URL`
     - **Anon Key** (labeled "anon public") → Set as `VITE_SUPABASE_ANON_KEY`

4. **Update `.env.local`**:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. **Restart the dev server**:
   ```bash
   npm run dev
   ```

### How Supabase Connection Works (Phase 0 → Phase 1)

- **Phase 0** (current): Supabase client is initialized but not used. It's loaded and ready for use.
- **Phase 1 (upcoming)**:
  - Create Supabase tables for events, users, registrations, etc.
  - Implement authentication (sign up, login, logout)
  - Fetch events from the database
  - Enable real-time features

**Usage Pattern**:
```typescript
// In any component, import the client:
import { supabase } from '@/lib/supabaseClient'

// Use it to query data:
const { data, error } = await supabase
  .from('events')
  .select('*')

// Real-time subscriptions (Phase 1):
supabase
  .channel('events')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
    console.log('Event change:', payload)
  })
  .subscribe()
```

### Security Notes

- ✅ `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are **safe to expose** (they're public API credentials)
- ✅ `.env.local` is gitignored and never committed
- ❌ Never put database passwords or secret API keys in `VITE_*` variables
- ❌ For sensitive operations, use server-side middleware or Supabase RLS (Row Level Security)

---

## How to Run Locally

### Prerequisites
- Node.js 16+ (18+ recommended)
- npm or yarn

### Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```
   This downloads all packages listed in `package.json`.

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and fill in your Supabase credentials
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   - The app opens automatically in your browser
   - Dev server runs at `http://localhost:5173`
   - Hot reload enabled: changes are reflected instantly

4. **Test the app**:
   - Navigate to `http://localhost:5173`
   - You should see the College Events Portal homepage
   - Click "Home" in the header (tests routing)
   - Try navigating to a non-existent URL to test 404 page

### Available Scripts

- **`npm run dev`** - Start Vite dev server with hot reload
- **`npm run build`** - Create optimized production build in `dist/`
- **`npm run preview`** - Preview production build locally
- **`npm start`** - Alias for `npm run dev`
- **`npm run lint`** - Check code quality with ESLint
- **`npm run format`** - Auto-format code with Prettier

---

## Code Quality

### Linting
Check for code quality issues:
```bash
npm run lint
```

Issues flagged:
- Unused variables or imports
- Type errors
- React Hooks violations
- Code style inconsistencies

### Formatting
Auto-format all code:
```bash
npm run format
```

Formats:
- Indentation (2 spaces)
- Quotes (single quotes)
- Semicolons
- Trailing commas
- Line length

**Note**: ESLint is configured to not conflict with Prettier. Use Prettier for formatting, ESLint for code quality.

---

## Production Build

To create an optimized production build:

```bash
npm run build
```

Output:
- Creates `dist/` folder with minified, optimized files
- Ready to deploy to any static hosting (Vercel, Netlify, GitHub Pages, etc.)

Preview the production build locally:
```bash
npm run preview
```

---

## Git Repository

All Phase 0 files are committed with message:
```
git commit -m "phase0: project skeleton

- Initialize Vite React + TypeScript app
- Add Tailwind CSS with PostCSS & Autoprefixer
- Configure ESLint + Prettier
- Create file structure with components and pages
- Set up Supabase client initialization
- Add environment variable template
- Create comprehensive documentation"
```

### Next Steps (Phase 1 Planning)

After Phase 0 is complete, Phase 1 will include:
- [ ] Supabase database schema design
- [ ] User authentication system
- [ ] Events list and detail pages
- [ ] Event filtering and search
- [ ] User registration for events
- [ ] Database integration tests

---

## Project Structure Philosophy

This Phase 0 setup follows best practices:

- **Separation of Concerns**: Components, pages, and libraries are organized by function
- **Type Safety**: TypeScript throughout for compile-time error catching
- **Scalability**: Structure supports adding features without major refactoring
- **Styling**: Tailwind CSS for rapid, consistent UI development
- **Code Quality**: ESLint + Prettier enforce style and catch bugs
- **Environment Management**: Secrets are environment-specific, not in code
- **Git Ready**: Comprehensive .gitignore and clear commit structure

---

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
- Run `npm install` to install dependencies

### Port 5173 already in use
- Change port in `vite.config.ts` or kill the existing process

### Tailwind CSS not loading
- Check that `src/index.css` is imported in `src/main.tsx`
- Restart dev server after changing `tailwind.config.ts`

### TypeScript errors in IDE
- Install TypeScript: `npm install typescript`
- Reload your IDE

### Environment variables not loading
- Ensure file is named `.env.local` (not `.env`)
- Prefix variables with `VITE_`
- Restart dev server after changing `.env.local`

---

## Resources

- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev
- **React Router Docs**: https://reactrouter.com
- **Tailwind CSS Docs**: https://tailwindcss.com
- **TypeScript Docs**: https://www.typescriptlang.org
- **Supabase Docs**: https://supabase.com/docs
- **ESLint Docs**: https://eslint.org
- **Prettier Docs**: https://prettier.io

---

## Summary

**Phase 0** provides a complete, production-ready project skeleton:

✅ Modern tech stack (React, Vite, TypeScript, Tailwind CSS)
✅ Code quality tools (ESLint, Prettier)
✅ Supabase client ready for integration
✅ Clean, scalable file structure
✅ Comprehensive documentation
✅ Ready for feature development in Phase 1

**To get started**: Run `npm install && npm run dev` and navigate to `http://localhost:5173`.
