# Deployment Strategy - Preventing Old Build Issues

## The Problem You Experienced

You made code changes, but the app didn't reflect them because:
1. The **build** was created BEFORE the code changes
2. **EAS Updates** were published AFTER, but didn't download reliably
3. Multiple runtime versions (1.0.7, 1.0.8, 1.0.9) caused confusion

## The Solution: Clear Deployment Workflow

### Option 1: New Build (Safest, Takes 15-20 min)

**When to use:**
- Major changes
- Database schema changes
- Native code changes (permissions, navigation, etc.)
- You want 100% certainty the changes are included

**Steps:**
```bash
# 1. Make your code changes
# 2. Increment version in app.json
"version": "1.0.X"  # Increment the last number

# 3. Create new build
cd /c/temp-build/workout-tracker-mobile
npx eas-cli build --platform android --profile preview --non-interactive

# 4. Wait 15-20 minutes
# 5. Download and install the new APK
```

**Pros:**
- ✅ Changes guaranteed to be included
- ✅ New runtime version prevents confusion
- ✅ No reliance on update mechanism

**Cons:**
- ❌ Takes 15-20 minutes
- ❌ Requires manual APK download/install

---

### Option 2: EAS Update (Fast, Takes 2-3 min)

**When to use:**
- Small JavaScript/TypeScript changes only
- UI tweaks, bug fixes
- No database or native changes
- You're confident in which build version users have

**Steps:**
```bash
# 1. Make your code changes
# 2. Ensure app.json version matches the build users have installed
# 3. Publish update
cd /c/temp-build/workout-tracker-mobile
npx eas-cli update --branch preview --message "Description of changes"

# 4. Users close and reopen app to get update (usually within 30 seconds)
```

**Pros:**
- ✅ Fast (2-3 minutes)
- ✅ No manual download required
- ✅ Works for all users on that runtime version

**Cons:**
- ❌ Only works for JavaScript changes
- ❌ Requires exact runtime version match
- ❌ Can fail silently if update checking is broken
- ❌ Build must already have the code changes (if build was created before code changes, update won't help!)

---

## Best Practices to Avoid Confusion

### 1. **One Build Per Version**
- After incrementing to 1.0.9, don't go back to 1.0.8
- Always move forward: 1.0.8 → 1.0.9 → 1.1.0
- Never reuse version numbers

### 2. **Know Which Build You're Running**
Before making changes, check:
```bash
# See latest build
npx eas-cli build:list --platform android --limit 1

# Check what version is in app.json
cat app.json | grep version
```

### 3. **Match Version to Code**
- If app.json says "1.0.9", your code should be at the state you want for 1.0.9
- Don't publish an update for 1.0.9 if the 1.0.9 build doesn't exist yet!

### 4. **Clean Workflow**
```bash
# Make changes
# ↓
# Increment version in app.json
# ↓
# Create build
npx eas-cli build --platform android --profile preview --non-interactive
# ↓
# Wait for build to finish
# ↓
# Test the build
# ↓
# If you find a bug and need to fix it:
# → Either: Publish an update (if minor JS change)
# → Or: Increment to 1.0.10 and create new build (if major)
```

---

## Understanding Runtime Versions

**What is a runtime version?**
- It's derived from app.json `"version": "1.0.9"`
- It represents the native code version (Android/iOS binaries)
- EAS Updates ONLY work for apps with matching runtime versions

**Example:**
- Build A: Runtime 1.0.8
- Build B: Runtime 1.0.9
- Update published for 1.0.9
- **Build A will NOT receive the update** (different runtime version)
- **Build B will receive the update** (matching runtime version)

---

## Troubleshooting: "My changes aren't showing up!"

### Step 1: Check which build you have installed
Look at the app - it should show version somewhere, or check:
```bash
npx eas-cli build:list --platform android --limit 3
# Look at the most recent "finished" build
```

### Step 2: Check if that build has your code changes
Look at the "Started at" timestamp:
- If build was created BEFORE you made code changes → Build doesn't have changes
- If build was created AFTER code changes → Build should have changes

### Step 3: Decide your approach
- **If build DOESN'T have changes:** Create a new build with incremented version
- **If build HAS changes but they're not showing:**
  - Try uninstalling and reinstalling the APK
  - Check database to see if data is the issue (not code)
  - Look for console.log errors in the app

---

## Summary

**Simple Rule:**
- **Big changes or confused about versions?** → Create new build (increment version)
- **Tiny JavaScript tweak on existing build?** → Publish update

**Your concern about "old builds interfering":**
- Old builds DON'T interfere
- The issue was: You published updates for a build that didn't have the code changes yet
- Solution: Always create a new build AFTER making code changes, with incremented version

---

**Last Updated:** October 14, 2025
**Current Version:** 1.0.9 (in progress)
**Next Version:** 1.1.0 (when ready for next changes)
