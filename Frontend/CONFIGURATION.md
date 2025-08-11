# Neo-Lease Frontend Configuration

This document explains the environment configuration for the Neo-Lease frontend application.

## Environment Configuration

The application uses a single `.env` file located in the Frontend directory for all configuration.

### Configuration File: `.env`

The `.env` file contains organized sections for different aspects of the application:

```env
# ==================================
# NEO-LEASE FRONTEND CONFIGURATION  
# ==================================

# Application Info
VITE_APP_NAME=Neo-Lease
VITE_APP_VERSION=1.0.0

# Supabase Configuration
VITE_SUPABASE_URL=https://zmewaelauqusvzxtocba.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API Configuration
VITE_BACKEND_URL=http://localhost:3001

# Payment Gateway Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_VHxUQFUXIsknEc

# Development & Debugging
VITE_DEBUG_MODE=true
VITE_DEBUG_AUTH=true
VITE_DEBUG_SUPABASE=true
VITE_DEBUG_PAYMENTS=true

# Feature Flags
VITE_FEATURE_CHECKOUT=true
VITE_FEATURE_NOTIFICATIONS=true
VITE_FEATURE_ANALYTICS=false

# UI/UX Configuration
VITE_DEFAULT_THEME=system
VITE_ENABLE_ANIMATIONS=true
VITE_MOBILE_FIRST=true
```

### Configuration Access

The application uses a centralized configuration system via `src/lib/config.ts`:

```typescript
import { config } from '@/lib/config';

// Access configuration values
console.log(config.app.name);           // "Neo-Lease"
console.log(config.api.backend);        // "http://localhost:3001"
console.log(config.debug.payments);     // true/false
console.log(config.features.checkout);  // true/false
```

### Debug Features

When debug flags are enabled, the application provides detailed logging:

- `VITE_DEBUG_MODE`: General debug information
- `VITE_DEBUG_AUTH`: Authentication flow logging  
- `VITE_DEBUG_SUPABASE`: Supabase operations logging
- `VITE_DEBUG_PAYMENTS`: Payment processing logging

### Feature Flags

Control which features are enabled:

- `VITE_FEATURE_CHECKOUT`: Enable/disable checkout functionality
- `VITE_FEATURE_NOTIFICATIONS`: Enable/disable notifications
- `VITE_FEATURE_ANALYTICS`: Enable/disable analytics tracking

### Development vs Production

- **Development**: Debug flags enabled, detailed logging
- **Production**: Debug flags should be disabled, minimal logging

### Required Variables

These environment variables are required for the application to function:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`  
- `VITE_RAZORPAY_KEY_ID`

The configuration system automatically validates these on startup.

### Security Notes

- Only public keys and URLs should be in the `.env` file
- Private keys and secrets should be on the backend server
- The `.env` file is included in version control with public values only

## Usage

1. Ensure the `.env` file exists in the Frontend directory
2. Update values as needed for your environment
3. Restart the development server after changes
4. Check browser console for configuration validation messages

## Troubleshooting

- **Missing environment variables**: Check console for validation errors
- **Configuration not loading**: Restart the development server
- **Debug info not showing**: Ensure debug flags are set to `true`
- **Features not working**: Check corresponding feature flags
