# Build Information - v2.0.0

## Build Details
- **Version:** 2.0.0
- **Date:** October 16, 2025
- **Build Type:** Baseline Build (Baked-in fixes)
- **Runtime Version:** 2.0.0
- **Platform:** Android
- **Profile:** preview
- **Channel:** preview

## What's Included

### Base Features (from GitHub v1.1.9)
- ✅ Logo displays correctly
- ✅ OAuth authentication with deep linking (intentFilters configured)
- ✅ Profile picture upload functionality
- ✅ All core screens and navigation
- ✅ Supabase integration
- ✅ Workout tracking system

### New Fixes Baked Into This Build
1. **Client Email Fix** (WorkoutScreen.tsx)
   - Fixed: Workouts now save with CLIENT's email instead of trainer's email
   - When a trainer logs a workout for a client, it correctly attributes it to the client

2. **Profile Pictures in My Clients List** (ClientsScreen.tsx)
   - Fixed: Profile pictures now display in the My Clients page list view
   - Previously only showed initials, now shows actual profile photo

3. **Custom Workout Builder Navigation** (App.tsx, CustomWorkoutBuilderScreen.tsx)
   - Fixed: Menu now navigates to Custom Workout Builder screen
   - Works both as standalone screen (from menu) and modal (from client profile)
   - Previously showed "coming soon" alert

4. **Workout Progression** (workout-service.ts)
   - Fixed: Next workout calculation now looks at ALL workouts, not just completed ones
   - Correctly shows next workout in sequence after logging any workout

## Build Instructions
```bash
cd c:/temp-build/workout-tracker-mobile-github
CI=1 npx eas-cli build --platform android --profile preview --non-interactive
```

## Download Link
*Will be added after build completes*

## Testing Checklist
- [ ] Logo displays on app launch
- [ ] OAuth stays in app (doesn't redirect to browser)
- [ ] Profile pictures show in My Clients list
- [ ] Client email logs correctly (not trainer email)
- [ ] Custom Workout Builder opens from menu
- [ ] Workout progression shows correct next workout

## Notes
- This build is the new baseline that combines working GitHub v1.1.9 code with all 4 fixes
- All future EAS updates will be based on this v2.0.0 runtime version
- intentFilters are properly configured for OAuth deep linking
