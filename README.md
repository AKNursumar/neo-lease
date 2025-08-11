# LeaseLink

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
