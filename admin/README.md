# Eduscan Admin Web Application

The admin web application is a comprehensive Next.js dashboard for managing the Eduscan attendance tracking system. It provides administrators with tools to manage users, configure schedules, monitor attendance in real-time, and view performance analytics.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** TailwindCSS 4, Chakra UI, Radix UI
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Charts:** Recharts
- **PDF Generation:** Puppeteer (for DTR reports)
- **Face Recognition:** face-api.js (client-side encoding)

## 📁 Project Structure

```
admin/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (protected)/       # Protected routes (dashboard, users, schedules, etc.)
│   │   ├── auth/              # Authentication pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── user/              # User management components
│   │   ├── schedule/          # Schedule management components
│   │   └── ...                # Other UI components
│   ├── lib/                   # Business logic and utilities
│   ├── database/              # Supabase database utilities
│   ├── models/                # TypeScript models/interfaces
│   ├── hooks/                 # Custom React hooks
│   └── utils/                 # Helper functions
├── supabase/
│   ├── functions/             # Supabase Edge Functions
│   └── migrations/            # Database migrations
└── public/                    # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Environment variables configured

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the `admin` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_FACEID_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_FACEID_SERVICE_PASSWORD=your_service_password
```

3. Run database migrations from project root:

```bash
npx supabase db push
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 🔑 Key Features

### User Management

- Create and manage student and employee accounts
- Bulk user import
- User profile management with facial encoding
- Guardian management for students

### Schedule Configuration

- Create and manage class schedules for students
- Configure work schedules for employees
- Time slot management
- Schedule assignments to users

### Real-Time Dashboard

- Live attendance monitoring
- At-risk users table (dropout prediction)
- Attendance activity feed
- User demographics and statistics
- Performance turnover charts

### Attendance Logging

- View attendance logs with filtering
- Daily Time Record (DTR) generation and PDF export
- Attendance statistics and trends
- Punctuality analysis

### Performance Analytics

- Attendance rate calculations
- Punctuality metrics
- Time balance analysis
- Dropout-risk predictions (via ML service integration)
- User performance visualization

### System Configuration

- Announcement management
- Kiosk authentication and control
- Admin account management
- System settings

## 📡 API Integration

### Supabase Edge Functions

The admin app integrates with Supabase Edge Functions located in the root `supabase/` directory:

- `log_attendance` - Log attendance events
- `encode_face` - Encode facial features for recognition
- `match_face` - Match faces for attendance
- `performance_analytics` - Fetch ML-powered performance analytics
- `compute_daily_snapshot` - Generate daily attendance summaries
- `update_user_cache` - Update cached user data

### ML Service Integration

The app communicates with the ML service (`ml_service`) for:

- Face encoding and matching
- Performance analytics computation
- Dropout-risk predictions

## 🗄️ Database Schema

Key tables:

- `users` - User accounts (students and employees)
- `students` - Student-specific data
- `employees` - Employee-specific data
- `schedules` - Schedule definitions
- `attendance_logs` - Attendance records
- `active_sessions` - Current active sessions
- `announcements` - System announcements
- `config` - System configuration

See `supabase/migrations/` for complete schema definitions.

## 🧪 Available Scripts

```bash
npm run dev              # Start development server with Turbopack
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Note: Supabase commands use npx from project root
# Example: npx supabase start, npx supabase db push, etc.
```

## 🔒 Authentication & Authorization

- Uses Supabase Auth for authentication
- Role-based access control (RBAC)
- Protected routes via middleware
- Session management

## 📊 Performance Analytics

The admin app displays ML-powered analytics:

1. **Attendance Rate** - Percentage of sessions attended
2. **Punctuality** - On-time arrival metrics
3. **Time Balance** - Time-in vs time-out balance
4. **Dropout Risk** - Binary classification (AT_RISK / NOT_AT_RISK)

These metrics are computed by the ML service and fetched via the `performance_analytics` edge function.

## 🎨 UI Components

Built with modern UI libraries:

- **Chakra UI** - Base component library
- **Radix UI** - Accessible primitives
- **Headless UI** - Unstyled components
- **TailwindCSS** - Utility-first styling
- **Recharts** - Data visualization

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Other Platforms

The app can be deployed to any platform supporting Next.js 15:

- Netlify
- AWS Amplify
- Railway
- Self-hosted with Node.js

## 🔧 Configuration

### Environment Variables

| Variable                              | Description            | Required |
| ------------------------------------- | ---------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`            | Supabase project URL   | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | Supabase anonymous key | Yes      |
| `NEXT_PUBLIC_FACEID_SERVICE_URL`      | ML service URL         | Yes      |
| `NEXT_PUBLIC_FACEID_SERVICE_PASSWORD` | ML service password    | Yes      |

### Database Setup

1. Run migrations from project root: `npx supabase db push`
2. Seed initial data (if applicable)
3. Configure Row Level Security (RLS) policies

See the [Supabase README](../supabase/README.md) for detailed database setup instructions.

## 📝 Development Notes

- Uses Next.js App Router (not Pages Router)
- Server and Client Components pattern
- TypeScript strict mode enabled
- ESLint configured with Next.js rules

## 🔗 Related Documentation

- [Root README](../README.md) - General project overview
- [ML Service README](../ml_service/README.md) - Backend service details
- [Kiosk README](../kiosk/README.md) - Kiosk application details
- [Supabase README](../supabase/README.md) - Database and edge functions setup

## 🐛 Troubleshooting

### Common Issues

1. **Supabase connection errors**: Verify environment variables and network connectivity
2. **Face encoding failures**: Ensure face-api.js models are loaded correctly
3. **PDF generation errors**: Check Puppeteer/Chromium installation

## 📄 License

[Add your license information here]
