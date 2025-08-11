# Neo-Lease Supabase Setup Guide

This guide will help you set up the complete Supabase backend for the Neo-Lease rental and booking platform.

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is sufficient for development)
- A Razorpay account for payment processing
- Basic knowledge of SQL and API development

## 🚀 Quick Setup

### 1. Automated Setup (Recommended)

Run the setup script from the project root directory:

```powershell
# Windows PowerShell
.\setup-supabase.ps1
```

This script will:
- Install Supabase CLI if needed
- Link to your Supabase project
- Apply the database schema
- Set up environment variables
- Install dependencies

### 2. Manual Setup

If you prefer to set up manually or the script doesn't work:

#### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Sign in and create a new project
3. Choose a database password and region
4. Wait for the project to be created

## 2. Get Your Credentials

After your project is created, go to Settings > API:

- **Project URL**: Found in "Project URL" section
- **Anon Key**: Found in "Project API keys" section (public anon key)
- **Service Role Key**: Found in "Project API keys" section (secret service role key)

## 3. Configure Backend Environment

1. Copy `.env.example` to `.env`
2. Update the following variables:

```bash
# Replace with your Supabase database URL (found in Settings > Database)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Replace with your Supabase project credentials
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

## 4. Configure Frontend Environment

1. Copy `.env.example` to `.env` in Frontend folder
2. Update the following variables:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 5. Set Up Database Schema

Run the following commands in the Backend directory:

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed the database
npm run prisma:seed
```

## 6. Enable Row Level Security (RLS)

In your Supabase dashboard, go to Authentication > Settings and enable Row Level Security for better security.

## 7. Authentication Methods

The application supports:
- Email/Password authentication through your custom backend
- Direct Supabase Auth integration (if needed)

## 8. Start Development Servers

Backend:
```bash
cd Backend
npm run dev
```

Frontend:
```bash
cd Frontend
npm run dev
```

## Notes

- Your database URL contains your database password
- Keep your service role key secret - never expose it in frontend code
- The anon key is safe to use in frontend applications
- Make sure to add `.env` to your `.gitignore` file
