# Channel Connections Setup Guide

This document explains how to set up OAuth integrations for WhatsApp, Gmail, and Telegram.

## Overview

The channel connection system allows users to connect:
- **Gmail** - Send/read emails via Google OAuth
- **WhatsApp** - Send messages via Meta/WhatsApp Business API OAuth
- **Telegram** - Send messages via Telegram bot token

## Database Setup

First, run the migration to create the `channel_credentials` table:

```bash
# Using Supabase CLI
supabase db push migrations/add_channel_credentials.sql

# Or manually in Supabase SQL Editor
# Copy contents of migrations/add_channel_credentials.sql and run
```

## 1. Gmail (Google OAuth)

### Setup Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable these APIs:
   - Gmail API
   - Google OAuth 2.0

4. Create OAuth 2.0 Credential:
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Choose "Web application"
   - Add Authorized redirect URIs:
     - `http://localhost:3000/api/auth/channels/gmail/callback` (development)
     - `https://yourdomain.com/api/auth/channels/gmail/callback` (production)

5. Copy the Client ID and Client Secret
6. Add to `.env`:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

## 2. WhatsApp (Meta/Facebook OAuth)

### Setup Steps:

1. Go to [Meta Developers](https://developers.facebook.com)
2. Create an App or use existing
3. Add "WhatsApp Business API" product
4. Go to Settings → Basic, copy:
   - App ID
   - App Secret

5. Go to Settings → Basic → Add Platform → Website
6. Add App Domains: `localhost:3000`, `yourdomain.com`

7. In WhatsApp Settings, add Valid OAuth Redirect URIs:
   - `http://localhost:3000/api/auth/channels/whatsapp/callback` (development)
   - `https://yourdomain.com/api/auth/channels/whatsapp/callback` (production)

8. Add to `.env`:
   ```
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   ```

9. Test with your Meta Business Account (needs to own a WhatsApp Business Account)

## 3. Telegram

### Setup Steps:

1. Go to [@BotFather](https://t.me/botfather) on Telegram
2. Create new bot: `/newbot`
3. Follow prompts, get your Bot Token
4. Users enter this token manually in the dashboard
5. Token is encrypted and stored in database

## Testing

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Go to Agent Dashboard → Office → Right sidebar
3. Click "Connect" on any channel
4. You'll be redirected to the OAuth provider
5. After authorization, token is auto-saved
6. Channel shows as "Connected" ✅

## Disconnecting

Users can click "Disconnect" to revoke access. The token is deleted from the database.

## File Locations

- **Component**: `components/office/ChannelConnections.tsx`
- **OAuth Routes**:
  - Authorization: `app/api/auth/channels/[provider]/authorize/route.ts`
  - Callbacks:
    - `app/api/auth/channels/gmail/callback/route.ts`
    - `app/api/auth/channels/whatsapp/callback/route.ts`
- **API Routes**:
  - Status: `app/api/channels/status/route.ts`
  - Disconnect: `app/api/channels/[channel]/disconnect/route.ts`
- **Database**: `channel_credentials` table (via migration)

## Security Notes

- Tokens are stored in Supabase with Row Level Security (RLS)
- Users can only access their own tokens
- Tokens should be encrypted at rest (recommend implementing encryption)
- Refresh tokens are saved for Gmail (used to get new access tokens)
- Expires_at tracks token expiration

## Next Steps

1. Fill in `.env` with your OAuth credentials
2. Run database migration
3. Test the flow end-to-end
4. Deploy to production with your production OAuth URIs
