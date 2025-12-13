# Eduscan

Eduscan is a comprehensive thesis project that automates attendance tracking for students and employees using facial recognition technology. The system consists of multiple integrated components working together to provide real-time attendance logging, performance analytics.

## 🏗️ Project Architecture

This repository contains a monorepo with the following components:

### 📁 Project Structure

```
eduscan/
├── admin/           # Next.js web application for administrators
├── kiosk/           # Tauri desktop application for kiosk devices
├── ml_service/      # FastAPI backend service for facial recognition
├── supabase/        # Shared Supabase infrastructure (database, edge functions)
└── README.md        # This file
```

## 🎯 System Components

### 1. **Admin Web Application** (`/admin`)

- **Tech Stack:** Next.js 15, React 19, TypeScript, Supabase, TailwindCSS
- **Purpose:** Comprehensive admin dashboard for managing users, schedules, attendance logs, and analytics
- **Features:**
  - User management (students and employees)
  - Schedule configuration and management
  - Real-time attendance monitoring
  - Performance analytics dashboards
  - Dropout-risk predictions
  - System logs and announcements

### 2. **Kiosk Application** (`/kiosk`)

- **Tech Stack:** Tauri 2, React 19, TypeScript, Vite
- **Purpose:** Desktop kiosk application deployed on face recognition terminals
- **Features:**
  - Real-time facial recognition using face-api.js
  - Attendance logging via camera capture
  - Receipt printing for attendance confirmation
  - Kiosk authentication and session management

### 3. **ML Service** (`/ml_service`)

- **Tech Stack:** FastAPI, Python, Supabase
- **Purpose:** Backend service for facial recognition engine
- **Features:**
  - Facial Encoding
  - User Face Identification
  - User Cache Management

### 4. **Supabase Infrastructure** (`/supabase`)

- **Tech Stack:** Supabase CLI, PostgreSQL, Deno (Edge Functions)
- **Purpose:** Shared database and serverless functions infrastructure
- **Features:**
  - Database schema and migrations
  - Edge Functions (face encoding, matching, attendance logging, analytics)
  - RPC functions for complex queries
  - Background jobs and scheduled tasks
- **Used by:** Admin web app, Kiosk app, and ML service

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+ and pip
- **Supabase** account and project
- **Docker** (optional, for ML service containerization)

### Getting Started

Each component has its own setup instructions. Navigate to the respective directory:

- **[Admin Setup](./admin/README.md)** - Web application setup
- **[Kiosk Setup](./kiosk/README.md)** - Desktop application setup
- **[ML Service Setup](./ml_service/README.md)** - Backend service setup
- **[Supabase Setup](./supabase/README.md)** - Database and edge functions setup

## 🔑 Key Features

- **Real-time Attendance Logging** via Eduscan FaceID kiosks

## 📊 Data Flow

1. **Kiosk** captures facial images and sends them to **Supabase Edge Functions**
2. **Edge Functions** proxy requests to the **ML Service** for face matching
3. **ML Service** performs face matching and logs attendance to Supabase
4. **Admin Web App** displays real-time attendance, and manages system configuration

## 🔒 Security

- All API endpoints require authentication via service passwords
- Supabase handles user authentication and authorization
- Face recognition data is processed securely and not stored as images

## 📝 Environment Variables

Each component requires its own environment configuration:

- `admin/.env.local` - Next.js environment variables (Supabase keys, etc.)
- `kiosk/.env` - Kiosk configuration (API endpoints, etc.)
- `ml_service/.env` - FastAPI service configuration (Supabase keys, service passwords)

See individual component READMEs for detailed environment setup.

## 🧪 Development

Each component can be developed independently:

```bash
# Start Supabase (database, edge functions)
npx supabase start

# Admin web app
cd admin && npm run dev

# Kiosk app (web preview)
cd kiosk && npm run dev

# ML Service
cd ml_service && uvicorn main:app --reload
```

## 📦 Deployment

- **Admin Web App:** Deploy to Vercel or any Next.js-compatible platform
- **Kiosk App:** Build desktop executables using Tauri CLI (`npm run tauri build`)
- **ML Service:** Deploy as Docker container or standalone FastAPI service

## 📚 Documentation

- [Admin Web Application Documentation](./admin/README.md)
- [Kiosk Application Documentation](./kiosk/README.md)
- [ML Service Documentation](./ml_service/README.md)
- [Supabase Infrastructure Documentation](./supabase/README.md)

## 🎓 Credits

Developed as part of **Eduscan** - smart facial recognition system for tracking students and employees at PRMSU Castillejos Campus.

## 📄 License

[Add your license information here]
