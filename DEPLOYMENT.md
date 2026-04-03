# 🚀 Production Deployment Guide

## Overview

This guide covers deploying KEN AI to production using Vercel and Supabase.

## Prerequisites

- ✅ GitHub account
- ✅ Vercel account (free tier works)
- ✅ Supabase project (production)
- ✅ All environment variables configured

---

## Step 1: Prepare Your Code

### Push to GitHub

```bash
git add .
git commit -m "Initial commit: KEN AI platform"
git branch -M main
git remote add origin https://github.com/yourusername/ken-ai.git
git push -u origin main
```

⚠️ **Important**: Make sure `.env.local` is in `.gitignore`!

---

## Step 2: Deploy to Vercel

### Option A: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
   GOOGLE_GENERATIVE_AI_API_KEY
   ```

6. Click **"Deploy"**

### Option B: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

Follow the prompts to configure and deploy.

---

## Step 3: Configure Supabase for Production

### Use Production Project

If you have separate dev/prod Supabase projects:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your **production** project
3. Copy production credentials
4. Update Vercel environment variables

### Run Migrations in Production

In Supabase Production Dashboard → SQL Editor:

1. Run `001_initial_schema.sql`
2. Run `002_rls_policies.sql`
3. Enable `vector` extension

### Create Production Storage Buckets

```sql
-- Create buckets via Dashboard or SQL
INSERT INTO storage.buckets (id, name, public) VALUES
('documents-original', 'documents-original', false),
('documents-processed', 'documents-processed', false);
```

Apply RLS policies from migration file.

---

## Step 4: Deploy Edge Functions to Production

### Link to Production Project

```bash
supabase link --project-ref YOUR_PROD_PROJECT_REF
```

### Deploy OCR Function

```bash
supabase functions deploy ocr-process --prod
```

### Set Production Secrets

```bash
supabase secrets set GOOGLE_GENERATIVE_AI_API_KEY=your_prod_api_key --prod
```

---

## Step 5: Update Allowed Domains

### In Supabase Dashboard

1. Go to **Settings** → **API**
2. Under **Allowed Referrers**, add:
   ```
   https://your-app.vercel.app
   https://your-custom-domain.com
   ```

This prevents unauthorized use of your Supabase API keys.

---

## Step 6: Configure Custom Domain (Optional)

### In Vercel Dashboard

1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `app.yourcompany.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (~5 minutes)

### Update Environment Variables

```env
NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
```

---

## Step 7: Post-Deployment Testing

### Health Checks

1. **Homepage**: Visit your Vercel URL
2. **Login**: Test authentication flow
3. **Database**: Check if you can query `pipeline_stages`
4. **Upload**: Test file upload (if storage configured)

### Test Checklist

- [ ] Can access login page
- [ ] Can create account
- [ ] Email confirmation works
- [ ] Can log in successfully
- [ ] Dashboard loads without errors
- [ ] No CORS errors in console
- [ ] File upload works (if tested)
- [ ] OCR function responds (check logs)

---

## Step 8: Monitoring & Logging

### Vercel Analytics

Enable in Vercel Dashboard → Analytics:
- Web Vitals
- Page Views
- Errors

### Supabase Logs

Monitor in real-time:
- Dashboard → Database → Logs
- Filter by level (error, warn, info)

### Edge Function Logs

```bash
supabase functions logs ocr-process --prod
```

Or view in Dashboard → Edge Functions → Logs

---

## Step 9: Backup Strategy

### Database Backups

Supabase Pro Plan includes:
- Daily automated backups
- Point-in-time recovery

To enable: Dashboard → Settings → Database → Enable Backups

### Manual Backup Script

```bash
#!/bin/bash
# backup.sh

PROJECT_REF="your-project-ref"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

supabase db dump -f backup_$TIMESTAMP.sql --project-ref $PROJECT_REF
```

Run weekly via cron job.

---

## Step 10: Performance Optimization

### Enable Vercel Caching

In `next.config.js`:

```javascript
module.exports = {
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=30' },
      ],
    },
  ],
}
```

### Optimize Images

Use Next.js Image component:

```tsx
import Image from 'next/image'

<Image
  src={imageUrl}
  alt="Document"
  width={800}
  height={600}
  priority
/>
```

### Database Indexes

Already created in migrations:
- `idx_profiles_email`
- `idx_students_counselor`
- `idx_documents_student`
- `idx_knowledge_base_embedding`

Monitor slow queries in Supabase Dashboard.

---

## 🔒 Security Best Practices

### Environment Variables

✅ **Do**:
- Store all secrets in Vercel environment variables
- Use separate keys for dev/staging/prod
- Rotate API keys periodically

❌ **Don't**:
- Commit `.env.local` to Git
- Hardcode credentials in code
- Share service role key publicly

### Row Level Security

Double-check RLS policies are enabled:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.

### Rate Limiting

Implement rate limiting for API routes:

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
})
```

---

## 🆘 Troubleshooting Production Issues

### Issue: "Failed to fetch" after deployment

**Solutions**:
1. Check Allowed Referrers in Supabase
2. Verify environment variables in Vercel
3. Test API endpoints directly

### Issue: Edge Function returns 500

**Solutions**:
1. Check function logs: `supabase functions logs`
2. Verify secrets are set: `supabase secrets list`
3. Test function locally first

### Issue: Images not loading

**Solutions**:
1. Check storage bucket is private
2. Verify signed URL generation
3. Check RLS policies for storage

### Issue: Slow performance

**Solutions**:
1. Enable Vercel Analytics
2. Check database query performance
3. Add missing indexes
4. Optimize image sizes

---

## 📊 Scaling Considerations

### When to Upgrade Supabase

Signs you need Pro Plan:
- > 500MB database size
- > 50,000 monthly active users
- Need daily backups
- Need more than 2GB bandwidth

### When to Add Caching

Consider Redis/Upstash when:
- Same queries repeated frequently
- Need sub-100ms response times
- High concurrent user load

### Horizontal Scaling

Vercel automatically scales:
- Serverless functions scale to zero
- No cold starts with Pro plan
- Global edge network

---

## 🎉 Launch Checklist

Before going live:

### Technical
- [ ] All migrations run in production
- [ ] Environment variables set in Vercel
- [ ] Edge Functions deployed
- [ ] Storage buckets configured
- [ ] RLS policies tested
- [ ] Custom domain configured (optional)
- [ ] HTTPS enabled
- [ ] Error monitoring setup

### Business
- [ ] Admin user created
- [ ] Initial staff accounts created
- [ ] Pipeline stages customized
- [ ] Email templates reviewed
- [ ] Knowledge base seeded
- [ ] User documentation ready
- [ ] Support process defined

### Compliance
- [ ] Privacy policy published
- [ ] Terms of service accepted
- [ ] Data retention policy defined
- [ ] Audit logging enabled
- [ ] Backup strategy implemented
- [ ] Security audit completed

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Weekly**:
- Review error logs
- Check backup integrity
- Monitor database size

**Monthly**:
- Update dependencies (`npm update`)
- Review audit logs
- Clean up old conversations
- Analyze usage patterns

**Quarterly**:
- Security audit
- Performance review
- Feature roadmap planning
- User feedback collection

### Getting Help

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Discord**: [discord.gg/supabase](https://discord.gg/supabase)
- **Next.js GitHub**: [github.com/vercel/next.js](https://github.com/vercel/next.js)

---

## 🔄 Rollback Strategy

If something goes wrong:

### Quick Rollback to Previous Deployment

```bash
vercel rollback
```

Or in Vercel Dashboard:
1. Go to Deployments
2. Find last working deployment
3. Click "Promote to Production"

### Database Rollback

For schema changes:
1. Keep migration files versioned
2. Create rollback migrations
3. Test rollback in staging first

---

## 🎯 Success Metrics

Monitor these KPIs:

### Performance
- Page load time < 3s
- API response time < 500ms
- OCR processing time < 10s

### Reliability
- Uptime > 99.9%
- Error rate < 0.1%
- Failed uploads < 1%

### User Adoption
- Daily active users
- Documents processed per day
- Average session duration

---

**Congratulations! Your KEN AI platform is now live in production! 🚀**

Remember to monitor logs, gather user feedback, and iterate on features based on real-world usage.
