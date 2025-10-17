# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2025-10-16 (Database Schema Fix)### Fixed- **DATABASE:** Added missing Exercise 5 Set 4 columns to Supabase tables  - Fixed week1_day2_workout_tracking table - added exercise_5_set4_reps, exercise_5_set4_weight  - Fixed week1_day3_workout_tracking table - added exercise_5_set4_reps, exercise_5_set4_weight  - Resolved "Could not find exercise_5_set4_reps column" error when logging workouts### Tested- ✅ Week 1 Day 2 workout logging works- ✅ Week 1 Day 3 workout logging works- ✅ Client email logging confirmed working (saves with client email, not trainer email)
## [2.0.0] - 2025-10-16

### Added
- Profile pictures now display in My Clients list view (ClientsScreen.tsx)
- Custom Workout Builder screen navigation from menu (App.tsx, CustomWorkoutBuilderScreen.tsx)
- Custom Workout Builder works as both modal and standalone screen
- Comprehensive BUILD-INFO.md documentation
- This CHANGELOG.md file

### Fixed
- **CRITICAL:** Client email now logs correctly instead of trainer email (WorkoutScreen.tsx)
  - When trainers log workouts for clients, the workout is now attributed to the client
  - Previously saved all workouts with trainer's email
- Profile pictures only showed initials in My Clients list, now shows actual photos
- Custom Workout Builder showed "coming soon" alert, now navigates to functional screen
- Workout progression now considers ALL workouts, not just completed ones (workout-service.ts)
  - Next workout calculation improved to handle partial workout sessions

### Changed
- Version bumped from 1.1.9 to 2.0.0 (major version due to significant fixes)
- OAuth deep linking configuration maintained (intentFilters in app.json)

## [1.1.9] - 2025-XX-XX (GitHub Baseline)

### Base Features
- Logo and splash screen
- OAuth authentication with Google
- Profile picture upload functionality
- Workout tracking system
- Client management
- Progress tracking
- Dashboard with workout stats

---

## Version Numbering Guide

- **Major (2.x.x):** Breaking changes or significant new features baked into builds
- **Minor (x.1.x):** New features or significant fixes added via builds
- **Patch (x.x.1):** Small fixes, typically delivered via EAS updates

## EAS Update Numbering

When we do EAS updates between builds:
- Updates are tracked as commits and tags (e.g., v2.0.1, v2.0.2)
- After 5-10 successful EAS updates, we create a new build (e.g., v2.1.0)
- The new build "bakes in" all the EAS updates from the previous version

Example flow:
```
v2.0.0 (Build)
  → v2.0.1 (EAS Update)
  → v2.0.2 (EAS Update)
  → v2.0.3 (EAS Update)
  → v2.1.0 (Build - bakes in v2.0.1-2.0.3)
```
