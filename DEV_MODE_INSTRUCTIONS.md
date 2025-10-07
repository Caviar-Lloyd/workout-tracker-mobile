# Dev Mode Setup Instructions

## What This Does
- Allows you to test in Expo Go without authentication
- Bypasses auth checks for development
- Automatically logs you in with a dev account

## Setup Steps

### 1. Create Dev Account in Supabase

Run this SQL in your Supabase SQL Editor:

```sql
-- Create dev test account (if using email whitelist)
INSERT INTO allowed_users (email, is_active)
VALUES ('dev@eccentriciron.com', true)
ON CONFLICT (email) DO NOTHING;
```

### 2. Add Dev Mode to AuthScreen.tsx

Add this import at the top:
```typescript
import { DEV_MODE, autoDevLogin } from '../utils/devMode';
```

Add this useEffect after the state declarations (around line 40):
```typescript
React.useEffect(() => {
  if (DEV_MODE) {
    autoDevLogin();
  }
}, []);
```

Add a dev mode indicator in the JSX (around line 176, after the title):
```typescript
{DEV_MODE && (
  <Text style={{ color: '#ff6b6b', textAlign: 'center', marginBottom: 16 }}>
    🔧 DEV MODE - Auto-Login Enabled
  </Text>
)}
```

### 3. Usage

**For Development (Expo Go):**
- Set `.env`: `EXPO_PUBLIC_DEV_MODE=true`
- App auto-logs in with `dev@eccentriciron.com`
- No auth required!

**For Production Build:**
- Set `.env`: `EXPO_PUBLIC_DEV_MODE=false`
- Full authentication required
- Email whitelist enforced

### 4. Building for Production

When ready to build the standalone APK:

```bash
cd workout-tracker-mobile

# Make sure dev mode is OFF
# Edit .env and set: EXPO_PUBLIC_DEV_MODE=false

# Login to EAS
eas login

# Build Android APK
eas build --platform android --profile preview

# Download APK and share with testers
```

### 5. Platform-Specific Code

You can customize for different platforms:

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Desktop web - show different layout
} else if (Platform.OS === 'ios') {
  // iPhone - iOS specific features
} else if (Platform.OS === 'android') {
  // Android - Android specific features
}
```

## Workflow Summary

1. **Develop**: Use Expo Go with `DEV_MODE=true`
2. **Test**: Auth bypassed, fast iteration
3. **Build**: Set `DEV_MODE=false`, run `eas build`
4. **Update**: Run `eas update` to push changes (no reinstall!)

## Files Created

- `/utils/devMode.ts` - Dev mode utilities
- `eas.json` - Build configuration
- `.env` - Added `EXPO_PUBLIC_DEV_MODE=true`
