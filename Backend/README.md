# Neo-Lease Backend

Production-ready backend for a rental and booking platform built with Next.js, Supabase, and Razorpay.

## 🏗️ Architecture

- **Framework**: Next.js 14 with API routes
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with JWT tokens
- **Storage**: Supabase Storage for images and documents
- **Payments**: Razorpay for payment processing
- **TypeScript**: Full type safety throughout

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication via Supabase Auth
- Role-based access control (user, owner, admin)
- Row Level Security policies
- Secure session management

### Core Functionality
- **Facilities Management**: Create, update, and manage sports facilities
- **Court Booking**: Real-time availability and conflict prevention
- **Equipment Rental**: Product management with quantity tracking
- **Payment Processing**: Secure payments via Razorpay
- **File Upload**: Image and document storage via Supabase Storage
- **Notifications**: Real-time notifications system

### API Features
- RESTful API design
- Request validation with Zod
- Rate limiting and security headers
- Comprehensive error handling
- Pagination support
- CORS configuration

## 📁 Project Structure

```
Backend/
├── database/
│   └── schema.sql          # Complete database schema
├── lib/
│   ├── supabase.ts         # Supabase client configuration
│   └── razorpay.ts         # Razorpay integration
├── middleware/
│   └── auth.ts             # Authentication middleware
├── pages/api/
│   ├── auth/
│   │   └── me.ts           # User profile endpoint
│   ├── facilities/
│   │   └── index.ts        # Facilities CRUD
│   ├── bookings/
│   │   └── index.ts        # Booking management
│   ├── payments/
│   │   ├── create-order.ts # Payment order creation
│   │   └── verify.ts       # Payment verification
│   └── uploads/            # File upload endpoints
├── types/
│   └── supabase.ts         # Database types
└── utils/
    ├── api-helpers.ts      # API utilities
    └── validation.ts       # Zod validation schemas
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase project
- Razorpay account

### Environment Variables

Create `.env.local` in the Backend directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# App Configuration
NODE_ENV=development
```

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase database**:
   ```bash
   # From the project root
   ./setup-supabase.ps1
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:3001`

## 🗄️ Database Schema

### Core Tables

- **users**: User profiles extending Supabase auth.users
- **facilities**: Sports facilities owned by users
- **courts**: Bookable courts within facilities
- **products**: Rentable equipment/products
- **bookings**: Court reservations
- **rental_orders**: Equipment rental orders
- **rental_items**: Items within rental orders
- **payments**: Payment transaction records
- **notifications**: User notifications

### Security Features

- Row Level Security (RLS) enabled on all tables
- User-specific data access policies
- Role-based permission system
- Secure file upload policies

## 🔐 Authentication

The API uses Supabase JWT tokens for authentication. Include the token in requests:

```javascript
// Via Authorization header
headers: {
  'Authorization': 'Bearer <supabase-jwt-token>'
}

// Via cookie (for browser requests)
cookies: {
  'access_token': '<supabase-jwt-token>'
}
```

### Roles

- **user**: Can create bookings and rentals
- **owner**: Can manage facilities, courts, and products
- **admin**: Full system access

## 📡 API Endpoints

### Authentication
- `GET /api/auth/me` - Get current user profile

### Facilities
- `GET /api/facilities` - List facilities (with filters)
- `POST /api/facilities` - Create facility (owner+)
- `GET /api/facilities/[id]` - Get facility details
- `PATCH /api/facilities/[id]` - Update facility
- `DELETE /api/facilities/[id]` - Delete facility

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/[id]` - Get booking details
- `PATCH /api/bookings/[id]` - Update booking
- `DELETE /api/bookings/[id]` - Cancel booking

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `POST /api/webhooks/razorpay` - Razorpay webhook

### File Uploads
- `POST /api/uploads` - Generate signed upload URLs
- `DELETE /api/uploads` - Delete uploaded files

## 💳 Payment Flow

1. **Create Order**: Client calls `/api/payments/create-order`
2. **Razorpay Checkout**: Frontend uses returned order details
3. **Payment Verification**: Client calls `/api/payments/verify`
4. **Status Update**: Booking/rental status updated to 'confirmed'

## 🔒 Security Features

- **JWT Validation**: All protected routes validate Supabase JWT
- **RLS Policies**: Database-level access control
- **Input Validation**: Zod schema validation
- **Rate Limiting**: Prevents abuse
- **CORS Configuration**: Secure cross-origin requests
- **Secure Headers**: Security-focused HTTP headers

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Other Platforms

The app can deploy to any Node.js hosting platform:
- Netlify
- Railway
- Heroku
- Digital Ocean App Platform

## 🧪 Testing

### Manual Testing

Use the provided Postman collection or test endpoints manually:

```bash
# Get user profile (requires auth token)
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/auth/me

# List facilities
curl http://localhost:3001/api/facilities

# Create booking (requires auth token)
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"court_id":"...","start_datetime":"...","end_datetime":"..."}' \
  http://localhost:3001/api/bookings
```

## 📊 Monitoring

### Logging

The application logs:
- API requests and responses
- Authentication events
- Payment transactions
- Error conditions

### Health Checks

- Database connectivity
- External service availability
- Environment configuration

## 🔧 Development

### Code Style

- TypeScript with strict mode
- ESLint configuration
- Consistent API response format
- Comprehensive error handling

### Adding New Endpoints

1. Create API route in `pages/api/`
2. Add authentication middleware if needed
3. Implement request validation with Zod
4. Add proper error handling
5. Update TypeScript types

### Database Changes

1. Update `schema.sql`
2. Run migration via Supabase CLI
3. Update TypeScript types
4. Test RLS policies

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Razorpay Integration](https://razorpay.com/docs/payments/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For support and questions:
- Check the documentation
- Review existing issues
- Create a new issue with detailed description

**Built with ❤️ for the rental and booking industry**
