# Supabase OAuth Setup for app.eccentriciron.com

## Add These Redirect URLs

Go to: https://supabase.com/dashboard/project/aqhlshwlwxvutbzzhnpa/auth/url-configuration

### Redirect URLs to Add:

1. `https://app.eccentriciron.com`
2. `https://app.eccentriciron.com/**`
3. `http://localhost:8086` (for local development)

## Steps:

1. Click **"Add Redirect URL"**
2. Paste each URL above (one at a time)
3. Click **Save**

## Test:

After adding the URLs, go to **https://app.eccentriciron.com** and click the Google logo to sign in.

---

## If Google OAuth Credentials Need Updating:

Go to: https://supabase.com/dashboard/project/aqhlshwlwxvutbzzhnpa/auth/providers

Make sure the Google OAuth **Authorized redirect URI** in Google Cloud Console includes:
- `https://aqhlshwlwxvutbzzhnpa.supabase.co/auth/v1/callback`
