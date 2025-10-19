# Workout Tracker - Architecture Evolution Plan

## Executive Summary

This document outlines the evolution from a single hardcoded program ("Complete Recomposition Training System") to a flexible multi-program platform with:
- Exercise video library accessible to all users
- Multiple program support
- Coach program builder
- Dynamic exercise substitution
- Client program assignment system

---

## Current Architecture

### Program Structure (Hardcoded)
- **Single Program**: "Complete Recomposition Training System"
- **Structure**: 6 weeks × 6 days = 36 workouts
- **Storage**: 36 separate tables (`week{N}_day{M}_workout_tracking`)
- **Exercise Templates**: Hardcoded in `workout-service.ts` (EXERCISE_STRUCTURE)
- **Video Mapping**: Exercise names → video URLs (CustomVideoPlayer)

### Current Flow
```
Client Login → Assigned Program (implicit: CRTS) → Fixed Exercise List → Hardcoded Videos
```

---

## Future Architecture: Multi-Program Platform

### Core Database Schema

#### 1. **programs** table
```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_email TEXT NOT NULL,
  program_name TEXT NOT NULL,
  program_description TEXT,
  program_type TEXT, -- 'recomp', 'strength', 'hypertrophy', 'custom'
  duration_weeks INTEGER NOT NULL,
  days_per_week INTEGER NOT NULL,
  is_template BOOLEAN DEFAULT false, -- Can be copied by other coaches
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Example rows:
-- | id | coach_email | program_name | duration_weeks | days_per_week |
-- |----|-------------|--------------|----------------|---------------|
-- | 1  | system      | CRTS         | 6              | 6             |
-- | 2  | coach@...   | Beginner 5x5 | 12             | 3             |
```

#### 2. **program_workouts** table
```sql
CREATE TABLE program_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id),
  week_number INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  workout_name TEXT, -- e.g., "Chest, Triceps, Abs - Multi-Joint"
  workout_type TEXT, -- 'multi-joint', 'isolation'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(program_id, week_number, day_number)
);

-- Example:
-- | program_id | week | day | workout_name                    |
-- |------------|------|-----|---------------------------------|
-- | 1 (CRTS)   | 1    | 1   | Chest, Triceps, Abs - Multi...  |
-- | 1 (CRTS)   | 1    | 2   | Shoulders, Legs, Calves - Multi |
```

#### 3. **workout_exercises** table
```sql
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES program_workouts(id),
  exercise_order INTEGER NOT NULL, -- 1-7
  exercise_id UUID REFERENCES exercises(id),
  set_count INTEGER NOT NULL,
  rep_range TEXT, -- "8-10", "10-12"
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workout_id, exercise_order)
);
```

#### 4. **exercises** table (Master Exercise Library)
```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_name TEXT NOT NULL UNIQUE,
  video_url TEXT,
  muscle_group TEXT[], -- ['chest', 'triceps']
  equipment TEXT[], -- ['barbell', 'bench']
  difficulty TEXT, -- 'beginner', 'intermediate', 'advanced'
  is_compound BOOLEAN DEFAULT false,
  description TEXT,
  created_by TEXT, -- coach_email or 'system'
  is_public BOOLEAN DEFAULT true, -- Visible to all users
  created_at TIMESTAMP DEFAULT NOW()
);

-- Example:
-- | id | exercise_name      | video_url        | muscle_group     |
-- |----|--------------------| -----------------|------------------|
-- | 1  | Bench Press        | exercises/bench  | ['chest', 'tri'] |
-- | 2  | Incline DB Press   | exercises/incl   | ['chest']        |
-- | 3  | Chest Press (alt)  | exercises/chest  | ['chest']        |
```

#### 5. **client_program_assignments** (Enhanced)
```sql
-- Already exists, but add:
ALTER TABLE client_program_assignments
  ADD COLUMN program_id UUID REFERENCES programs(id),
  ADD COLUMN start_date DATE,
  ADD COLUMN current_week INTEGER DEFAULT 1,
  ADD COLUMN current_day INTEGER DEFAULT 1;

-- Migrate existing data:
-- All current clients get assigned to program_id = 1 (CRTS)
```

#### 6. **exercise_substitutions** table
```sql
CREATE TABLE exercise_substitutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_email TEXT NOT NULL,
  program_id UUID REFERENCES programs(id),
  week_number INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  exercise_order INTEGER NOT NULL, -- Which exercise slot (1-7)
  original_exercise_id UUID REFERENCES exercises(id),
  substituted_exercise_id UUID REFERENCES exercises(id),
  reason TEXT, -- "Client can't do bench press - injury"
  created_by TEXT, -- coach_email
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_email, program_id, week_number, day_number, exercise_order)
);

-- Example:
-- Client "john@..." has bench press (exercise slot 1) replaced with chest press
-- | client_email | program_id | week | day | exercise_order | original | substituted |
-- |--------------|------------|------|-----|----------------|----------|-------------|
-- | john@...     | 1 (CRTS)   | 1    | 1   | 1              | 1 (bench)| 3 (chest)   |
```

---

## Migration Strategy

### Phase 1: Exercise Library Foundation
**Goal**: Create master exercise database while maintaining current functionality

**Steps**:
1. Create `exercises` table
2. Populate with all current CRTS exercises (86 total from weeks 1-6)
3. Map exercise names to video URLs
4. Build Exercise Library screen (read-only browse mode)
5. **NO breaking changes** - existing code still uses hardcoded EXERCISE_STRUCTURE

**Timeline**: 1-2 weeks

**User Impact**: None - purely additive feature

---

### Phase 2: Program Database Layer
**Goal**: Move CRTS into database while maintaining current UI

**Steps**:
1. Create `programs`, `program_workouts`, `workout_exercises` tables
2. Write migration script to convert EXERCISE_STRUCTURE → database
3. Create `ProgramService` to query programs
4. Update `getWorkoutTemplate()` to read from database
5. Fallback to hardcoded structure if database fails (safety)

**Timeline**: 2-3 weeks

**User Impact**: None - same UI, database-backed

---

### Phase 3: Exercise Substitution System
**Goal**: Allow coaches to swap exercises for individual clients

**Steps**:
1. Create `exercise_substitutions` table
2. Build coach UI: "Edit Workout for Client"
   - Shows current workout
   - Click exercise → search/select replacement
   - Save substitution
3. Update workout queries to apply substitutions
4. Show substitution indicator in workout UI ("⚡ Modified")

**Timeline**: 2-3 weeks

**User Impact**: Coaches can customize client workouts

---

### Phase 4: Program Builder (Coach Tools)
**Goal**: Coaches can create entirely new programs

**Steps**:
1. Build "Program Builder" screen (coach only)
   - Create new program (name, weeks, days/week)
   - For each workout: select exercises from library
   - Set rep ranges, set counts
   - Save as template or assign to clients
2. Build program assignment UI
3. Update client dashboard to show assigned program name

**Timeline**: 3-4 weeks

**User Impact**: Coaches can build custom programs from scratch

---

### Phase 5: Video Library for All Users
**Goal**: Users can browse all exercise videos independently

**Steps**:
1. Enhance Exercise Library screen:
   - Filter by muscle group
   - Search by name
   - Play video demos
   - "Not assigned to a program" users can browse freely
2. Add to main navigation menu

**Timeline**: 1-2 weeks

**User Impact**: All users can learn exercises even without assigned program

---

## Service Layer Architecture

### Current Service
```typescript
// workout-service.ts
export async function getWorkoutTemplate(week, day) {
  const exercises = EXERCISE_STRUCTURE[`${week}-${day}`]; // Hardcoded
  return { week, day, exercises };
}
```

### Future Service (Backward Compatible)
```typescript
// program-service.ts
export async function getWorkoutTemplate(
  userEmail: string,
  week: WeekNumber,
  day: DayNumber
): Promise<WorkoutTemplate> {
  // 1. Get user's assigned program
  const assignment = await supabase
    .from('client_program_assignments')
    .select('program_id')
    .eq('client_email', userEmail)
    .single();

  const programId = assignment?.program_id || DEFAULT_CRTS_PROGRAM_ID;

  // 2. Get workout for this week/day
  const workout = await supabase
    .from('program_workouts')
    .select(`
      *,
      workout_exercises (
        exercise_order,
        set_count,
        rep_range,
        exercises (
          exercise_name,
          video_url,
          muscle_group
        )
      )
    `)
    .eq('program_id', programId)
    .eq('week_number', week)
    .eq('day_number', day)
    .single();

  // 3. Apply exercise substitutions (if any)
  const substitutions = await supabase
    .from('exercise_substitutions')
    .select('*')
    .eq('client_email', userEmail)
    .eq('program_id', programId)
    .eq('week_number', week)
    .eq('day_number', day);

  const exercises = applySubstitutions(
    workout.workout_exercises,
    substitutions
  );

  // 4. FALLBACK: If database fails, use hardcoded structure
  if (!workout) {
    return getHardcodedTemplate(week, day);
  }

  return {
    week,
    day,
    programName: workout.program.program_name,
    exercises: exercises.map(ex => ({
      index: ex.exercise_order,
      name: ex.exercises.exercise_name,
      videoUrl: ex.exercises.video_url,
      setCount: ex.set_count,
      repRange: ex.rep_range
    }))
  };
}
```

---

## UI/UX Evolution

### Program Overview Screen Evolution

**Current**:
```
[Week Selector] [Day Selector] [Exercise List]
                    ↓
              [Video Player]
```

**Phase 1** (Exercise Library):
```
[Week Selector] [Day Selector] [Exercise List]
                    ↓
              [Video Player]

New menu item: "Exercise Library" → Browse all exercises
```

**Phase 3** (Post-Substitution):
```
Program: Complete Recomposition Training System ⚙️ (coach can edit)

[Week Selector] [Day Selector] [Exercise List]
                    ↓
              [Video Player]

Exercise List shows:
1. Bench Press
2. Incline DB Press ⚡ (Substituted: was "Incline Barbell Press")
```

**Phase 4** (Multi-Program):
```
[Program Dropdown: CRTS ▼]  ⚙️ Edit | 📋 Switch Program

[Week Selector] [Day Selector] [Exercise List]
                    ↓
              [Video Player]
```

**Phase 5** (Video Library Mode):
```
If no program assigned:

📚 Exercise Video Library

[Search: ___________]
[Filter: Muscle Group ▼] [Filter: Equipment ▼]

[Grid of Exercise Cards with video thumbnails]
- Bench Press (Chest, Triceps)
- Squat (Legs)
- Deadlift (Back, Legs)
...

Click → Play video demonstration
```

---

## Technical Considerations

### 1. **Backward Compatibility**
- Existing clients continue working seamlessly
- Hardcoded EXERCISE_STRUCTURE remains as fallback
- Gradual migration: database-first, hardcode-fallback

### 2. **Performance**
- Cache program/exercise data in app state
- Lazy-load video library (pagination)
- Index database tables: (program_id, week, day), (client_email)

### 3. **Data Integrity**
- Exercise substitutions validate muscle group match
  - Can't replace "Bench Press" (chest) with "Squat" (legs)
- Program builder validates rep ranges, set counts

### 4. **Coach vs. Client Permissions**
- Coaches see: Program Builder, Exercise Substitution, Client Assignment
- Clients see: Assigned Program, Exercise Library (browse-only)

---

## Implementation Checklist

### Phase 1: Exercise Library
- [ ] Create exercises table schema
- [ ] Write seed script (populate from EXERCISE_STRUCTURE)
- [ ] Build Exercise Library screen (read-only)
- [ ] Add to navigation menu
- [ ] Video playback integration

### Phase 2: Program Database
- [ ] Create programs, program_workouts, workout_exercises tables
- [ ] Migration script: EXERCISE_STRUCTURE → database
- [ ] Update getWorkoutTemplate() with database queries
- [ ] Add fallback to hardcoded structure
- [ ] Test with existing clients (no UI changes)

### Phase 3: Exercise Substitution
- [ ] Create exercise_substitutions table
- [ ] Build "Edit Workout" UI for coaches
- [ ] Exercise search/select component
- [ ] Save substitution to database
- [ ] Update workout queries to apply substitutions
- [ ] Show substitution indicator in UI

### Phase 4: Program Builder
- [ ] "Create Program" screen
- [ ] Program wizard (name, duration, days/week)
- [ ] Workout builder (select exercises, set counts, reps)
- [ ] Save program as template
- [ ] Assign program to clients
- [ ] Program switching UI for clients

### Phase 5: Universal Video Library
- [ ] Enhance Exercise Library with filters
- [ ] Search functionality
- [ ] Muscle group categories
- [ ] "Browse Mode" for users without programs
- [ ] Video thumbnails/previews

---

## Database Migration Example

### Seed CRTS into Database
```sql
-- 1. Create the CRTS program
INSERT INTO programs (id, coach_email, program_name, duration_weeks, days_per_week)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'system',
  'Complete Recomposition Training System',
  6,
  6
);

-- 2. Create Week 1, Day 1 workout
INSERT INTO program_workouts (id, program_id, week_number, day_number, workout_name)
VALUES (
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0000-000000000001',
  1,
  1,
  'Chest, Triceps, Abs - Multi-Joint'
);

-- 3. Add exercises to Week 1, Day 1
INSERT INTO workout_exercises (workout_id, exercise_order, exercise_id, set_count, rep_range)
SELECT
  '00000000-0000-0000-0001-000000000001',
  1,
  (SELECT id FROM exercises WHERE exercise_name = 'Bench Press'),
  4,
  '8-10';

-- Repeat for all 7 exercises, all 36 workouts...
```

---

## Key Benefits

### For Users
- ✅ Access to video library even without assigned program
- ✅ Learn proper form for any exercise
- ✅ Customized workouts (exercise substitutions)
- ✅ Multiple program options

### For Coaches
- ✅ Build unlimited custom programs
- ✅ Substitute exercises for client limitations/injuries
- ✅ Reuse program templates across clients
- ✅ Track which clients use which programs

### For Business
- ✅ Scalable multi-program platform
- ✅ Differentiation from single-program competitors
- ✅ Coach tools increase retention
- ✅ Exercise library increases engagement

---

## Questions to Resolve

1. **Exercise Substitution Scope**:
   - Per-client (Jane's Week 1 Day 1)?
   - Per-workout instance (this specific date)?
   - Permanent (all future Week 1 Day 1s)?

2. **Program Versioning**:
   - If coach updates a program template, do existing client assignments update?
   - Or do clients stay on "v1" until manually switched?

3. **Video Storage**:
   - Current: Expo AV with exercise name → video URL mapping
   - Future: Store video URLs in exercises table? Or keep external mapping?

4. **Tracking Tables**:
   - Keep 36 flat tables (week{N}_day{M}_workout_tracking)?
   - Or migrate to single `workout_logs` table with program_id, week, day columns?

---

## Next Steps (Discussion Points)

1. **Prioritization**: Which phase should we tackle first?
2. **Timeline**: How quickly do you need each phase?
3. **User Feedback**: Should we beta test with a few coaches before full rollout?
4. **Data Migration**: When should we migrate existing clients to database-backed programs?

---

**Document Version**: 1.0
**Last Updated**: 2025-10-18
**Author**: System Architecture Planning
