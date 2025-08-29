# Sezora Live - Next.js Migration

This is the live deployment version of your Sezora MVP, migrated from vanilla HTML/CSS/JavaScript to Next.js with Supabase backend.

## 🚀 Setup Instructions

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > API and copy your Project URL and anon key
4. Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### 2. Database Setup

Go to the SQL Editor in your Supabase dashboard and run these commands:

#### Create Users Table
```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Student', 'Employer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Create policy for admin to see all data
CREATE POLICY "Admin can view all data" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@app.com'
    )
  );

-- Allow users to insert their own data
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Allow admin to delete users
CREATE POLICY "Admin can delete users" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@app.com'
    )
  );
```

#### Create Jobs Table
```sql
-- Create jobs table
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  pay VARCHAR(100) NOT NULL,
  employer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create policy for everyone to view jobs
CREATE POLICY "Anyone can view jobs" ON jobs
  FOR SELECT USING (true);

-- Create policy for employers to insert their own jobs
CREATE POLICY "Employers can insert jobs" ON jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = employer_id 
      AND users.role = 'Employer'
      AND auth.uid()::text = users.id::text
    )
  );

-- Create policy for employers to update their own jobs
CREATE POLICY "Employers can update own jobs" ON jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = employer_id 
      AND auth.uid()::text = users.id::text
    )
  );

-- Create policy for employers to delete their own jobs
CREATE POLICY "Employers can delete own jobs" ON jobs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = employer_id 
      AND auth.uid()::text = users.id::text
    )
  );

-- Allow admin to manage all jobs
CREATE POLICY "Admin can manage all jobs" ON jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@app.com'
    )
  );
```

#### Create Admin User
```sql
-- Insert admin user (this will be handled by the authentication system)
-- The admin check will be done via email comparison in policies
```

### 3. Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### 4. Deployment to Vercel

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
4. Deploy!

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Auth page (sign-up/sign-in)
│   ├── dashboard/
│   │   └── page.tsx          # User dashboard
│   ├── admin/
│   │   └── page.tsx          # Admin dashboard
│   ├── api/
│   │   ├── users/
│   │   │   └── route.ts      # User management API
│   │   └── jobs/
│   │       └── route.ts      # Job management API
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles (converted from original)
├── components/
│   ├── AuthForms.tsx         # Sign-up/sign-in components
│   ├── UserCard.tsx          # User display component
│   ├── JobCard.tsx           # Job display component
│   └── Modal.tsx             # Modal component
└── lib/
    └── supabase.ts           # Supabase client and types
```

## 🔄 Migration Status

- [x] Project setup and dependencies
- [x] CSS migration and styling
- [x] Database schema design
- [ ] Authentication components (React)
- [ ] Dashboard components (React)
- [ ] API routes (Next.js)
- [ ] Deployment configuration

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (React)
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: CSS (converted from original)
- **Deployment**: Vercel

## 🔐 Admin Access

- **Email**: admin@app.com
- **Password**: admin123

## 📝 Features

- User registration with role selection (Student/Employer)
- User authentication and session management
- Job posting for employers
- Admin dashboard for user management
- Responsive design for all screen sizes
- Real-time data with Supabase