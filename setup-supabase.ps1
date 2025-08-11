# Neo-Lease Supabase Setup Script
# This script helps set up the complete Supabase database for the Neo-Lease platform

Write-Host "🚀 Neo-Lease Supabase Setup Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "Backend") -or -not (Test-Path "Frontend")) {
    Write-Host "❌ Please run this script from the neo-lease root directory" -ForegroundColor Red
    exit 1
}

# Check if Supabase CLI is installed
if (-not (Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g supabase
    
    if (-not (Get-Command "supabase" -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Failed to install Supabase CLI. Please install it manually:" -ForegroundColor Red
        Write-Host "npm install -g supabase" -ForegroundColor Yellow
        Write-Host "Or visit: https://supabase.com/docs/guides/cli/getting-started" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green

# Get Supabase project details
Write-Host "`n📋 Please provide your Supabase project details:" -ForegroundColor Cyan

$projectRef = Read-Host "Enter your Supabase Project Reference (from project URL)"
$dbPassword = Read-Host "Enter your database password" -AsSecureString

# Convert secure strings to plain text for use
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

Write-Host "`n🔧 Linking to Supabase project..." -ForegroundColor Yellow

# Initialize Supabase project if needed
if (-not (Test-Path "supabase")) {
    supabase init
}

# Link to Supabase project
supabase link --project-ref $projectRef --password $dbPasswordPlain

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link to Supabase project" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Successfully linked to Supabase project" -ForegroundColor Green

# Apply database schema
Write-Host "`n🗄️  Applying database schema..." -ForegroundColor Yellow

$schemaPath = "Backend/database/schema.sql"
if (Test-Path $schemaPath) {
    # Copy schema to Supabase migrations
    $migrationPath = "supabase/migrations/$(Get-Date -Format 'yyyyMMddHHmmss')_initial_schema.sql"
    New-Item -Path (Split-Path $migrationPath) -ItemType Directory -Force | Out-Null
    Copy-Item $schemaPath $migrationPath
    
    supabase db push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database schema applied successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to apply database schema" -ForegroundColor Red
        Write-Host "You can manually apply the schema from Backend/database/schema.sql" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Schema file not found at $schemaPath" -ForegroundColor Yellow
    Write-Host "Please ensure the schema.sql file exists in Backend/database/" -ForegroundColor Yellow
}

# Generate environment variables template
Write-Host "`n⚙️  Setting up environment variables..." -ForegroundColor Yellow

$projectUrl = "https://$projectRef.supabase.co"

Write-Host "`nPlease get your keys from the Supabase Dashboard:" -ForegroundColor Cyan
Write-Host "1. Go to: https://supabase.com/dashboard/project/$projectRef/settings/api" -ForegroundColor Yellow
Write-Host "2. Copy the 'anon' and 'service_role' keys" -ForegroundColor Yellow

$anonKey = Read-Host "Enter your anon key"
$serviceKey = Read-Host "Enter your service_role key" -AsSecureString
$serviceKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($serviceKey))

# Create .env file for backend
$envContent = @"
# Supabase Configuration
SUPABASE_URL=$projectUrl
SUPABASE_ANON_KEY=$anonKey
SUPABASE_SERVICE_ROLE_KEY=$serviceKeyPlain

# Razorpay Configuration (Replace with your actual keys)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# App Configuration
NODE_ENV=development
JWT_SECRET=your_jwt_secret_for_additional_security
WEBHOOK_SECRET=your_webhook_secret

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
"@

$envPath = "Backend/.env.local"
$envContent | Out-File -FilePath $envPath -Encoding UTF8

Write-Host "✅ Environment file created at $envPath" -ForegroundColor Green

# Create .env file for frontend
$frontendEnvContent = @"
# Frontend Environment Variables
VITE_SUPABASE_URL=$projectUrl
VITE_SUPABASE_ANON_KEY=$anonKey
VITE_BACKEND_URL=http://localhost:3001
VITE_APP_NAME=Neo-Lease
VITE_APP_VERSION=1.0.0
"@

$frontendEnvPath = "Frontend/.env.local"
$frontendEnvContent | Out-File -FilePath $frontendEnvPath -Encoding UTF8

Write-Host "✅ Frontend environment file created at $frontendEnvPath" -ForegroundColor Green

# Install dependencies
Write-Host "`n📦 Installing Backend dependencies..." -ForegroundColor Yellow
Set-Location Backend
npm install

Write-Host "� Installing Frontend dependencies..." -ForegroundColor Yellow
Set-Location ../Frontend
npm install

Set-Location ..

Write-Host "`n🎉 Setup completed!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Update the Razorpay keys in Backend/.env.local with your actual keys" -ForegroundColor Yellow
Write-Host "2. Start the backend: cd Backend && npm run dev" -ForegroundColor Yellow
Write-Host "3. Start the frontend: cd Frontend && npm run dev" -ForegroundColor Yellow

Write-Host "`n📚 Useful commands:" -ForegroundColor Cyan
Write-Host "- View database: supabase db diff" -ForegroundColor Yellow
Write-Host "- Reset database: supabase db reset" -ForegroundColor Yellow
Write-Host "- Generate types: supabase gen types typescript --local" -ForegroundColor Yellow

Write-Host "`n🔗 Useful links:" -ForegroundColor Cyan
Write-Host "- Project Dashboard: https://supabase.com/dashboard/project/$projectRef" -ForegroundColor Blue
Write-Host "- API Documentation: https://supabase.com/dashboard/project/$projectRef/api" -ForegroundColor Blue
Write-Host "- Storage: https://supabase.com/dashboard/project/$projectRef/storage/buckets" -ForegroundColor Blue
Write-Host "- Authentication: https://supabase.com/dashboard/project/$projectRef/auth/users" -ForegroundColor Blue

Write-Host "`n⚠️  Important Security Notes:" -ForegroundColor Red
Write-Host "1. Never commit .env files to version control" -ForegroundColor Yellow
Write-Host "2. Use different keys for production" -ForegroundColor Yellow
Write-Host "3. Enable RLS policies for production use" -ForegroundColor Yellow
Write-Host "4. Set up proper CORS policies" -ForegroundColor Yellow

Write-Host "`n✨ Happy coding with Neo-Lease! ✨" -ForegroundColor Magenta
