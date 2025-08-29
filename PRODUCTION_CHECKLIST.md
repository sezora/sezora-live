# Production Deployment Checklist

## ✅ Pre-Deployment Security Checklist

### Critical Security Items
- [ ] **Remove `.env.local.example` from production** - Contains example values
- [ ] **Set strong, unique admin credentials** in production environment variables
- [ ] **Generate secure JWT secrets** using `openssl rand -base64 32`
- [ ] **Verify no hardcoded credentials** remain in the codebase
- [ ] **Enable HTTPS** for all production domains
- [ ] **Configure CORS** properly in Supabase dashboard

### Environment Variables Required
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- [ ] `ADMIN_EMAIL` - Secure admin email (not admin@app.com)
- [ ] `ADMIN_PASSWORD` - Strong admin password (min 12 chars)
- [ ] `NEXTAUTH_SECRET` - Random 32-byte secret for session encryption
- [ ] `JWT_SECRET` - Random 32-byte secret for JWT signing

## 🗄️ Database Setup Checklist

### Supabase Configuration
- [ ] **Run database schema** - Execute `supabase/schema.sql` in SQL Editor
- [ ] **Verify RLS policies** are active on all tables
- [ ] **Test admin user creation** in Supabase Auth dashboard
- [ ] **Configure email templates** for password reset/verification
- [ ] **Set up database backups** (automatic in Supabase)
- [ ] **Review database usage limits** for your plan

### Data Validation
- [ ] **Test user registration** with various inputs
- [ ] **Verify role-based access** (Student vs Employer vs Admin)
- [ ] **Test job creation/deletion** permissions
- [ ] **Confirm admin dashboard** shows all users/jobs

## 🚀 Application Testing

### Functionality Tests
- [ ] **User registration** - Students and Employers
- [ ] **Email verification** - Check Supabase email delivery
- [ ] **User login/logout** - All user types
- [ ] **Password reset** - Email delivery and reset flow  
- [ ] **Admin authentication** - Using environment credentials
- [ ] **Job posting** - Employers only
- [ ] **Job viewing** - All user types
- [ ] **Admin user management** - Delete users, view stats
- [ ] **Admin job management** - Delete any job

### Security Tests
- [ ] **Rate limiting** - Try rapid requests to verify limits
- [ ] **Input validation** - Test with malicious inputs
- [ ] **SQL injection prevention** - Test with SQL patterns
- [ ] **XSS prevention** - Test with script tags
- [ ] **Admin privilege escalation** - Non-admins can't access admin routes
- [ ] **Password strength** - Weak passwords are rejected
- [ ] **Session timeout** - Sessions expire properly

### Performance Tests  
- [ ] **Page load times** - Under 3 seconds for main pages
- [ ] **Database query performance** - No slow queries
- [ ] **Image optimization** - If using images
- [ ] **Bundle size** - Acceptable for your users

## 🔧 Production Configuration

### Next.js Configuration
Add to `next.config.js`:
```javascript
const nextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
  
  // Optimize images
  images: {
    domains: [], // Add your image domains
  },
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  }
}
```

### Vercel Deployment Settings
- [ ] **Node.js version** - Use Node 18+ 
- [ ] **Build command** - `npm run build`
- [ ] **Output directory** - `.next` (default)
- [ ] **Install command** - `npm install`
- [ ] **Environment variables** - All required vars set
- [ ] **Domain configuration** - Custom domain if needed

## 📊 Monitoring Setup

### Error Tracking
Consider adding:
- [ ] **Sentry** for error monitoring
- [ ] **LogRocket** for session recordings
- [ ] **Vercel Analytics** for performance monitoring

### Custom Monitoring
- [ ] **Set up health checks** - Basic endpoint monitoring
- [ ] **Database monitoring** - Supabase dashboard alerts
- [ ] **Performance budgets** - Core Web Vitals tracking

## 🚨 Post-Deployment Verification

### Immediate Tests (within 1 hour)
- [ ] **Homepage loads** without errors
- [ ] **User registration** works end-to-end
- [ ] **Admin login** works with production credentials
- [ ] **Database connections** are working
- [ ] **Email notifications** are delivered
- [ ] **All API routes** respond correctly

### Extended Tests (within 24 hours)
- [ ] **Load testing** - Simulate multiple users
- [ ] **Cross-browser testing** - Chrome, Firefox, Safari
- [ ] **Mobile responsiveness** - Test on mobile devices
- [ ] **Email deliverability** - Check spam folders
- [ ] **Backup verification** - Confirm backups are running

## 🔄 Ongoing Maintenance

### Daily
- [ ] **Monitor error logs** in deployment platform
- [ ] **Check Supabase usage** against limits
- [ ] **Review security logs** for suspicious activity

### Weekly  
- [ ] **Update dependencies** with security patches
- [ ] **Review user feedback** and bug reports
- [ ] **Database performance** review

### Monthly
- [ ] **Security audit** - Review access patterns
- [ ] **Backup testing** - Verify backup restoration
- [ ] **Performance optimization** - Identify bottlenecks
- [ ] **User analytics review** - Usage patterns and growth

## 📋 Emergency Procedures

### If Site Goes Down
1. **Check deployment status** in Vercel dashboard
2. **Verify environment variables** are still set
3. **Check Supabase status** at status.supabase.com
4. **Review recent deployments** for breaking changes
5. **Rollback to previous version** if necessary

### If Security Breach Suspected
1. **Rotate all credentials** immediately
2. **Check access logs** for suspicious activity
3. **Force logout all users** if necessary
4. **Notify users** if data may be compromised
5. **Update security measures** based on findings

### If Database Issues
1. **Check Supabase dashboard** for errors
2. **Verify RLS policies** are still active
3. **Review recent schema changes**
4. **Contact Supabase support** if needed
5. **Restore from backup** as last resort

---

## 📞 Support Contacts

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)  
- **Security Issues**: Report immediately to your security team

---

**Last Updated**: January 2025  
**Next Review**: Before each major deployment