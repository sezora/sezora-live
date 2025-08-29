# Deployment Guide

## Prerequisites

Before deploying, make sure you have:

1. ✅ Supabase project set up
2. ✅ Database tables created (users, jobs)
3. ✅ RLS policies configured
4. ✅ Environment variables configured locally
5. ✅ Application tested locally

## Deploy to Vercel

### Step 1: Initialize Git Repository

```bash
cd /Users/marius/Desktop/sezora-live
git init
git add .
git commit -m "Initial commit - Sezora Live Next.js app"
```

### Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository named `sezora-live`
2. Push your code:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sezora-live.git
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "New Project"
3. Import your `sezora-live` repository from GitHub
4. Configure environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` (your Supabase project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (your Supabase anon key)
   - `ADMIN_EMAIL` (admin@app.com)
   - `ADMIN_PASSWORD` (admin123)

### Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Your app will be live at `https://your-project-name.vercel.app`

## Post-Deployment

### Test Your Live Application

1. Visit your live URL
2. Test sign-up functionality
3. Test sign-in functionality  
4. Test admin login (admin@app.com / admin123)
5. Test job posting (employers)
6. Test admin dashboard functionality

### Share Your Demo

Your live application is now accessible to anyone with the URL! You can share it with:
- Potential users
- Stakeholders
- Investors
- Team members

## Monitoring & Maintenance

- Monitor usage via Vercel dashboard
- Check Supabase usage and limits
- Monitor errors in Vercel function logs
- Update environment variables as needed

## Production Considerations

For a production deployment, consider:

1. **Custom Domain**: Set up a custom domain in Vercel
2. **Email Verification**: Configure Supabase email templates
3. **Error Handling**: Add proper error boundaries
4. **Loading States**: Improve loading indicators
5. **SEO**: Add proper meta tags and Open Graph
6. **Analytics**: Add analytics tracking
7. **Performance**: Optimize images and assets

## Troubleshooting

### Common Issues

**Environment Variables**: Make sure all environment variables are set in Vercel dashboard

**Database Connection**: Verify Supabase URL and anon key are correct

**CORS Errors**: Supabase should handle CORS automatically

**Build Errors**: Check build logs in Vercel dashboard

### Support

- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs