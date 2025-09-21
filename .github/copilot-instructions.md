# Copilot Instructions for eduscan

## Project Overview

- **Framework:** Next.js (App Router, TypeScript)
- **Purpose:** Eduscan is a modular web application for face recognition based attendance monitoring management for employee and student, featuring authentication, announcements, attendance, user management, and more.
- **Key Directories:**
  - `src/app/`: Route handlers, layouts, and pages (App Router structure)
  - `src/components/`: Reusable UI components, organized by feature
  - `src/lib/`: Business logic and service functions, grouped by domain
  - `src/models/`: TypeScript models for core entities (user, announcement, attendance, etc.)
  - `src/types/`: Shared type definitions and interfaces
  - `src/utils/`: Utility functions (date, string, style, etc.)
  - `public/models/`: ML model files for face recognition/attendance

## Developer Workflows

- **Start Dev Server:** `npm run dev` (see README)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (uses `eslint.config.mjs`)
- **Type Check:** `tsc --noEmit`
- **No explicit test suite detected** (add if needed)

## Project-Specific Patterns

- **App Router:** All routing and layouts use the `/app` directory (not `/pages`).
- **API Routes:** Serverless API endpoints in `src/app/api/` (e.g., `auth`, `user-trend`).
- **Protected Routes:** Features for authenticated users are under `src/app/(protected)/`.
- **Component Organization:**
  - Feature-specific components in subfolders (e.g., `components/announcement/`)
  - Shared UI primitives in `components/ui/`
- **Business Logic:**
  - Domain logic in `src/lib/{feature}/` (e.g., `lib/announcement/`)
  - Database access patterns are abstracted in `src/lib/` and `src/database/`
- **Models & Types:**
  - Centralized models in `src/models/` and types in `src/types/`
  - Use these for all data validation and API contracts
- **Assets:**
  - Images and ML models in `public/` and `public/models/`

## Integration & Dependencies

- **ML Integration:** Face recognition/attendance uses models in `public/models/`
- **External Services:**
  - Supabase integration in `src/utils/supabase/`
- **Styling:**
  - Global styles in `src/app/globals.css`
  - PostCSS config in `postcss.config.mjs`

## Conventions & Tips

- **TypeScript-first:** All code should be strongly typed; prefer interfaces from `src/types/`
- **File Naming:** Use PascalCase for components, camelCase for hooks and utilities
- **Imports:** Prefer absolute imports from `src/` root
- **Sensitive Logic:** Place authentication and session logic in `src/lib/auth/` and `src/database/`
- **When in doubt:** Reference similar patterns in existing feature folders

## Examples

- **Add a new feature:**

  1. Create a folder in `src/lib/{feature}/` for logic
  2. Add models/types in `src/models/` and `src/types/`
  3. Add UI in `src/components/{feature}/`
  4. Register routes in `src/app/(protected)/{feature}/`

- **API endpoint:** See `src/app/api/auth/` for structure

---

For questions, check the README or existing feature folders for reference patterns.
