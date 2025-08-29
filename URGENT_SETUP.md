# 🚨 URGENT: Get Site Live in 15 Minutes

## Your 404 Error is Caused By: FAKE SUPABASE CREDENTIALS

Your site is trying to connect to `https://your-project-ref.supabase.co` which doesn't exist!

## STEP-BY-STEP FIX (15 minutes):

### Step 1: Create Real Supabase Project (5 minutes)
1. Go to **https://supabase.com**
2. Click "Start your project" → "New Project"  
3. Name it "sezora-live"
4. Choose a password and region
5. Wait for project to be ready (2-3 minutes)

### Step 2: Get Real Credentials (2 minutes)
1. In your Supabase dashboard, click "Settings" → "API"
2. Copy your **Project URL** (looks like: `https://abcdefgh.supabase.co`)
3. Copy your **anon/public key** (long string starting with `eyJ...`)

### Step 3: Set Up Database (3 minutes)
1. In Supabase, click "SQL Editor"
2. Click "New Query"
3. Copy-paste the ENTIRE contents of `supabase/schema.sql` from this project
4. Click "RUN" - you should see "Success" messages

### Step 4: Update Vercel Environment Variables (3 minutes)
1. Go to **vercel.com** → Your Project → Settings → Environment Variables
2. Add/Update these EXACT variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-real-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_real_anon_key_here
NEXT_PUBLIC_ADMIN_EMAIL = admin@yourdomain.com
ADMIN_PASSWORD = YourSecurePassword123!
```

### Step 5: Create Admin User (2 minutes)
1. In Supabase, go to "Authentication" → "Users"
2. Click "Add User"
3. Email: Use the SAME email as `NEXT_PUBLIC_ADMIN_EMAIL`
4. Password: Use the SAME password as `ADMIN_PASSWORD`
5. Click "Create User"

### Step 6: Redeploy (1 minute)
1. In Vercel, go to "Deployments" tab
2. Click the 3 dots on latest deployment
3. Click "Redeploy"

## ✅ RESULT: Your site will be live!

## If Still 404: Check These
- [ ] Supabase project URL is correct (no typos)
- [ ] Anon key is complete (very long string)
- [ ] Database schema ran without errors
- [ ] Admin user was created successfully
- [ ] Environment variables saved in Vercel
- [ ] Redeployment completed

## Test Your Live Site:
1. Go to your Vercel URL
2. You should see sign-up/login forms
3. Try creating a test account
4. Admin login: Use your admin email/password

**Your site will be live in 15 minutes following these exact steps!**