-- Add missing exercise_5_set4_reps and exercise_5_set4_weight columns to Day 3 tables
-- These columns are needed for Exercise 5 which has 4 sets (not 3)

-- Week 2 Day 3 - Back, Traps, Biceps - Multi-Joint
ALTER TABLE week2_day3_workout_tracking
ADD COLUMN IF NOT EXISTS exercise_5_set4_reps INTEGER,
ADD COLUMN IF NOT EXISTS exercise_5_set4_weight NUMERIC(5,2);

-- Week 3 Day 3 - Back, Traps, Biceps - Multi-Joint
ALTER TABLE week3_day3_workout_tracking
ADD COLUMN IF NOT EXISTS exercise_5_set4_reps INTEGER,
ADD COLUMN IF NOT EXISTS exercise_5_set4_weight NUMERIC(5,2);

-- Week 4 Day 3 - Back, Traps, Biceps - Isolation
ALTER TABLE week4_day3_workout_tracking
ADD COLUMN IF NOT EXISTS exercise_5_set4_reps INTEGER,
ADD COLUMN IF NOT EXISTS exercise_5_set4_weight NUMERIC(5,2);

-- Week 5 Day 3 - Back, Traps, Biceps - Isolation
ALTER TABLE week5_day3_workout_tracking
ADD COLUMN IF NOT EXISTS exercise_5_set4_reps INTEGER,
ADD COLUMN IF NOT EXISTS exercise_5_set4_weight NUMERIC(5,2);

-- Week 6 Day 3 - Back, Traps, Biceps - Isolation
ALTER TABLE week6_day3_workout_tracking
ADD COLUMN IF NOT EXISTS exercise_5_set4_reps INTEGER,
ADD COLUMN IF NOT EXISTS exercise_5_set4_weight NUMERIC(5,2);

-- Verification query to check all Day 3 tables
-- Run this after executing the ALTER statements above
-- SELECT
--   'week1_day3_workout_tracking' as table_name,
--   column_name
-- FROM information_schema.columns
-- WHERE table_name = 'week1_day3_workout_tracking'
--   AND column_name LIKE '%exercise_5_set%'
-- UNION ALL
-- ... (repeat for week2-week6)
