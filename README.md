# # 🏟️ Neo-Lease: Sports Facility Rental Platform

A comprehensive rental and booking platform for sports facilities, courts, and equipment. Built with modern web technologies for scalability, security, and performance.

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication via Supabase
- Role-based access control (User, Owner, Admin)
- Social login support (Google, GitHub)
- Secure session management

### 🏢 Facility Management
- Create and manage sports facilities
- Add multiple courts per facility
- Inventory management for rentable equipment
- Rich media support (images, videos)
- Operating hours and availability management

### 📅 Booking System
- Real-time court availability
- Conflict prevention and validation
- Recurring booking support
- Automated confirmation/cancellation
- Calendar integration

### 🛒 Equipment Rentals
- Browse rentable equipment
- Quantity-based pricing
- Availability tracking
- Rental duration management
- Return/damage tracking

### 💳 Payment Processing
- Razorpay integration for Indian market
- Secure payment verification
- Webhook-based event handling
- Refund processing
- Payment history and receipts

### 📊 Analytics & Reporting
- Facility performance metrics
- Revenue tracking
- Booking analytics
- User engagement insights
- Export capabilities

### 📱 Mobile-First Design
- Responsive web application
- Touch-optimized interface
- Offline capability (PWA ready)
- Push notifications

## 🛠️ Technology Stack

### Backend
- **Framework**: Next.js 14 with API routes
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (JWT)
- **Payments**: Razorpay
- **Storage**: Supabase Storage
- **Validation**: Zod schemas
- **Language**: TypeScript

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context + hooks
- **Form Handling**: React Hook Form
- **Charts**: Recharts
- **Language**: TypeScript

### Infrastructure
- **Hosting**: Vercel (recommended)
- **Database**: Supabase PostgreSQL
- **CDN**: Vercel Edge Network
- **Monitoring**: Built-in analytics
- **SSL**: Automatic HTTPS

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Razorpay account (for payments)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/neo-lease.git
cd neo-lease

# Install backend dependencies
cd Backend && npm install

# Install frontend dependencies  
cd ../Frontend && npm install
```

### 2. Environment Setup
```bash
# Run the automated setup script
./setup-supabase.ps1

# Or set up manually (see SUPABASE_SETUP.md)
```

### 3. Start Development
```bash
# Terminal 1: Start backend (localhost:3001)
cd Backend && npm run dev

# Terminal 2: Start frontend (localhost:5173)  
cd Frontend && npm run dev
```

### 4. Test the Setup
```bash
cd Backend
node test-backend.js
```

## 📖 Documentation

- **[Setup Guide](SUPABASE_SETUP.md)** - Complete setup instructions
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment
- **[API Documentation](Backend/API.md)** - REST API reference
- **[Database Schema](Backend/database/schema.sql)** - Database structure

## 🏗️ Project Structure

```
neo-lease/
├── README.md
├── SUPABASE_SETUP.md          # Setup instructions
├── DEPLOYMENT_GUIDE.md        # Production deployment
├── setup-supabase.ps1         # Automated setup script
│
├── Backend/                   # Next.js API backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── test-backend.js        # Test script
│   │
│   ├── lib/                   # Core libraries
│   │   ├── supabase.ts        # Database client
│   │   └── razorpay.ts        # Payment processing
│   │
│   ├── middleware/            # API middleware
│   │   └── auth.ts            # Authentication
│   │
│   ├── utils/                 # Utilities
│   │   ├── validation.ts      # Zod schemas
│   │   └── api-helpers.ts     # Helper functions
│   │
│   ├── types/                 # Type definitions
│   │   └── supabase.ts        # Database types
│   │
│   ├── database/              # Database schema
│   │   └── schema.sql         # Complete SQL schema
│   │
│   └── pages/api/             # API routes
│       ├── auth/me.ts         # User profile
│       ├── facilities/        # Facility management
│       ├── courts/            # Court management  
│       ├── products/          # Equipment management
│       ├── bookings/          # Booking system
│       ├── rentals/           # Equipment rentals
│       ├── payments/          # Payment processing
│       ├── uploads/           # File uploads
│       └── webhooks/          # Payment webhooks
│
└── Frontend/                  # React frontend
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    │
    ├── src/
    │   ├── components/        # React components
    │   ├── pages/            # Application pages
    │   ├── contexts/         # React contexts
    │   ├── hooks/            # Custom hooks
    │   └── lib/              # Frontend utilities
    │
    └── public/               # Static assets
```

## 🔌 API Endpoints

### Authentication
```
GET    /api/auth/me                    # Get current user
```

### Facilities
```
GET    /api/facilities                 # List facilities
POST   /api/facilities                 # Create facility
GET    /api/facilities/[id]            # Get facility details
PATCH  /api/facilities/[id]            # Update facility
DELETE /api/facilities/[id]            # Delete facility
```

### Courts  
```
GET    /api/courts                     # List courts
POST   /api/courts                     # Create court
GET    /api/courts/[id]                # Get court details
PATCH  /api/courts/[id]                # Update court
```

### Products
```
GET    /api/products                   # List equipment
POST   /api/products                   # Add equipment
GET    /api/products/[id]              # Get equipment details
PATCH  /api/products/[id]              # Update equipment
```

### Bookings
```
GET    /api/bookings                   # List bookings
POST   /api/bookings                   # Create booking
GET    /api/bookings/[id]              # Get booking details
PATCH  /api/bookings/[id]              # Update booking
```

### Rentals
```
GET    /api/rentals                    # List rental orders
POST   /api/rentals                    # Create rental order
GET    /api/rentals/[id]               # Get rental details
```

### Payments
```
POST   /api/payments/create-order      # Create payment order
POST   /api/payments/verify            # Verify payment
```

### File Uploads
```
POST   /api/uploads                    # Generate upload URLs
GET    /api/uploads                    # Get signed URLs
DELETE /api/uploads                    # Delete files
```

## 🗄️ Database Schema

### Core Tables
- **users** - Extended user profiles with roles
- **facilities** - Sports facilities/venues  
- **courts** - Bookable courts within facilities
- **products** - Rentable equipment/items
- **bookings** - Court reservations
- **rental_orders** - Equipment rental orders
- **rental_items** - Individual rental line items
- **payments** - Payment transactions
- **notifications** - User notifications

### Security Features
- Row Level Security (RLS) enabled
- Role-based access control
- User data isolation
- Admin override capabilities

## 💳 Payment Integration

### Razorpay Features
- Order creation and management
- Payment verification with HMAC
- Webhook event processing
- Refund handling
- Multiple payment methods support

### Payment Flow
1. Create order via API
2. Frontend checkout with Razorpay
3. Payment verification
4. Webhook confirmation
5. Status updates and notifications

## 🔒 Security Features

### Authentication
- JWT tokens via Supabase
- Automatic token refresh
- Role-based permissions
- Resource ownership validation

### API Security
- Input validation with Zod
- Rate limiting
- CORS configuration
- Secure headers

### Database Security
- Row Level Security policies
- Prepared statements
- Audit logging
- Regular backups

## 🧪 Testing

### Backend Testing
```bash
cd Backend
npm test                    # Run test suite
node test-backend.js        # Integration tests
```

### Frontend Testing
```bash
cd Frontend
npm test                    # Run test suite
npm run e2e                 # End-to-end tests
```

## 🚀 Deployment

### Development
```bash
# Backend
cd Backend && npm run dev

# Frontend  
cd Frontend && npm run dev
```

### Production
```bash
# Build and deploy
npm run build
npm run start

# Or use deployment platforms
vercel --prod               # Vercel
railway up                  # Railway
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed production setup.

## 📊 Monitoring & Analytics

### Built-in Metrics
- API response times
- Error rates and tracking
- User engagement analytics
- Revenue and booking metrics

### External Integrations
- Sentry for error tracking
- Google Analytics for web metrics
- Custom dashboards for business metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use conventional commits
- Add tests for new features
- Update documentation
- Follow code style guidelines

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the guides in the repository
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Email**: contact@neolease.app (if available)

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Core booking system
- [x] Payment integration
- [x] User management
- [x] Basic analytics

### Phase 2 (Next)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] SMS notifications

### Phase 3 (Future)
- [ ] AI-powered recommendations
- [ ] Dynamic pricing
- [ ] Advanced reporting
- [ ] Third-party integrations

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for backend infrastructure
- [Razorpay](https://razorpay.com) for payment processing
- [Vercel](https://vercel.com) for hosting platform
- [shadcn/ui](https://ui.shadcn.com) for UI components
- Open source community for amazing tools and libraries

---

**Built with ❤️ for the sports community**

For detailed setup instructions, see [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

For production deployment, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

Team Name - Bug Hunters 011

Team Members - 
Raviraj Kamejaliya,
Ansh Patel,
Abdulkadir Nursumar.

## 🚀 Quick Setup with Supabase

This project is now configured to work with Supabase as the database backend. Follow these steps to get started:

### 1. Supabase Setup
1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project credentials from Settings > API
4. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions

### 2. Backend Setup
```bash
cd Backend
npm install
cp .env.template .env
# Edit .env with your Supabase credentials
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### 3. Frontend Setup
```bash
cd Frontend
npm install
cp .env.template .env
# Edit .env with your Supabase credentials
npm run dev
```

### 4. Authentication Options
- **Custom Backend Auth**: Use `/login` and `/signup` routes
- **Supabase Auth**: Use `/login-supabase` and `/signup-supabase` routes

Both authentication methods are fully integrated and working!
