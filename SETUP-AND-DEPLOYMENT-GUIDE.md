# Workout Tracker Mobile - Setup & Deployment Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Development Workflow](#development-workflow)
4. [Making Changes](#making-changes)
5. [Deployment Process](#deployment-process)
6. [Rollback Procedures](#rollback-procedures)
7. [Project Structure](#project-structure)
8. [Common Tasks](#common-tasks)

---

## 🎯 Project Overview

**Workout Tracker Mobile** is a React Native (Expo) fitness tracking application with:
- Color-coded calendar showing workout weeks
- Rest day selection and scheduling
- 3-column workout logging interface
- Supabase backend for data storage
- Deployed on Vercel as a web app

**Live URL:** https://app.eccentriciron.com

---

## 🛠️ Technology Stack

- **Framework:** React Native (Expo)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **Version Control:** GitHub
- **Styling:** React Native StyleSheet

---

## 💻 Development Workflow

### Initial Setup (One-Time)

```bash
# Navigate to project
cd "C:\Users\Carver\OneDrive\Desktop\CYA- Projects\Workout Tracker\workout-tracker-mobile"

# Install dependencies
npm install

# Set up environment variables
# Create .env file with:
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Testing Locally

```bash
# Start Expo dev server
npx expo start

# Or for web only
npx expo start --web
```

---

## ✏️ Making Changes

### ⚠️ IMPORTANT RULES:

1. **ALWAYS edit existing files** - Never create backup files
2. **Never create** `File.tsx.backup`, `File.tsx.old`, `File_new.tsx`, etc.
3. **Commit frequently** to Git (your backup system)
4. **Test locally** before pushing

### Workflow for Changes:

```bash
# 1. Make your changes in VSCode
# Edit the existing file (e.g., DashboardScreen.tsx)

# 2. Test locally (optional but recommended)
npx expo start --web

# 3. Stage your changes
git add -A

# 4. Commit with descriptive message
git commit -m "Brief description of what you changed"

# 5. Push to GitHub (auto-deploys to Vercel!)
git push
```

### Example Commit Messages:
- ✅ "Update calendar colors for better visibility"
- ✅ "Fix menu button positioning on mobile"
- ✅ "Add new exercise to workout template"
- ❌ "changes"
- ❌ "update"

---

## 🚀 Deployment Process

### Automatic Deployment (Recommended)

Once GitHub is connected to Vercel, every push triggers automatic deployment:

```bash
git push
# ↓
# GitHub receives push
# ↓
# Vercel detects changes
# ↓
# Vercel builds and deploys
# ↓
# Live at app.eccentriciron.com (1-2 minutes)
```

### Manual Deployment (if needed)

```bash
npx vercel --prod
```

### Checking Deployment Status

1. Visit: https://vercel.com/pythonhand/workout-tracker-mobile
2. Click "Deployments" tab
3. See real-time build status

---

## ⏮️ Rollback Procedures

### If you pushed bad code:

**Option 1: Promote Previous Deployment (Fastest)**
1. Go to https://vercel.com/pythonhand/workout-tracker-mobile
2. Click "Deployments"
3. Find the last working deployment
4. Click "..." menu → "Promote to Production"
5. Done! (30 seconds)

**Option 2: Git Revert (More Permanent)**
```bash
# See recent commits
git log --oneline -10

# Revert to specific commit
git revert <commit-hash>

# Push the revert
git push
```

**Option 3: Hard Reset (Use with Caution)**
```bash
# Reset to previous commit
git reset --hard HEAD~1

# Force push (overwrites remote)
git push --force
```

---

## 📁 Project Structure

```
workout-tracker-mobile/
├── App.tsx                 # Main app entry, navigation, menu
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── .env                   # Environment variables (not in Git)
├── .gitignore            # Files to ignore
│
├── screens/              # Main app screens
│   ├── DashboardScreen.tsx    # Home screen with calendar
│   ├── WorkoutScreen.tsx      # Workout logging interface
│   ├── ProgramScreen.tsx      # Exercise library
│   ├── ProgressScreen.tsx     # Progress tracking
│   ├── ClientsScreen.tsx      # Coach view: client list
│   ├── ClientDetailScreen.tsx # Coach view: client details
│   └── AuthScreen.tsx         # Login/signup
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Supabase connection
│   │   ├── workout-service.ts # Workout data functions
│   │   └── user-service.ts    # User data functions
│
├── components/
│   └── ParticleBackground.tsx # Animated background
│
├── types/
│   └── workout.ts             # TypeScript type definitions
│
└── utils/                     # Utility functions
```

---

## 🔧 Common Tasks

### Updating Calendar Colors

**File:** `screens/DashboardScreen.tsx`

```typescript
// Lines 42-50
const WEEK_COLORS: Record<number, string> = {
  1: '#FF6B6B', // Red
  2: '#4ECDC4', // Teal
  3: '#FFD93D', // Yellow
  4: '#95E1D3', // Mint
  5: '#F38181', // Pink
  6: '#AA96DA', // Purple
};
```

**Commit:**
```bash
git add screens/DashboardScreen.tsx
git commit -m "Update week colors on calendar"
git push
```

---

### Changing Workout Names

**File:** `screens/DashboardScreen.tsx` or `screens/WorkoutScreen.tsx`

```typescript
// Lines 33-40
const WORKOUT_NAMES: Record<number, string> = {
  1: 'Chest, Triceps, Abs - Multi-Joint',
  2: 'Shoulders, Legs, Calves - Multi-Joint',
  // ... etc
};
```

---

### Modifying Menu Button Position

**File:** `App.tsx`

Look for the `menuButton` style around line 530:

```typescript
menuButton: {
  position: Platform.OS === 'web' ? 'fixed' : 'absolute',
  bottom: Platform.OS === 'web' ? 10 : 20 + insets.bottom + 10,
  // ... adjust these values
}
```

---

### Adding a New Screen

1. Create file in `screens/` folder: `NewScreen.tsx`
2. Add to navigation in `App.tsx`:
```typescript
<Stack.Screen name="NewScreen" component={NewScreen} />
```
3. Navigate to it from other screens:
```typescript
navigation.navigate('NewScreen');
```

---

## 🐛 Troubleshooting

### Build Fails on Vercel
- Check Vercel deployment logs
- Verify all dependencies in `package.json`
- Ensure no TypeScript errors: `npx tsc --noEmit`

### Changes Not Showing Up
- Clear browser cache (Ctrl+Shift+R)
- Check Vercel deployment status
- Verify correct branch is deployed

### Supabase Connection Issues
- Check `.env` file has correct credentials
- Verify Supabase project is active
- Check network/firewall settings

### Old Supabase URL Being Referenced After Updates

**Problem:** App continues using old Supabase URL even after updating code and environment variables. Changes revert after EAS builds/updates.

**Root Cause:**
- Old environment variables stored in EAS dashboard override local configuration
- EAS updates can only update JavaScript code, NOT environment variables
- Environment variables are baked into builds at build time
- Apps with same runtime version share the same compiled environment variables

**Solution:**

1. **Delete Old EAS Environment Variables**
   - Visit: https://expo.dev/accounts/[your-account]/projects/[project-name]/environment-variables
   - Delete ALL old environment variables from EAS dashboard
   - Particularly look for variables created days/weeks ago
   - Delete these for each environment (preview, production):
     - `EXPO_PUBLIC_SUPABASE_URL`
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
     - `EXPO_PUBLIC_DEV_MODE`

2. **Update Version Number in app.json**
   ```json
   {
     "expo": {
       "version": "1.0.X"  // Increment this (e.g., 1.0.7 → 1.0.8)
     }
   }
   ```
   This creates a new runtime version, separating from old builds.

3. **Ensure eas.json Has Correct Values**
   ```json
   {
     "build": {
       "preview": {
         "env": {
           "EXPO_PUBLIC_SUPABASE_URL": "https://your-correct-url.supabase.co",
           "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-correct-key"
         }
       }
     }
   }
   ```

4. **Create Fresh Build**
   ```bash
   npx eas-cli build --platform android --profile preview
   ```

5. **Verify Build Logs Show Correct Configuration**
   Look for this line in build output:
   ```
   No environment variables with visibility "Plain text" and "Sensitive"
   found for the "preview" environment on EAS
   ```
   This confirms old variables are deleted and only eas.json is used.

**Prevention for Future Builds:**
- NEVER create EAS environment variables in the dashboard
- ALWAYS use eas.json for environment configuration
- Increment app version number for breaking changes
- Document which runtime version has which environment variables

**Note on EXPO_PUBLIC Variables:**
- Variables prefixed with `EXPO_PUBLIC_` are NOT secret
- They're embedded in compiled JavaScript (visible to clients)
- Supabase ANON_KEY is designed to be public (Row Level Security protects data)
- Use service_role_key (not exposed) for admin operations

---

## 📞 Support & Resources

- **GitHub Repo:** https://github.com/Caviar-Lloyd/workout-tracker-mobile
- **Vercel Dashboard:** https://vercel.com/pythonhand/workout-tracker-mobile
- **Live App:** https://app.eccentriciron.com
- **Expo Docs:** https://docs.expo.dev/
- **Supabase Docs:** https://supabase.com/docs

---

## 🎯 Quick Reference Card

| Task | Command |
|------|---------|
| Start dev server | `npx expo start` |
| Test on web | `npx expo start --web` |
| Commit changes | `git add -A && git commit -m "message"` |
| Deploy to production | `git push` |
| View deployments | Visit Vercel dashboard |
| Rollback | Promote previous deployment in Vercel |

---

**Last Updated:** October 11, 2025
**Version:** 1.0.0
