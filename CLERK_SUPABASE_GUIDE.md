# Clerk + Supabase Integration Guide

This guide walks you through setting up Clerk authentication with Supabase data synchronization for the NeoLease application.

## 🚀 Quick Start

### 1. Set up Clerk

1. **Create a Clerk Account**
   - Go to [clerk.com](https://clerk.com) and sign up
   - Create a new application
   - Choose your authentication methods (email, phone, social logins)

2. **Get Your Clerk Keys**
   - From your Clerk dashboard, go to "API Keys"
   - Copy the "Publishable Key"

3. **Configure Environment Variables**
   ```bash
   # Frontend/.env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

### 2. Set up Supabase

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Get your project URL and anon key

2. **Run the Database Schema**
   ```sql
   -- Execute the SQL in Backend/database/users-schema.sql
   -- This creates the users table and related schemas
   ```

3. **Configure Environment Variables**
   ```bash
   # Frontend/.env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### 3. Configure Clerk Webhooks (Optional but Recommended)

1. **Create Webhook Endpoint**
   - In Clerk dashboard, go to "Webhooks"
   - Add endpoint: `https://your-api.com/api/clerk-webhook`
   - Select events: `user.created`, `user.updated`, `user.deleted`

2. **Webhook Handler** (you can implement this later)
   ```typescript
   // This would handle real-time sync from Clerk to Supabase
   // More reliable than client-side sync
   ```

## 🔄 How It Works

### Authentication Flow

1. **User Signs Up/In**
   ```
   User → Clerk (handles auth) → ClerkAuthContext → Supabase Sync
   ```

2. **Data Synchronization**
   - User authenticates with Clerk
   - `ClerkAuthContext` detects sign-in
   - Calls `syncUserToSupabase()` function
   - User data is inserted/updated in Supabase
   - Your app queries Supabase for user data

### User Data Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Clerk    │────│ Your App    │────│  Supabase   │
│ (Auth Only) │    │ (Frontend)  │    │ (Data Only) │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ 1. Authenticate   │                   │
       │◄──────────────────│                   │
       │                   │                   │
       │ 2. User Data      │                   │
       │──────────────────►│                   │
       │                   │                   │
       │                   │ 3. Sync User      │
       │                   │──────────────────►│
       │                   │                   │
       │                   │ 4. Query Data     │
       │                   │◄──────────────────│
```

## 🛠️ Customization

### Adding More User Fields

1. **Update Supabase Schema**
   ```sql
   ALTER TABLE users ADD COLUMN new_field VARCHAR(255);
   ```

2. **Update ClerkAuthContext**
   ```typescript
   const userPayload = {
     // ... existing fields
     new_field: userData.publicMetadata?.newField,
   };
   ```

### Custom Authentication Pages

The app includes custom styled Clerk components:
- `ClerkLogin.tsx` - Custom login page
- `ClerkSignUp.tsx` - Custom signup page

You can customize the appearance by modifying the `appearance` prop.

### Role-Based Access Control

The system supports roles through Supabase:
```sql
-- Default role is 'user'
-- You can add 'admin', 'moderator', etc.
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## 🔧 Troubleshooting

### Common Issues

1. **Clerk Key Not Found**
   - Ensure `VITE_CLERK_PUBLISHABLE_KEY` is set in `.env`
   - Restart your dev server after adding env vars

2. **Supabase Sync Fails**
   - Check network tab for API call errors
   - Verify Supabase URL and keys
   - Check console for detailed error messages

3. **User Not Syncing**
   - Check if the API endpoint `/api/sync-user-to-supabase` is working
   - Verify Supabase RLS policies allow inserts
   - Check user data structure matches your schema

### Debug Tips

1. **Enable Console Logging**
   ```typescript
   // ClerkAuthContext.tsx has detailed console.logs
   // Check browser console for sync status
   ```

2. **Check Supabase Logs**
   ```sql
   -- Check recent user insertions
   SELECT * FROM users ORDER BY created_at DESC LIMIT 10;
   ```

3. **Test API Endpoint**
   ```bash
   curl -X POST http://localhost:3000/api/sync-user-to-supabase \
     -H "Content-Type: application/json" \
     -d '{"id":"test","email":"test@example.com"}'
   ```

## 📝 Next Steps

1. **Set up Webhooks** - For real-time sync (optional)
2. **Add User Profiles** - Extended user information
3. **Implement RBAC** - Role-based permissions
4. **Add Social Logins** - Google, GitHub, etc.
5. **Email Templates** - Custom Clerk email styling

## 🎯 Benefits of This Setup

- ✅ **Secure Authentication** - Clerk handles all security
- ✅ **Email Verification** - Built-in email OTP
- ✅ **Phone Verification** - SMS OTP support
- ✅ **Social Logins** - Easy to add Google, GitHub, etc.
- ✅ **Data Ownership** - Your user data stays in your Supabase
- ✅ **Scalable** - Both Clerk and Supabase scale automatically
- ✅ **Developer Experience** - Simple integration, great docs

This setup gives you the best of both worlds: enterprise-grade authentication with full control over your user data! 🚀
