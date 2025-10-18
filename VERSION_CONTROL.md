# VERSION CONTROL SYSTEM

**Last Updated:** 2025-10-17
**Purpose:** Granular version tracking for builds and updates with easy rollback capability

---

## 📌 OVERVIEW

This system separates **build versions** from **update versions** for maximum flexibility and easy rollback.

**Key Concept:**
- **app.json version** = Runtime version for builds (stays constant during EAS updates)
- **Git tags** = Track every individual change (builds AND updates)

---

## 🔢 VERSION NUMBER FORMAT

### **Build Versions** (Major.Minor.Patch)
- **Format:** `X.Y.0` (e.g., `2.4.0`, `2.5.0`, `3.0.0`)
- **Used For:** Full app builds created with EAS Build
- **Stored In:** app.json `"version"` field
- **When to Increment:** After accumulating 5-6 verified EAS updates
- **Git Tag Format:** `vX.Y.0` (e.g., `v2.4.0`)

**Examples:**
- `2.4.0` → Build with workout builder features
- `2.5.0` → Build with client management features
- `3.0.0` → Major redesign or breaking changes

### **Update Versions** (Build.Subversion)
- **Format:** `X.Y.0.Z` (e.g., `2.4.0.1`, `2.4.0.2`, `2.4.0.3`)
- **Used For:** Individual EAS updates (over-the-air)
- **Stored In:** Git tags ONLY (not in app.json)
- **When to Increment:** After each verified EAS update
- **Git Tag Format:** `vX.Y.0.Z` (e.g., `v2.4.0.1`)

**Examples:**
- `2.4.0.1` → Fix workout tracker X button (EAS update)
- `2.4.0.2` → Add profile picture upload (EAS update)
- `2.4.0.3` → Fix menu navigation bug (EAS update)

---

## 🎯 HOW IT WORKS

```
BUILD v2.4.0
├─ app.json version: "2.4.0"
├─ Git tag: v2.4.0
├─ Runtime version: 2.4.0
└─ Deployed via: EAS Build
    ↓
    ├── EAS Update v2.4.0.1
    │   ├─ app.json version: "2.4.0" (UNCHANGED)
    │   ├─ Git tag: v2.4.0.1
    │   ├─ Runtime version: 2.4.0 (UNCHANGED)
    │   └─ Deployed via: EAS Update
    │
    ├── EAS Update v2.4.0.2
    │   ├─ app.json version: "2.4.0" (UNCHANGED)
    │   ├─ Git tag: v2.4.0.2
    │   ├─ Runtime version: 2.4.0 (UNCHANGED)
    │   └─ Deployed via: EAS Update
    │
    ├── EAS Update v2.4.0.3
    │   ├─ app.json version: "2.4.0" (UNCHANGED)
    │   ├─ Git tag: v2.4.0.3
    │   ├─ Runtime version: 2.4.0 (UNCHANGED)
    │   └─ Deployed via: EAS Update
    │
    └── ... (up to v2.4.0.5 or v2.4.0.6)
        ↓
BUILD v2.5.0
├─ app.json version: "2.5.0" (CHANGED)
├─ Git tag: v2.5.0
├─ Runtime version: 2.5.0 (CHANGED)
└─ Deployed via: EAS Build
    ↓
    ├── EAS Update v2.5.0.1
    │   ├─ app.json version: "2.5.0" (UNCHANGED)
    │   └─ Git tag: v2.5.0.1
    └── ...
```

---

## 📋 KEY RULES

### Rule 1: app.json Version
✅ **ONLY change for builds** (e.g., 2.4.0 → 2.5.0)
❌ **NEVER change for EAS updates** (keep at 2.4.0)

### Rule 2: Git Tags
✅ **Tag every build** (v2.4.0, v2.5.0)
✅ **Tag every EAS update** (v2.4.0.1, v2.4.0.2)
✅ **Always push tags** (`git push --tags`)

### Rule 3: Runtime Version
✅ **Equals app.json version** (set in app.json: `"runtimeVersion": {"policy": "appVersion"}`)
✅ **All EAS updates for a build share the same runtime** (e.g., all 2.4.0.x updates have runtime 2.4.0)

### Rule 4: Update Frequency
✅ **Deploy EAS updates frequently** (1-2 per day is fine)
✅ **Create new build after 5-6 updates** (or weekly/bi-weekly)

---

## 🚀 COMPLETE WORKFLOW

### STEP 1: Create New Build (Baseline)

```bash
cd c:/temp-build/workout-tracker-mobile-github

# 1. Update app.json version
# Edit app.json: "version": "2.4.0"

# 2. Commit with descriptive message
git add app.json [other-files]
git commit -m "v2.4.0: Workout Builder features baseline

Features included:
- Custom workout builder screen
- Exercise tracking
- Client assignment

🏗️ BUILD BASELINE"

# 3. Create and push git tag
git tag v2.4.0 -m "Build v2.4.0 - Workout Builder baseline"
git push origin main
git push origin v2.4.0

# 4. Create EAS build
CI=1 npx eas-cli build --platform android --profile preview --non-interactive

# 5. Wait for build to complete (~20 minutes)
# 6. Download and install on device
# 7. Test thoroughly
```

---

### STEP 2: Deploy EAS Update

```bash
cd c:/temp-build/workout-tracker-mobile-github

# 1. Make code changes
# Edit files: screens/CustomWorkoutBuilderScreen.tsx

# 2. Verify app.json version is UNCHANGED (still "2.4.0")
grep '"version"' app.json
# Should show: "version": "2.4.0"

# 3. Deploy EAS update for testing
CI=1 npx eas-cli update --branch preview --platform android \
  --message "Fix workout tracker X button navigation"

# 4. WAIT FOR USER TO TEST ⏳
#    - User force-quits app
#    - User reopens app (update downloads automatically)
#    - User tests the fix
```

---

### STEP 3: Tag Verified Update

```bash
# ✅ USER CONFIRMS: "It works!"

# 1. Commit the changes
git add screens/CustomWorkoutBuilderScreen.tsx
git commit -m "fix: Workout tracker X button navigation

- Fixed handleClose to use navigation.goBack()
- Added fallback to navHook for edge cases
- X button now properly navigates back to previous screen

✅ VERIFIED AND WORKING"

# 2. Tag as v2.4.0.1 (first update to build 2.4.0)
git tag v2.4.0.1 -m "EAS Update v2.4.0.1: Fix workout tracker X button"

# 3. Push commit and tag
git push origin main
git push origin v2.4.0.1

# ✅ Now v2.4.0.1 is in GitHub as a rollback point
```

---

### STEP 4: Continue with More Updates

```bash
# Second fix - app.json STILL at "2.4.0"
# Make changes, deploy EAS update, test, commit

git add components/ProfilePicture.tsx
git commit -m "feat: Add profile picture upload

- Implemented camera/gallery picker
- Image compression and upload to Supabase storage
- Display uploaded image in profile

✅ VERIFIED AND WORKING"

git tag v2.4.0.2 -m "EAS Update v2.4.0.2: Add profile picture upload"
git push origin main && git push origin v2.4.0.2

# Third fix - tag as v2.4.0.3
git tag v2.4.0.3 -m "EAS Update v2.4.0.3: Fix menu navigation"
git push origin v2.4.0.3

# Fourth fix - tag as v2.4.0.4
git tag v2.4.0.4 -m "EAS Update v2.4.0.4: Add error tracking"
git push origin v2.4.0.4

# Fifth fix - tag as v2.4.0.5
git tag v2.4.0.5 -m "EAS Update v2.4.0.5: Performance improvements"
git push origin v2.4.0.5

# After 5-6 updates, ready for NEW BUILD
```

---

### STEP 5: Create Next Build

```bash
cd c:/temp-build/workout-tracker-mobile-github

# 1. Update app.json version to 2.5.0
# Edit app.json: "version": "2.5.0"

# 2. Commit with summary of all updates
git add app.json
git commit -m "v2.5.0: Client Management features baseline

Includes all verified updates from v2.4.0.1 through v2.4.0.5:
- Fixed workout tracker X button (v2.4.0.1)
- Added profile picture upload (v2.4.0.2)
- Fixed menu navigation (v2.4.0.3)
- Added error tracking (v2.4.0.4)
- Performance improvements (v2.4.0.5)

New features in this build:
- Client management dashboard
- Workout assignment system
- Progress tracking charts

🏗️ BUILD BASELINE"

# 3. Tag as v2.5.0
git tag v2.5.0 -m "Build v2.5.0 - Client Management baseline"
git push origin main
git push origin v2.5.0

# 4. Create new build
CI=1 npx eas-cli build --platform android --profile preview --non-interactive

# 5. Cycle repeats for v2.5.0.1, v2.5.0.2, etc.
```

---

## 🔄 ROLLBACK SCENARIOS

### Scenario 1: Latest Update Broke Something

```bash
# Currently at v2.4.0.5, but it has a critical bug
# Need to rollback to v2.4.0.4

# 1. Checkout the last working version
git checkout v2.4.0.4

# 2. Create a new branch from that state
git checkout -b rollback-to-v2.4.0.4

# 3. Deploy EAS update from this rollback state
CI=1 npx eas-cli update --branch preview --platform android \
  --message "ROLLBACK to v2.4.0.4 - v2.4.0.5 had critical menu bug"

# 4. Fix the issue from v2.4.0.5
git checkout main
# Make fixes...

# 5. Test and tag as v2.4.0.6
git tag v2.4.0.6 -m "EAS Update v2.4.0.6: Fixed critical menu bug from v2.4.0.5"
git push origin main && git push origin v2.4.0.6
```

---

### Scenario 2: Compare Different Versions

```bash
# See what changed between two updates
git diff v2.4.0.2 v2.4.0.3

# View all changes in a specific update
git show v2.4.0.3

# List all EAS updates for a build
git tag -l "v2.4.0.*"
# Output:
# v2.4.0.1
# v2.4.0.2
# v2.4.0.3
# v2.4.0.4
# v2.4.0.5

# View tag details
git show v2.4.0.3
```

---

### Scenario 3: Revert to Specific Version

```bash
# Temporarily go back to v2.4.0.2 to check something
git checkout v2.4.0.2

# Look around, test locally...

# Return to latest code
git checkout main
```

---

## 📊 QUICK REFERENCE TABLE

| Version | Type | app.json | Git Tag | Runtime | Deployment Method |
|---------|------|----------|---------|---------|-------------------|
| 2.4.0 | Build | "2.4.0" | v2.4.0 | 2.4.0 | EAS Build |
| 2.4.0.1 | Update | "2.4.0" | v2.4.0.1 | 2.4.0 | EAS Update |
| 2.4.0.2 | Update | "2.4.0" | v2.4.0.2 | 2.4.0 | EAS Update |
| 2.4.0.3 | Update | "2.4.0" | v2.4.0.3 | 2.4.0 | EAS Update |
| 2.4.0.4 | Update | "2.4.0" | v2.4.0.4 | 2.4.0 | EAS Update |
| 2.4.0.5 | Update | "2.4.0" | v2.4.0.5 | 2.4.0 | EAS Update |
| 2.5.0 | Build | "2.5.0" | v2.5.0 | 2.5.0 | EAS Build |
| 2.5.0.1 | Update | "2.5.0" | v2.5.0.1 | 2.5.0 | EAS Update |

---

## 🎁 BENEFITS

### ✅ Granular Rollback
- Can revert to ANY specific update (not just builds)
- Example: If v2.4.0.5 breaks, rollback to v2.4.0.4 in seconds

### ✅ Clear History
- Git tags show exact progression: v2.4.0 → v2.4.0.1 → v2.4.0.2 → ...
- Easy to see what changed when

### ✅ Easy Debugging
- Know exactly which update introduced a bug
- Compare versions with `git diff v2.4.0.2 v2.4.0.3`

### ✅ Update Compatibility
- All devices on build 2.4.0 receive ALL 2.4.0.x updates automatically
- Runtime version matching ensures compatibility

### ✅ Short Rollback Distance
- Only need to revert 1-2 updates instead of 5-6 changes
- Each update is a small, isolated change

### ✅ Professional Version Control
- Industry-standard semantic versioning
- Clear separation between builds and patches
- Replicable for future projects

---

## 🛠️ GIT COMMANDS CHEAT SHEET

### Tagging

```bash
# Create tag for current commit
git tag v2.4.0.1 -m "EAS Update: Description"

# Create tag for specific commit
git tag v2.4.0.1 abc1234 -m "EAS Update: Description"

# Push specific tag
git push origin v2.4.0.1

# Push all tags
git push origin --tags

# List all tags
git tag -l

# List tags for specific build
git tag -l "v2.4.0.*"

# View tag details
git show v2.4.0.1

# Delete local tag (if made by mistake)
git tag -d v2.4.0.1

# Delete remote tag (if pushed by mistake)
git push origin --delete v2.4.0.1
```

### Checking Out Versions

```bash
# Temporarily view a specific version
git checkout v2.4.0.3

# Create branch from a specific version
git checkout v2.4.0.3
git checkout -b fix-from-v2.4.0.3

# Return to latest code
git checkout main
```

### Comparing Versions

```bash
# See what changed between versions
git diff v2.4.0.2 v2.4.0.3

# See what changed in a specific commit
git show v2.4.0.3

# View commit history between versions
git log v2.4.0.2..v2.4.0.3

# View files changed between versions
git diff --name-only v2.4.0.2 v2.4.0.3
```

---

## ⚠️ COMMON MISTAKES TO AVOID

### ❌ Mistake 1: Changing app.json for EAS Updates
```bash
# WRONG: Changing version for EAS update
app.json: "version": "2.4.1"  # ❌ Creates new runtime, breaks updates

# RIGHT: Keep version the same
app.json: "version": "2.4.0"  # ✅ Same runtime, updates work
```

### ❌ Mistake 2: Forgetting to Push Tags
```bash
# WRONG: Only pushing commits
git push origin main  # ❌ Tags stay local only

# RIGHT: Push both commits and tags
git push origin main
git push origin v2.4.0.1  # ✅ Tag is now in GitHub
# OR
git push origin main --tags  # ✅ Pushes all tags at once
```

### ❌ Mistake 3: Skipping Tag Numbers
```bash
# WRONG: Jumping from v2.4.0.2 to v2.4.0.5
v2.4.0.1 → v2.4.0.2 → v2.4.0.5  # ❌ Where did .3 and .4 go?

# RIGHT: Sequential numbering
v2.4.0.1 → v2.4.0.2 → v2.4.0.3 → v2.4.0.4  # ✅ Clear progression
```

### ❌ Mistake 4: Not Testing Before Tagging
```bash
# WRONG: Tag immediately after deploy
git tag v2.4.0.1  # ❌ What if it doesn't work?

# RIGHT: Test first, then tag
# 1. Deploy EAS update
# 2. USER TESTS ⏳
# 3. ✅ User confirms it works
# 4. git tag v2.4.0.1  # ✅ Only tag verified code
```

---

## 📝 VERSION CONTROL CHECKLIST

Use this checklist for every update cycle:

### For EAS Updates (v2.4.0.1, v2.4.0.2, etc.)

- [ ] Make code changes in `c:/temp-build/workout-tracker-mobile-github/`
- [ ] Verify `app.json` version is UNCHANGED (still at build version like "2.4.0")
- [ ] Deploy EAS update: `CI=1 npx eas-cli update --branch preview --platform android --message "Description"`
- [ ] Wait for user to test and confirm it works ✅
- [ ] Commit changes with descriptive message
- [ ] Tag with next update number: `git tag v2.4.0.X -m "Description"`
- [ ] Push commit: `git push origin main`
- [ ] Push tag: `git push origin v2.4.0.X`
- [ ] Verify tag appears in GitHub

### For New Builds (v2.5.0, v2.6.0, etc.)

- [ ] Update `app.json` version field (e.g., "2.4.0" → "2.5.0")
- [ ] Commit version change with summary of all included updates
- [ ] Tag with build number: `git tag v2.5.0 -m "Build v2.5.0 - Description"`
- [ ] Push commit: `git push origin main`
- [ ] Push tag: `git push origin v2.5.0`
- [ ] Create EAS build: `CI=1 npx eas-cli build --platform android --profile preview`
- [ ] Wait for build to complete (~20 minutes)
- [ ] Download and install on device
- [ ] Test thoroughly before deploying to users

---

## 🌟 EXAMPLE TIMELINE

**Week 1:**
- Monday: Create build v2.4.0 (baseline)
- Tuesday: Deploy v2.4.0.1 (fix X button), commit & tag
- Wednesday: Deploy v2.4.0.2 (add profile pic), commit & tag
- Thursday: Deploy v2.4.0.3 (fix menu bug), commit & tag
- Friday: Deploy v2.4.0.4 (error tracking), commit & tag

**Week 2:**
- Monday: Deploy v2.4.0.5 (performance), commit & tag
- Tuesday: Deploy v2.4.0.6 (UI polish), commit & tag
- Wednesday: Create build v2.5.0 (new baseline with all 6 updates)
- Thursday: Deploy v2.5.0.1 (first update to new build)
- Friday: Deploy v2.5.0.2 (second update to new build)

**Result:** Clear version history, easy rollback, professional workflow

---

## 🎯 SUCCESS CRITERIA

Your version control system is working correctly if:

✅ Every EAS update has a Git tag (v2.4.0.1, v2.4.0.2, etc.)
✅ app.json version only changes for builds (not updates)
✅ All tags are pushed to GitHub
✅ You can rollback to any update version instantly
✅ Git history clearly shows progression of changes
✅ Runtime versions match correctly (all 2.4.0.x updates have runtime 2.4.0)

---

**This versioning system is production-ready and can be replicated for any future React Native / Expo project.**
