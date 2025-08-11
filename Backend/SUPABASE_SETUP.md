# Supabase Database Setup Guide

This guide explains how to set up Supabase as your PostgreSQL database for the LeaseLink application.

## 1. Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project

## 2. Get Your Database Credentials

In your Supabase dashboard:

1. Go to **Settings** → **Database**
2. Scroll down to **Connection parameters**
3. Note down:
   - Host
   - Database name
   - Port
   - User
   - Password (you set this during project creation)

## 3. Get Connection URLs

In your Supabase dashboard:

1. Go to **Settings** → **Database**
2. Find the **Connection string** section
3. Copy both:
   - **Connection pooling** URL (for DATABASE_URL)
   - **Direct connection** URL (for DIRECT_DATABASE_URL)

Example format:
```
# Pooling URL (for high traffic)
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct URL (for migrations and admin operations)
DIRECT_DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-region.compute.amazonaws.com:5432/postgres"
```

## 4. Update Your Environment

1. Open `Backend/.env`
2. Replace the DATABASE_URL lines:

```env
# Replace these lines:
DATABASE_URL="file:./dev.db"

# With your Supabase URLs:
DATABASE_URL="your_pooling_url_here"
DIRECT_DATABASE_URL="your_direct_url_here"
```

## 5. Update Database Provider

1. Open `Backend/prisma/schema.prisma`
2. Change the provider:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL") // Uncomment this line
}
```

## 6. Run Migrations

After updating your .env and schema.prisma:

```bash
cd Backend
npx prisma generate
npx prisma db push
```

This will create all your tables in Supabase.

## 7. Optional: Enable Row Level Security

In your Supabase dashboard:
1. Go to **Authentication** → **Policies**
2. Enable RLS for tables that need user-specific access
3. Create policies as needed

## 8. Test Your Connection

Start your backend server:

```bash
cd Backend
npm run dev
```

If you see no database errors, you're connected to Supabase!

## Switching Between SQLite and Supabase

For development, you might want to use SQLite locally and Supabase in production:

### Local Development (SQLite)
```env
DATABASE_URL="file:./dev.db"
```

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### Production (Supabase)
```env
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-region.compute.amazonaws.com:5432/postgres"
```

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

## Benefits of Supabase

1. **Managed PostgreSQL**: No server maintenance
2. **Built-in Authentication**: Can replace your JWT auth
3. **Real-time subscriptions**: For live updates
4. **Auto-generated APIs**: REST and GraphQL
5. **Dashboard**: Easy database management
6. **File storage**: Alternative to AWS S3
7. **Edge functions**: Serverless functions

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma with Supabase](https://supabase.com/docs/guides/database/prisma)
