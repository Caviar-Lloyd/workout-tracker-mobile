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

---

## Recent UI Improvements (Oct 7, 2025)

### Holographic Menu Bar with Animated Tooltip
**File:** `App.tsx`

**Changes Made:**
1. **Holographic/Glassmorphism Effect on Menu Bar**
   - Added glow layer (`menuBarGlow`) behind menu bar with cyan shadow
   - Updated slide-up menu with frosted glass effect (backdrop blur on web)
   - Increased border width to 2px with brighter cyan color
   - Added soft cyan shadow around menu for elevated holographic look

2. **Animated Arrow Tooltip**
   - Created bouncing arrow animation pointing up at menu bar
   - Added "Menu" text label below arrow with glowing cyan color
   - Tooltip auto-hides after 5 seconds with fade animation
   - Dismisses on user interaction when menu is opened
   - Everything contained within bounds - positioned above menu bar

3. **Desktop Max-Width Constraints**
   - Added `contentWrapper` with `maxWidth: 768px` for web platform
   - Content stays mobile-sized and centered on desktop
   - Background still fills full screen width
   - Uses `alignSelf: 'center'` for horizontal centering

**New Components Added:**
- `ArrowUpIcon` SVG component
- Animation refs: `bounceAnim`, `fadeAnim`
- State: `showTooltip`

**New Styles Added:**
- `tooltipContainer` - Positions animated tooltip
- `tooltipText` - Glowing cyan text styling
- `menuBarGlow` - Holographic glow layer
- `contentWrapper` - Desktop max-width container
- Updated `menuBar` - Added cyan shadow
- Updated `slideMenu` - Added glassmorphism with backdrop filter

**Issues Resolved:**
- Menu bar looked too similar to phone's native bottom bar
- No visual indication that the bar was interactive
- Content stretched infinitely on desktop view
- Users weren't aware the menu existed

**Cross-Platform Compatibility:**
- Backdrop filter only applies on web (Platform.OS === 'web')
- Max-width constraint only applies on web
- Animations work on iOS, Android, and web
