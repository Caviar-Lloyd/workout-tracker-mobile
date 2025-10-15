-- Migration: Add workout type and new scheduling fields to custom workouts
-- Date: 2025-10-14
-- Description: Adds support for workout types (workout/warmup), one-time scheduling,
--              duration-based scheduling, and warm-up program day associations

-- Add workout_type column to custom_workouts table
ALTER TABLE custom_workouts
ADD COLUMN IF NOT EXISTS workout_type TEXT DEFAULT 'workout' CHECK (workout_type IN ('workout', 'warmup'));

-- Add new columns to custom_workout_assignments table
ALTER TABLE custom_workout_assignments
ADD COLUMN IF NOT EXISTS workout_type TEXT DEFAULT 'workout' CHECK (workout_type IN ('workout', 'warmup'));

ALTER TABLE custom_workout_assignments
ADD COLUMN IF NOT EXISTS scheduling_mode TEXT DEFAULT 'duration' CHECK (scheduling_mode IN ('one-time', 'duration', 'warmup'));

ALTER TABLE custom_workout_assignments
ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE custom_workout_assignments
ADD COLUMN IF NOT EXISTS duration_weeks INTEGER;

ALTER TABLE custom_workout_assignments
ADD COLUMN IF NOT EXISTS program_days INTEGER[];

-- Add comments to document the new fields
COMMENT ON COLUMN custom_workouts.workout_type IS 'Type of workout: workout (additional standalone workout) or warmup (pre-workout warm-up)';

COMMENT ON COLUMN custom_workout_assignments.workout_type IS 'Type of workout: workout (additional standalone workout) or warmup (pre-workout warm-up)';

COMMENT ON COLUMN custom_workout_assignments.scheduling_mode IS 'How the workout is scheduled: one-time (specific date), duration (recurring for X weeks), warmup (tied to program days)';

COMMENT ON COLUMN custom_workout_assignments.end_date IS 'End date for duration-based or one-time workouts';

COMMENT ON COLUMN custom_workout_assignments.duration_weeks IS 'Number of weeks for duration-based workouts';

COMMENT ON COLUMN custom_workout_assignments.program_days IS 'Array of program day numbers (1-6) for warm-up assignments';

-- Create index for faster queries on workout_type
CREATE INDEX IF NOT EXISTS idx_custom_workouts_workout_type ON custom_workouts(workout_type);
CREATE INDEX IF NOT EXISTS idx_custom_workout_assignments_workout_type ON custom_workout_assignments(workout_type);
CREATE INDEX IF NOT EXISTS idx_custom_workout_assignments_scheduling_mode ON custom_workout_assignments(scheduling_mode);
