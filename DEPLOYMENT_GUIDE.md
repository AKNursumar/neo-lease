# 🚀 Neo-Lease Production Deployment Guide

This guide covers deploying the Neo-Lease backend to production environments with best practices for security, performance, and monitoring.

## 📋 Pre-Deployment Checklist

### Backend Ready
- [ ] All environment variables configured
- [ ] Database schema applied
- [ ] Tests pass locally (`npm run test`)
- [ ] Code linted and formatted
- [ ] Dependencies up to date

### Infrastructure Ready
- [ ] Production Supabase project created
- [ ] Razorpay production keys obtained
- [ ] Domain name configured
- [ ] SSL certificate ready
- [ ] CDN configured (optional)

### Security Ready
- [ ] Environment secrets secured
- [ ] CORS origins configured
- [ ] Rate limiting configured
- [ ] Database backups enabled
- [ ] Monitoring setup

## 🏗️ Deployment Options

### Option 1: Vercel (Recommended)

#### Benefits
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Serverless functions
- Built-in monitoring

#### Setup Steps

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and connect project
   vercel login
   vercel --cwd Backend
   ```

2. **Configure Environment Variables**
   
   In Vercel dashboard or CLI:
   ```bash
   vercel env add SUPABASE_URL production
   vercel env add SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   vercel env add RAZORPAY_KEY_ID production
   vercel env add RAZORPAY_KEY_SECRET production
   vercel env add RAZORPAY_WEBHOOK_SECRET production
   vercel env add FRONTEND_URL production
   vercel env add NODE_ENV production
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

#### Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "pages/api/**/*.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/pages/api/$1"
    }
  ],
  "functions": {
    "pages/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Option 2: Railway

#### Benefits
- Simple deployment
- Database included
- Automatic scaling
- Built-in metrics

#### Setup Steps

1. **Connect Repository**
   - Sign up at [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Select the Backend folder

2. **Configure Environment**
   - Add all environment variables in Railway dashboard
   - Set start command: `npm start`

3. **Deploy**
   - Push to main branch triggers deployment
   - Monitor logs in Railway dashboard

### Option 3: DigitalOcean App Platform

#### Benefits
- Predictable pricing
- Multiple regions
- Database clusters
- Load balancing

#### Setup Steps

1. **Create App**
   ```bash
   # Install doctl
   doctl apps create --spec .digitalocean/app.yaml
   ```

2. **App Spec (`.digitalocean/app.yaml`)**
   ```yaml
   name: neo-lease-backend
   services:
   - name: api
     source_dir: /Backend
     github:
       repo: your-username/neo-lease
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: SUPABASE_URL
       value: your-production-supabase-url
     # Add other environment variables
   ```

## 🔧 Production Environment Setup

### Environment Variables

Create production-specific values:

```env
# Production Supabase
SUPABASE_URL=https://your-prod-ref.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key

# Production Razorpay
RAZORPAY_KEY_ID=rzp_live_your-key-id
RAZORPAY_KEY_SECRET=your-live-secret-key
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Production URLs
FRONTEND_URL=https://your-frontend-domain.com
API_URL=https://your-backend-domain.com

# Security
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret
WEBHOOK_SECRET=your-webhook-signing-secret

# Optional: External services
REDIS_URL=redis://your-redis-instance
SENTRY_DSN=https://your-sentry-dsn
```

### Database Migration

1. **Backup Development Data** (if needed)
   ```sql
   -- Export important data
   \copy users TO 'users_backup.csv' CSV HEADER;
   \copy facilities TO 'facilities_backup.csv' CSV HEADER;
   ```

2. **Apply Schema to Production**
   ```bash
   # Run schema in Supabase SQL editor
   # Or use migration tool
   supabase db push --db-url="your-production-db-url"
   ```

3. **Verify Tables and Policies**
   ```sql
   -- Check all tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Check RLS policies
   SELECT schemaname, tablename, policyname, roles 
   FROM pg_policies;
   ```

## 🔐 Production Security

### API Security

1. **Rate Limiting**
   ```javascript
   // Add to middleware/rateLimit.ts
   import rateLimit from 'express-rate-limit';
   
   export const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
     message: 'Too many requests from this IP'
   });
   
   export const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 5, // limit auth attempts
     skipSuccessfulRequests: true
   });
   ```

2. **CORS Configuration**
   ```javascript
   // Update cors settings
   const corsOptions = {
     origin: [
       'https://your-frontend-domain.com',
       'https://www.your-frontend-domain.com'
     ],
     credentials: true,
     optionsSuccessStatus: 200
   };
   ```

3. **Security Headers**
   ```javascript
   // Add security middleware
   app.use(helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         scriptSrc: ["'self'", "https://checkout.razorpay.com"],
         styleSrc: ["'self'", "'unsafe-inline'"],
         imgSrc: ["'self'", "data:", "https:"],
       }
     }
   }));
   ```

### Database Security

1. **Row Level Security**
   ```sql
   -- Verify RLS is enabled on all tables
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **Backup Configuration**
   ```sql
   -- Enable point-in-time recovery
   -- (Automatic in Supabase Pro plan)
   
   -- Set up custom backup script
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

## 📊 Monitoring & Logging

### Application Monitoring

1. **Sentry Integration**
   ```bash
   npm install @sentry/node @sentry/tracing
   ```

   ```javascript
   // Add to pages/api/_app.ts
   import * as Sentry from '@sentry/node';
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 1.0,
   });
   ```

2. **Custom Logging**
   ```javascript
   // utils/logger.ts
   import winston from 'winston';
   
   export const logger = winston.createLogger({
     level: 'info',
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.errors({ stack: true }),
       winston.format.json()
     ),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' }),
       new winston.transports.Console({
         format: winston.format.simple()
       })
     ]
   });
   ```

### Performance Monitoring

1. **Database Performance**
   ```sql
   -- Monitor slow queries
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   WHERE mean_time > 1000
   ORDER BY mean_time DESC;
   ```

2. **API Performance**
   ```javascript
   // Add response time logging
   app.use((req, res, next) => {
     const start = Date.now();
     res.on('finish', () => {
       const duration = Date.now() - start;
       logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
     });
     next();
   });
   ```

## 🚨 Health Checks

### API Health Check

```javascript
// pages/api/health.ts
export default async function handler(req, res) {
  try {
    // Check database
    const { data: dbCheck } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    // Check external services
    const razorpayCheck = process.env.RAZORPAY_KEY_ID ? 'ok' : 'missing';

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      checks: {
        database: dbCheck ? 'ok' : 'error',
        razorpay: razorpayCheck,
        environment: process.env.NODE_ENV
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
}
```

### Uptime Monitoring

Configure external monitoring:

1. **UptimeRobot** (Free)
   - Monitor `/api/health` endpoint
   - Alert via email/SMS on downtime

2. **Pingdom** (Paid)
   - Advanced monitoring
   - Performance insights
   - Global monitoring locations

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd Backend
        npm ci
        
    - name: Run tests
      run: |
        cd Backend
        npm run test
        
    - name: Run linting
      run: |
        cd Backend
        npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
        working-directory: Backend
```

## 🎯 Performance Optimization

### API Optimization

1. **Response Caching**
   ```javascript
   // utils/cache.ts
   import NodeCache from 'node-cache';
   
   const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes
   
   export const getCachedData = (key: string) => cache.get(key);
   export const setCachedData = (key: string, data: any) => cache.set(key, data);
   ```

2. **Database Query Optimization**
   ```javascript
   // Optimize queries with proper indexing
   // Use pagination for large datasets
   const { data } = await supabase
     .from('facilities')
     .select('*')
     .range(page * limit, (page + 1) * limit - 1)
     .order('created_at', { ascending: false });
   ```

3. **Image Optimization**
   ```javascript
   // Use Supabase image transformations
   const { data } = supabase.storage
     .from('facility-images')
     .getPublicUrl('image.jpg', {
       transform: {
         width: 800,
         height: 600,
         resize: 'cover',
         quality: 80
       }
     });
   ```

### Database Optimization

1. **Indexes**
   ```sql
   -- Add indexes for common queries
   CREATE INDEX idx_facilities_city ON facilities(city);
   CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
   CREATE INDEX idx_payments_status ON payments(status);
   ```

2. **Connection Pooling**
   ```javascript
   // Supabase handles this automatically
   // For custom connections, use connection pooling
   ```

## 📋 Production Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Performance tests completed
- [ ] Security audit completed
- [ ] Backup procedures tested
- [ ] Monitoring configured
- [ ] Health checks working

### Launch Day
- [ ] DNS configured
- [ ] SSL certificate installed
- [ ] Environment variables set
- [ ] Database migrated
- [ ] Monitoring active
- [ ] Team notified

### Post-Launch
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all integrations working
- [ ] Document any issues
- [ ] Plan next releases

## 🆘 Troubleshooting

### Common Production Issues

1. **Environment Variables Not Loading**
   - Check deployment platform configuration
   - Verify variable names match exactly
   - Restart application after changes

2. **Database Connection Errors**
   - Check Supabase project status
   - Verify connection string format
   - Check IP restrictions

3. **Payment Webhook Failures**
   - Verify webhook URL is accessible
   - Check webhook secret configuration
   - Monitor webhook logs in Razorpay dashboard

4. **High Response Times**
   - Check database query performance
   - Monitor memory usage
   - Consider adding caching

### Emergency Procedures

1. **Service Down**
   ```bash
   # Quick rollback
   vercel rollback
   
   # Or redeploy last known good version
   git revert HEAD
   git push origin main
   ```

2. **Database Issues**
   ```sql
   -- Check active connections
   SELECT * FROM pg_stat_activity;
   
   -- Kill problematic queries
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
   WHERE query_start < now() - interval '5 minutes';
   ```

## 📞 Support Contacts

- **Platform Issues**: Your deployment platform support
- **Database Issues**: Supabase support
- **Payment Issues**: Razorpay support
- **DNS/Domain Issues**: Your domain provider

---

**Remember**: Always test in staging before deploying to production! 🚀
