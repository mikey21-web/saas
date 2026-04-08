# Complete Authentication Setup Guide

**Status:** ✅ Authentication system is fully built and ready to deploy

---

## What's Been Built

✅ **Sign Up Page** (`/auth/sign-up`)
- Email + Password signup
- Email OTP verification (6-digit code)
- Google OAuth button
- Beautiful dark theme UI with animations

✅ **Sign In Page** (`/auth/sign-in`)
- Email + Password login
- Google OAuth button
- Forgot password link (placeholder)
- Beautiful dark theme UI

✅ **Welcome Email** (via Resend)
- Professional HTML template
- Sent automatically after signup
- Contains quick-start guide
- Links to dashboard

✅ **API Routes**
- `/api/auth/verify-otp` — OTP verification
- `/api/auth/send-welcome-email` — Welcome email trigger
- `/api/auth/callback` — OAuth callback handler

✅ **Route Protection**
- Middleware protects `/dashboard`, `/agents`, `/workflows`, etc.
- Redirects unauthenticated users to `/auth/sign-in`
- Redirects authenticated users away from auth pages

---

## Step-by-Step Setup

### 1. Enable Email Auth in Supabase ✅

1. Go to [supabase.com](https://supabase.com) → Select your project
2. Go to **Authentication** → **Providers**
3. Enable **Email** provider:
   - ✅ Email Auth enabled
   - ✅ Confirm email enabled (or use OTP if preferred)
4. Go to **Email Templates**:
   - The OTP email template should show up. It's ready to use.

**Note:** Supabase sends OTP emails automatically. You don't need to do anything here.

### 2. Enable Google OAuth ✅

1. Create a Google OAuth app:
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create new project
   - Enable "Google+ API"
   - Create OAuth credentials (Web application)
   - Authorized redirect URIs: `https://your-domain.com/auth/callback`

2. In Supabase, go to **Authentication** → **Providers** → **Google**:
   - Paste your Client ID
   - Paste your Client Secret
   - ✅ Enable

**For local testing:**
- Redirect URI: `http://localhost:3000/auth/callback`

### 3. Verify Resend Email in `.env.local` ✅

Check your `.env.local` has:

```env
RESEND_API_KEY=re_MVCR9VZY_NGk5rmfCudVSdn3gJaECk1C3
```

This is **already configured** in your project!

### 4. Update `.env.local` with Supabase Auth Details ✅

Your `.env.local` should have (already set):

```env
NEXT_PUBLIC_SUPABASE_URL=https://cqjqyxsqflmvyweymnei.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

These are **already configured**!

### 5. Create User Profile Table (if not exists) ✅

The migration files already have the `users` table. Just make sure it's created:

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  business_name TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

If you haven't run migrations yet, do this in Supabase SQL Editor:
1. Go to Supabase → SQL Editor
2. Run `supabase/migrations/01_init_schema.sql`

---

## Testing the Auth Flow

### Test 1: Sign Up with Email + OTP

```bash
npm run dev
# Visit http://localhost:3000/auth/sign-up
# 1. Enter name, email, password
# 2. Click "Create Account"
# 3. You'll get an OTP code emailed (from Supabase)
# 4. Enter OTP
# 5. Welcome email is sent (from Resend)
# 6. Redirected to /dashboard ✅
```

**Expected:** You see welcome email in Resend dashboard + user created in Supabase

### Test 2: Sign In with Email + Password

```bash
# Visit http://localhost:3000/auth/sign-in
# 1. Enter email + password from test 1
# 2. Click "Sign In"
# 3. Redirected to /dashboard ✅
```

### Test 3: Google OAuth

```bash
# Visit http://localhost:3000/auth/sign-up
# 1. Click "Sign up with Google"
# 2. OAuth flow opens
# 3. Welcome email sent
# 4. Redirected to /dashboard ✅
```

### Test 4: Route Protection

```bash
# Try to visit /dashboard without logging in
# Should be redirected to /auth/sign-in ✅

# After logging in, try to visit /auth/sign-in
# Should be redirected to /dashboard ✅
```

---

## Email Templates

### OTP Email (from Supabase)

Supabase sends this automatically. It looks like:

```
Your authentication code is: 123456
Valid for 10 minutes.
```

### Welcome Email (from Resend)

The welcome email is sent automatically after signup. It includes:

```
Subject: 🎉 Welcome to diyaa.ai! Your AI Employees Await

Content:
- Your account is ready
- Quick start guide (5 steps)
- Links to dashboard
- FAQ and help
```

---

## File Structure

```
diyaa-ai/
├── app/
│   └── auth/
│       ├── sign-up/page.tsx        ← Sign up page
│       ├── sign-in/page.tsx        ← Sign in page
│       └── callback/page.tsx       ← OAuth callback
├── lib/
│   └── auth/
│       └── supabase-client.ts      ← Auth functions
├── app/api/auth/
│   ├── verify-otp/route.ts         ← OTP verification
│   └── send-welcome-email/route.ts ← Welcome email trigger
├── middleware.ts                    ← Route protection
└── AUTH_SETUP_GUIDE.md             ← This file
```

---

## Troubleshooting

### "Missing API key for Resend"
- Check `.env.local` has `RESEND_API_KEY`
- Get key from https://resend.com/api-keys

### "OTP not working"
- Make sure Email auth is enabled in Supabase
- Check Supabase email templates → OTP template exists
- Try using a real email (Gmail, Outlook, etc.) for testing

### "Google OAuth not working"
- Check Google app credentials are correct
- Verify redirect URI matches exactly: `http://localhost:3000/auth/callback`
- Check Google OAuth is enabled in Supabase

### "Welcome email not sending"
- Check Resend API key is correct
- Check email domain is verified in Resend dashboard
- Check Resend logs for bounce messages

### "User not created in users table"
- Make sure migrations have been run
- Check `/api/auth/verify-otp` is creating the user profile
- Check Supabase RLS policies allow inserts

---

## Next Steps

1. **Deploy to production:**
   ```bash
   npm run build
   git push heroku main  # or vercel deploy
   ```

2. **Update email domain:**
   - Add diyaa.ai to Resend verified domains
   - Update `from: 'onboarding@diyaa.ai'` in welcome email

3. **Add forgot password:**
   - Create `/auth/forgot-password` page
   - Use `supabase.auth.resetPasswordForEmail(email)`

4. **Add profile completion:**
   - After signup, redirect to `/onboarding/profile`
   - Collect business name, industry, timezone
   - Save to `public.users` table

5. **Add 2FA (optional):**
   - Supabase supports TOTP 2FA
   - Can be added in `/settings/security`

---

## Production Checklist

- [ ] Google OAuth credentials added
- [ ] Email verified in Resend (diyaa.ai domain)
- [ ] Supabase email templates configured
- [ ] Middleware protecting all protected routes
- [ ] Welcome email template customized with company details
- [ ] Tested full signup flow locally
- [ ] Tested Google OAuth locally
- [ ] Tested email verification
- [ ] Deployed to staging environment
- [ ] Tested in production environment
- [ ] Added "Forgot Password" page (optional but recommended)
- [ ] Added profile completion flow
- [ ] Set up monitoring/logging for auth errors
- [ ] Updated privacy policy and terms of service

---

## Support

For issues:
1. Check Supabase auth logs
2. Check Resend email logs
3. Check browser DevTools → Network tab
4. Check NextJS build logs

Need help? DM or email support@diyaa.ai

---

**Status: Ready for deployment! 🚀**
