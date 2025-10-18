# Development Workflow - Workout Tracker Mobile

## 🚨 CRITICAL RULES - NEVER VIOLATE THESE

### 1. **WORKING DIRECTORY**
- **ONLY DIRECTORY:** `c:/temp-build/workout-tracker-mobile-github/`
- **NEVER USE:** Any OneDrive locations or `c:/temp-build/workout-tracker-mobile/`
- The old directory has been renamed to `workout-tracker-mobile-OLD-DO-NOT-USE`
- GitHub repository is connected to `workout-tracker-mobile-github` only

### 2. **CHANGE → TEST → COMMIT WORKFLOW**

```
┌─────────────────────────────────────────────────────────┐
│  1. MAKE CHANGES in c:/temp-build/workout-tracker-mobile-github/  │
└───────────────────────┬─────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. DEPLOY EAS UPDATE (for testing)                     │
│     cd c:/temp-build/workout-tracker-mobile-github      │
│     CI=1 npx eas-cli update --branch preview \          │
│       --platform android --message "Description"        │
└───────────────────────┬─────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  3. USER TESTS THE UPDATE                               │
│     - Install update on device                          │
│     - Verify functionality works                        │
│     - Confirm no bugs or issues                         │
└───────────────────────┬─────────────────────────────────┘
                        ↓
                   ✅ WORKS?
                        │
            ┌───────────┴───────────┐
            │                       │
           YES                     NO
            │                       │
            ↓                       ↓
┌──────────────────────┐  ┌────────────────────┐
│  4. COMMIT TO GITHUB │  │  FIX THE ISSUE     │
│     git add .        │  │  Go back to step 1 │
│     git commit       │  └────────────────────┘
│     git push         │
└──────────────────────┘
            ↓
┌──────────────────────────────────────────────────────────┐
│  5. AFTER 5-6 VERIFIED UPDATES, CREATE NEW BUILD        │
│     CI=1 npx eas-cli build --platform android \          │
│       --profile preview                                   │
│     This becomes the new baseline with working code       │
└──────────────────────────────────────────────────────────┘
```

### 3. **WHY THIS WORKFLOW?**

#### ❌ DO NOT:
- Push unverified code to GitHub
- Make changes in multiple directories
- Reference OneDrive locations
- Commit broken or untested code
- Skip the testing step

#### ✅ DO:
- Test all changes with EAS updates first
- Only commit working, verified code to GitHub
- Use GitHub as the source of truth for working code
- Create new builds after accumulating 5-6 verified updates
- Keep all work in `workout-tracker-mobile-github` directory

### 4. **RATIONALE**

**Problem:** Pushing bad code to GitHub means:
- Future builds reference broken code
- Reverting becomes complicated
- Version control loses its value
- Bad code can propagate through updates

**Solution:** This workflow ensures:
- GitHub always contains working code
- Each commit represents a verified, functional state
- Easy to revert to any previous working version
- Clear history of what works and what doesn't

---

## 📋 WORKFLOW EXAMPLES

### Example 1: Fixing UI Layout Issue

```bash
# 1. Make changes
cd c:/temp-build/workout-tracker-mobile-github
# Edit files...

# 2. Deploy EAS update for testing
CI=1 npx eas-cli update --branch preview --platform android \
  --message "Fix save button layout in CustomWorkoutBuilder"

# 3. USER TESTS - Wait for confirmation

# 4. IF USER CONFIRMS IT WORKS:
git add screens/CustomWorkoutBuilderScreen.tsx
git commit -m "Fix: Save button layout in CustomWorkoutBuilder

- Moved save button inside ScrollView
- No longer overlaps menu

✅ VERIFIED AND WORKING"
git push

# 5. After 5-6 such fixes, create new build
```

### Example 2: Adding New Feature

```bash
# 1. Make changes for feature
# Edit multiple files...

# 2. Deploy update
CI=1 npx eas-cli update --branch preview --platform android \
  --message "Add error tracking feature"

# 3. USER TESTS - Reports a bug

# 4. Fix the bug
# Edit files again...

# 5. Deploy updated version
CI=1 npx eas-cli update --branch preview --platform android \
  --message "Fix error tracking bug - handle offline scenarios"

# 6. USER TESTS - Confirms it works

# 7. NOW commit to GitHub
git add lib/errorLogger.ts lib/offlineSync.ts components/ErrorBoundary.tsx
git commit -m "feat: Add error tracking system

- Logs all errors to Supabase
- Handles offline scenarios with queue
- Global error boundary for crashes

✅ VERIFIED AND WORKING"
git push
```

---

## 🔧 COMMON COMMANDS

### Deploy EAS Update (for testing)
```bash
cd c:/temp-build/workout-tracker-mobile-github
CI=1 npx eas-cli update --branch preview --platform android --message "Description of changes"
```

### Create New Build (after 5-6 verified updates)
```bash
cd c:/temp-build/workout-tracker-mobile-github
CI=1 npx eas-cli build --platform android --profile preview --non-interactive
```

### Commit Working Code to GitHub
```bash
cd c:/temp-build/workout-tracker-mobile-github
git add [files]
git commit -m "Clear description with ✅ VERIFIED AND WORKING"
git push
```

### Check Build/Update Status
```bash
cd c:/temp-build/workout-tracker-mobile-github
npx eas-cli build:list --limit 5
npx eas-cli update:list --branch preview --limit 5
```

---

## 📝 COMMIT MESSAGE FORMAT

```
<type>: <short description>

- Bullet point change 1
- Bullet point change 2
- Bullet point change 3

✅ VERIFIED AND WORKING
```

**Types:** `fix`, `feat`, `refactor`, `docs`, `style`, `test`, `chore`

---

## 🎯 KEY PRINCIPLES

1. **Single Source of Truth:** GitHub contains ONLY working code
2. **Test Before Commit:** EAS updates are for testing, GitHub is for archiving working code
3. **Iterative Testing:** Multiple EAS updates are expected before committing
4. **Build Milestones:** New builds after accumulating verified changes
5. **Clear History:** Every commit in GitHub history represents a working state

---

## ⚠️ TROUBLESHOOTING

### "Updates not showing in app"
- Check runtime version matches (app.json version)
- Force close and reopen app
- Check if update was deployed from correct directory
- Verify no conflicting builds from old directory

### "Multiple builds running"
- Kill builds from old directory: `workout-tracker-mobile-OLD-DO-NOT-USE`
- Only keep builds from `workout-tracker-mobile-github`

### "Want to revert changes"
- If not committed: `git restore [file]`
- If committed but not pushed: `git reset --hard HEAD~1`
- If pushed and need to revert: `git revert [commit-hash]` then push

---

## 📚 DIRECTORY STRUCTURE

```
C:/temp-build/
├── workout-tracker-mobile-github/     ✅ USE THIS - Connected to GitHub
│   ├── screens/
│   ├── components/
│   ├── lib/
│   ├── app.json
│   ├── package.json
│   └── DEVELOPMENT_WORKFLOW.md
│
└── workout-tracker-mobile-OLD-DO-NOT-USE/  ❌ NEVER USE - Archived
```

---

*Last Updated: 2025-10-17*
*This workflow ensures code quality and prevents bad code from entering version control.*
