# Supabase Local Development Guide

This guide covers the local development setup for Supabase Edge Functions and RPC database functions in the EduScan project.

## Overview

The Supabase infrastructure is shared across all components (Admin Web App, Kiosk App, and ML Service). This directory contains:

- Database schema and migrations
- Edge Functions (serverless TypeScript functions)
- RPC functions (PostgreSQL stored procedures)
- Background jobs and scheduled tasks

The project uses Supabase CLI for local development, allowing you to:

- Develop and test RPC functions locally
- Create and test Edge Functions with multi-file support
- Version control database schema and migrations
- Deploy functions to production with confidence

## Quick Start

### 1. Start Local Supabase

```bash
# From project root - Start all Supabase services (database, API, Studio, etc.)
npx supabase start

# Check status
npx supabase status
```

### 2. Apply Database Migrations

```bash
# From project root - Apply all migrations to local database
npx supabase db push
```

### 3. Access Local Services

- **Supabase Studio**: http://localhost:54323
- **API**: http://localhost:54321
- **Database**: localhost:54322

## Project Structure

```
supabase/
├── config.toml              # Supabase configuration
├── migrations/              # Database migrations
│   ├── user/               # User-related migrations
│   ├── schedule/           # Schedule-related migrations
│   ├── dashboard/          # Dashboard RPC functions
│   └── background/         # Background jobs
├── functions/              # Edge Functions (Deno/TypeScript)
│   ├── encode_face/        # Face encoding service
│   ├── match_face/         # Face matching service
│   ├── log_attendance/     # Attendance logging service
│   ├── performance_analytics/  # ML analytics proxy
│   ├── compute_daily_snapshot/ # Daily snapshot job
│   └── update_user_cache/  # User cache updater
└── README.md               # This file
```

## RPC Functions

All RPC functions have been extracted from TypeScript comments into separate migration files:

### Available Functions

1. **get_schedule** - Retrieve schedule data with slots and users
2. **unlink_user_schedule** - Unlink users from schedules
3. **get_attendance_trend_range** - Get attendance analytics data
4. **get_user_demographics** - Get user demographic statistics
5. **get_user_status** - Get realtime user status counts

### Creating New RPC Functions

1. Create a new migration file:

```bash
npx supabase migration new add_my_rpc_function
```

2. Add your RPC function SQL to the migration file
3. Apply the migration:

```bash
npx supabase db push
```

4. Test the function in Supabase Studio or your application

## Edge Functions

Edge Functions are serverless TypeScript functions that run on Deno.

### Available Edge Functions

1. **encode_face** - Processes facial images and returns face encodings
2. **match_face** - Matches faces against the database and retrieves user sessions
3. **log_attendance** - Handles attendance logging (TIME_IN/TIME_OUT) with session management
4. **performance_analytics** - Proxies ML analytics requests to the ML service
5. **compute_daily_snapshot** - Computes daily attendance snapshots (background job)
6. **update_user_cache** - Updates user cache for face matching

### Creating a New Edge Function

```bash
# Create a new function
npx supabase functions new my-function

# Serve functions locally
npx supabase functions serve

# Deploy to production
npx supabase functions deploy
```

### Function Structure

```typescript
// supabase/functions/my-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { name } = await req.json();

  return new Response(JSON.stringify({ message: `Hello ${name}!` }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### Calling RPC Functions from Edge Functions

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? ""
);

const { data, error } = await supabase.rpc("get_schedule", {
  p_schedule_id: 1,
});
```

## Development Workflow

### Local Development

All commands should be run from the project root:

1. **Start Supabase**: `npx supabase start`
2. **Apply migrations**: `npx supabase db push`
3. **Start Admin Web App**: `cd admin && npm run dev`
4. **Develop Edge Functions**: `npx supabase functions serve`

### Testing RPC Functions

1. Open Supabase Studio at http://localhost:54323
2. Navigate to SQL Editor
3. Test your RPC functions:

```sql
SELECT * FROM get_schedule();
SELECT * FROM get_schedule(1);
```

### Testing Edge Functions

```bash
# Test face-encoding function
curl -X POST http://localhost:54321/functions/v1/encode_face \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -F "image=@/path/to/image.jpg"

# Test face-match function
curl -X POST http://localhost:54321/functions/v1/match_face \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -F "image=@/path/to/image.jpg"

# Test logging function
curl -X POST http://localhost:54321/functions/v1/log_attendance \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -F "user_id=USER123" \
  -F "action=TIME_IN"

```

## Deployment

### Database Migrations

```bash
# Deploy migrations to production
npx supabase db push --remote
```

### Edge Functions

```bash
# Deploy all functions to production
npx supabase functions deploy

# Deploy specific function
npx supabase functions deploy my-function
```

## Environment Configuration

### Local Environment

Copy `env.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
```

### Production Environment

Update your production environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

### Edge Functions Environment Variables

For Edge Functions to work properly, configure these environment variables in your Supabase project:

```env
# FaceID Service Configuration
FACEID_URL=http://your-faceid-service-url
FACEID_PASSWORD=your-faceid-password

# SMS Notifications (Optional)
SEMAPHORE_KEY=your-semaphore-api-key
ENABLE_MESSAGING=TRUE
```

**Note**: These environment variables are set in your Supabase project dashboard under Settings > Edge Functions, not in your local `.env` file.

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 54321-54327 are available
2. **Migration errors**: Check SQL syntax in migration files
3. **Function deployment fails**: Verify function syntax and dependencies

### Useful Commands

All commands should be run from the project root:

```bash
# Reset everything and start fresh
npx supabase db reset

# Check logs
npx supabase logs

# Generate types (for admin app)
npx supabase gen types typescript --local > admin/src/types/database.ts
```

## Migration from Old Workflow

The old workflow of copying SQL from comments has been replaced:

### Before

- SQL functions defined in TypeScript comments
- Manual copy-paste to Supabase dashboard
- No version control for database changes

### After

- SQL functions in version-controlled migration files
- Local development and testing
- Automated deployment process
- Multi-file Edge Functions support

## Best Practices

1. **Always test locally** before deploying
2. **Use descriptive migration names** with timestamps
3. **Keep functions focused** - one responsibility per function
4. **Document complex functions** with comments
5. **Use transactions** for multi-statement migrations
6. **Backup before major changes** to production

## Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Database Migrations](https://supabase.com/docs/guides/database/migrations)
- [Local Development](https://supabase.com/docs/guides/local-development)
