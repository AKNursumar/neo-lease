# Supabase Setup Script for Windows PowerShell
# Run this after setting up your Supabase project and getting credentials

Write-Host "🚀 Setting up Neo-Lease with Supabase..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "Backend") -or -not (Test-Path "Frontend")) {
    Write-Host "❌ Please run this script from the neo-lease root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing Backend dependencies..." -ForegroundColor Yellow
Set-Location Backend
npm install

Write-Host "📦 Installing Frontend dependencies..." -ForegroundColor Yellow
Set-Location ../Frontend
npm install

Write-Host "⚙️ Setting up environment files..." -ForegroundColor Yellow
Set-Location ../Backend
if (-not (Test-Path ".env")) {
    Copy-Item ".env.template" ".env"
    Write-Host "✅ Created Backend .env file from template" -ForegroundColor Green
    Write-Host "⚠️  Please edit Backend/.env with your Supabase credentials!" -ForegroundColor Cyan
} else {
    Write-Host "ℹ️  Backend .env file already exists" -ForegroundColor Blue
}

Set-Location ../Frontend
if (-not (Test-Path ".env")) {
    Copy-Item ".env.template" ".env"
    Write-Host "✅ Created Frontend .env file from template" -ForegroundColor Green
    Write-Host "⚠️  Please edit Frontend/.env with your Supabase credentials!" -ForegroundColor Cyan
} else {
    Write-Host "ℹ️  Frontend .env file already exists" -ForegroundColor Blue
}

Set-Location ../Backend
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npm run prisma:generate

Write-Host "" 
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host "" 
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit Backend/.env with your Supabase DATABASE_URL and credentials" -ForegroundColor White
Write-Host "2. Edit Frontend/.env with your Supabase URL and anon key" -ForegroundColor White
Write-Host "3. Run: npm run prisma:migrate (in Backend folder)" -ForegroundColor White
Write-Host "4. Start Backend: npm run dev (in Backend folder)" -ForegroundColor White
Write-Host "5. Start Frontend: npm run dev (in Frontend folder)" -ForegroundColor White
Write-Host "" 
Write-Host "📖 See SUPABASE_SETUP.md for detailed instructions" -ForegroundColor Yellow
Write-Host "🌐 Visit /login-supabase or /signup-supabase to test Supabase auth" -ForegroundColor Yellow

Set-Location ..
