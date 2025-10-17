/**
 * Workout Service for Supabase Integration
 *
 * Fetches workout data and history from the flat table structure
 * Each week-day combination has its own table: week{N}_day{M}_workout_tracking
 *
 * @module lib/supabase/workout-service
 */

import { supabase } from './client';
import { generateTableName, getRepRange } from '../workout/table-utils';
import type { WeekNumber, DayNumber } from '../../types/workout';

// =====================================================
// Types
// =====================================================

export interface ExerciseInfo {
  index: number;
  name: string;
  setCount: number; // 3 or 4 sets
  repRange: string; // e.g., "8-10", "10-12"
}

export interface WorkoutTemplate {
  week: WeekNumber;
  day: DayNumber;
  tableName: string;
  exercises: ExerciseInfo[];
}

export interface ExerciseHistoryRecord {
  date: string;
  exerciseName: string;
  sets: {
    setNumber: number;
    reps: number | null;
    weight: number | null;
  }[];
}

export interface WorkoutHistoryRecord {
  id: string;
  workoutDate: string;
  sessionCompleted: boolean;
  sessionStartTime: string | null;
  sessionEndTime: string | null;
  durationFormatted: string | null;
  exercises: {
    [key: string]: {
      name: string;
      sets: { reps: number | null; weight: number | null }[];
    };
  };
}

// =====================================================
// Exercise Structure Mapping
// =====================================================

/**
 * Maps week-day combinations to their exercise structure
 * Based on actual Supabase schema
 */
const EXERCISE_STRUCTURE: Record<string, ExerciseInfo[]> = {
  // All workouts follow the pattern:
  // Exercise 1: 4 sets
  // Exercise 2: 3 sets
  // Exercise 3: 3 sets
  // Exercise 4: 4 sets
  // Exercise 5: 4 sets
  // Exercise 6: 3 sets
  // Exercise 7: 3 sets
  'default': [
    { index: 1, name: 'Exercise 1', setCount: 4 },
    { index: 2, name: 'Exercise 2', setCount: 3 },
    { index: 3, name: 'Exercise 3', setCount: 3 },
    { index: 4, name: 'Exercise 4', setCount: 4 },
    { index: 5, name: 'Exercise 5', setCount: 4 },
    { index: 6, name: 'Exercise 6', setCount: 3 },
    { index: 7, name: 'Exercise 7', setCount: 3 },
  ],
};

// Week 1, Day 1 - Chest, Triceps, Abs Multi-Joint
const WEEK1_DAY1_EXERCISES: ExerciseInfo[] = [
  { index: 1, name: 'Bench Press', setCount: 4 },
  { index: 2, name: 'Incline Dumbbell Press', setCount: 3 },
  { index: 3, name: 'Decline Dumbbell Press', setCount: 3 },
  { index: 4, name: 'Dips', setCount: 4 },
  { index: 5, name: 'Close Grip Bench Press', setCount: 4 },
  { index: 6, name: 'Cable Crunches', setCount: 3 },
  { index: 7, name: 'Hip Thrust', setCount: 3 },
];

// Week 1, Day 2 - Shoulders, Legs, Calves Multi-Joint
const WEEK1_DAY2_EXERCISES: ExerciseInfo[] = [
  { index: 1, name: 'Shoulder Press', setCount: 4 },
  { index: 2, name: 'Alternating Standing DB Shoulder Press', setCount: 3 },
  { index: 3, name: 'Dumbbell Standing Upright Row', setCount: 3 },
  { index: 4, name: 'Squat', setCount: 4 },
  { index: 5, name: 'Deadlift', setCount: 3 },
  { index: 6, name: 'Walking Lunges', setCount: 3 },
  { index: 7, name: 'Standing Calf Raise', setCount: 3 },
];

// Week 1, Day 3 - Back, Traps, Biceps Multi-Joint (NO DATA YET - using defaults)
const WEEK1_DAY3_EXERCISES: ExerciseInfo[] = [
  { index: 1, name: 'Barbell Row', setCount: 4 },
  { index: 2, name: 'Dumbbell Bent Over Row', setCount: 3 },
  { index: 3, name: 'Seated Cable Row', setCount: 3 },
  { index: 4, name: 'Barbell Shrug', setCount: 4 },
  { index: 5, name: 'Barbell Curl', setCount: 4 },
  { index: 6, name: 'EZ Bar Preacher Curl', setCount: 3 },
  { index: 7, name: 'Barbell Wrist Curl', setCount: 3 },
];

// Week 1, Day 4 - Chest, Triceps, Abs Isolation (NO DATA YET - using Week 2 Day 4 structure)
const WEEK1_DAY4_EXERCISES: ExerciseInfo[] = [
  { index: 1, name: 'Incline Dumbbell Fly', setCount: 4 },
  { index: 2, name: 'Dumbbell Fly', setCount: 3 },
  { index: 3, name: 'Cable Crossover', setCount: 3 },
  { index: 4, name: 'Triceps Press Down', setCount: 4 },
  { index: 5, name: 'Overhead Dumbbell Extension', setCount: 4 },
  { index: 6, name: 'Skull Crushers', setCount: 3 },
  { index: 7, name: 'Crunch', setCount: 3 },
];

// Week 1, Day 5 - Shoulders, Legs, Calves Isolation
const WEEK1_DAY5_EXERCISES: ExerciseInfo[] = [
  { index: 1, name: 'Dumbbell Lateral Raise', setCount: 4 },
  { index: 2, name: 'Barbell Front Raise', setCount: 3 },
  { index: 3, name: 'Dumbbell Bent Over Lateral Raise', setCount: 3 },
  { index: 4, name: 'Leg Extension', setCount: 4 },
  { index: 5, name: 'Leg Curl', setCount: 4 },
  { index: 6, name: 'Seated Calf Raise', setCount: 3 },
  { index: 7, name: 'Leg Press Calf Raise', setCount: 3 },
];

// Week 1, Day 6 - Back, Traps, Biceps Isolation (NO DATA YET - using Week 2 Day 6 structure)
const WEEK1_DAY6_EXERCISES: ExerciseInfo[] = [
  { index: 1, name: 'Lat Pull Down', setCount: 4 },
  { index: 2, name: 'Reverse Grip Pull Down', setCount: 3 },
  { index: 3, name: 'Straight Arm Pull Down', setCount: 3 },
  { index: 4, name: 'Smith Machine Behind the Back Shrug', setCount: 4 },
  { index: 5, name: 'Incline Dumbbell Curl', setCount: 4 },
  { index: 6, name: 'High Cable Curl', setCount: 3 },
  { index: 7, name: 'Rope Cable Curl', setCount: 3 },
];

// Map specific week-day combinations
EXERCISE_STRUCTURE['1-1'] = WEEK1_DAY1_EXERCISES;
EXERCISE_STRUCTURE['1-2'] = WEEK1_DAY2_EXERCISES;
EXERCISE_STRUCTURE['1-3'] = WEEK1_DAY3_EXERCISES;
EXERCISE_STRUCTURE['1-4'] = WEEK1_DAY4_EXERCISES;
EXERCISE_STRUCTURE['1-5'] = WEEK1_DAY5_EXERCISES;
EXERCISE_STRUCTURE['1-6'] = WEEK1_DAY6_EXERCISES;

// For now, weeks 2-6 use the same exercises (can be customized later)
for (let week = 2; week <= 6; week++) {
  for (let day = 1; day <= 6; day++) {
    const key = `${week}-${day}`;
    const week1Key = `1-${day}`;
    EXERCISE_STRUCTURE[key] = EXERCISE_STRUCTURE[week1Key];
  }
}

// =====================================================
// Service Functions
// =====================================================

/**
 * Get workout template (exercise list) for a specific week and day
 */
export async function getWorkoutTemplate(week: WeekNumber, day: DayNumber): Promise<WorkoutTemplate> {
  const tableName = generateTableName(week, day);
  const key = `${week}-${day}`;
  const exercisesBase = EXERCISE_STRUCTURE[key] || EXERCISE_STRUCTURE['default'];

  // Add rep range to each exercise based on week and day
  const repRange = getRepRange(week, day);
  const exercises = exercisesBase.map(ex => ({
    ...ex,
    repRange
  }));

  return {
    week,
    day,
    tableName,
    exercises,
  };
}

/**
 * Fetch user's workout history for a specific week-day combination
 */
export async function getUserWorkoutHistory(
  userEmail: string,
  week: WeekNumber,
  day: DayNumber
): Promise<WorkoutHistoryRecord[]> {
  // Using imported supabase client
  const tableName = generateTableName(week, day);

  console.log(`[WORKOUT SERVICE] Fetching history for:`, {
    tableName,
    userEmail,
    week,
    day
  });

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .ilike('client_email', userEmail) // Case-insensitive email match
      .order('workout_date', { ascending: false });

    if (error) {
      console.error(`[WORKOUT SERVICE] Error fetching workout history from ${tableName}:`, error);
      return [];
    }

    console.log(`[WORKOUT SERVICE] Found ${data?.length || 0} records in ${tableName}`);

    if (!data || data.length === 0) {
      console.log(`[WORKOUT SERVICE] No data found for ${userEmail} in ${tableName}`);

      // Try to fetch ANY data from this table to see what emails exist
      const { data: allData } = await supabase
        .from(tableName)
        .select('client_email, workout_date')
        .limit(10);

      console.log('[WORKOUT SERVICE] Sample emails in database:', allData?.map(r => r.client_email));

      return [];
    }

    console.log(`[WORKOUT SERVICE] First record:`, {
      date: data[0].workout_date,
      email: data[0].client_email,
      exercise1Name: data[0].exercise_1_name,
      exercise1Set1: {
        reps: data[0].exercise_1_set1_reps,
        weight: data[0].exercise_1_set1_weight
      }
    });

    // Transform raw data to structured format
    return data.map((row: any) => {
      const exercises: any = {};

      // Get the exercise structure for this week-day combination
      const key = `${week}-${day}`;
      const exerciseStructure = EXERCISE_STRUCTURE[key] || EXERCISE_STRUCTURE['default'];

      // Parse exercises 1-7 using the correct structure
      for (let i = 1; i <= 7; i++) {
        const exerciseName = row[`exercise_${i}_name`];
        const sets: { reps: number | null; weight: number | null }[] = [];

        // Get set count from exercise structure
        const exerciseInfo = exerciseStructure.find(ex => ex.index === i);
        const setCount = exerciseInfo?.setCount || 3;

        for (let s = 1; s <= setCount; s++) {
          sets.push({
            reps: row[`exercise_${i}_set${s}_reps`] || null,
            weight: row[`exercise_${i}_set${s}_weight`] || null,
          });
        }

        exercises[`exercise_${i}`] = {
          name: exerciseName || `Exercise ${i}`,
          sets,
        };
      }

      return {
        id: row.id,
        workoutDate: row.workout_date,
        sessionCompleted: row.session_completed || false,
        sessionStartTime: row.session_start_time,
        sessionEndTime: row.session_end_time,
        durationFormatted: row.duration_formatted,
        exercises,
      };
    });
  } catch (err) {
    console.error('Error in getUserWorkoutHistory:', err);
    return [];
  }
}

/**
 * Get exercise-specific history (weight progression over time)
 */
export async function getExerciseHistory(
  userEmail: string,
  week: WeekNumber,
  day: DayNumber,
  exerciseIndex: number
): Promise<ExerciseHistoryRecord[]> {
  const history = await getUserWorkoutHistory(userEmail, week, day);

  return history
    .filter((record) => record.sessionCompleted)
    .map((record) => {
      const exercise = record.exercises[`exercise_${exerciseIndex}`];
      return {
        date: record.workoutDate,
        exerciseName: exercise.name,
        sets: exercise.sets.map((set, idx) => ({
          setNumber: idx + 1,
          reps: set.reps,
          weight: set.weight,
        })),
      };
    });
}

/**
 * Get all exercise history for a workout (all exercises)
 */
export async function getAllExerciseHistory(
  userEmail: string,
  week: WeekNumber,
  day: DayNumber
): Promise<ExerciseHistoryRecord[]> {
  const history = await getUserWorkoutHistory(userEmail, week, day);

  const allExercises: ExerciseHistoryRecord[] = [];

  history
    .filter((record) => record.sessionCompleted)
    .forEach((record) => {
      // Iterate through all exercises in the record
      Object.keys(record.exercises).forEach((key) => {
        const exercise = record.exercises[key];
        if (exercise && exercise.name) {
          allExercises.push({
            date: record.workoutDate,
            exerciseName: exercise.name,
            sets: exercise.sets.map((set, idx) => ({
              setNumber: idx + 1,
              reps: set.reps,
              weight: set.weight,
            })),
          });
        }
      });
    });

  return allExercises;
}

/**
 * Calculate average weight for an exercise across all sets
 */
export function calculateAverageWeight(sets: { reps: number | null; weight: number | null }[]): number {
  const validSets = sets.filter((s) => s.weight !== null && s.weight > 0);
  if (validSets.length === 0) return 0;

  const total = validSets.reduce((sum, s) => sum + (s.weight || 0), 0);
  return Math.round(total / validSets.length);
}

/**
 * Get total workout count across all weeks and days for a user
 */
export async function getTotalWorkoutCount(userEmail: string): Promise<number> {
  // Using imported supabase client

  // Query all 36 tables in parallel for faster loading
  const queries = [];
  for (let week = 1; week <= 6; week++) {
    for (let day = 1; day <= 6; day++) {
      const tableName = generateTableName(week as WeekNumber, day as DayNumber);
      queries.push(
        supabase
          .from(tableName)
          .select('id', { count: 'exact', head: true })
          .ilike('client_email', userEmail)
          .eq('session_completed', true)
      );
    }
  }

  const results = await Promise.all(queries);
  const totalCount = results.reduce((sum, result) => {
    return sum + (result.count || 0);
  }, 0);

  return totalCount;
}

/**
 * Get user's most recent completed workout
 */
export async function getLastWorkout(userEmail: string): Promise<{
  week: WeekNumber;
  day: DayNumber;
  date: string;
  workoutName: string;
} | null> {
  // Using imported supabase client

  // Query all 36 tables in parallel
  const queries = [];
  for (let week = 1; week <= 6; week++) {
    for (let day = 1; day <= 6; day++) {
      const tableName = generateTableName(week as WeekNumber, day as DayNumber);
      queries.push(
        supabase
          .from(tableName)
          .select('workout_date')
          .ilike('client_email', userEmail)
          .order('workout_date', { ascending: false })
          .limit(1)
          .then(result => ({
            ...result,
            week: week as WeekNumber,
            day: day as DayNumber,
          }))
      );
    }
  }

  const results = await Promise.all(queries);

  // Find most recent workout
  let mostRecentWorkout: any = null;
  for (const result of results) {
    if (!result.error && result.data && result.data.length > 0) {
      const workout = result.data[0];
      if (!mostRecentWorkout || workout.workout_date > mostRecentWorkout.date) {
        mostRecentWorkout = {
          week: result.week,
          day: result.day,
          date: workout.workout_date,
        };
      }
    }
  }

  if (!mostRecentWorkout) return null;

  // Get workout name based on day
  const workoutNames: Record<number, string> = {
    1: 'Chest, Triceps, Abs - Multi-Joint',
    2: 'Shoulders, Legs, Calves - Multi-Joint',
    3: 'Back, Traps, Biceps - Multi-Joint',
    4: 'Chest, Triceps, Abs - Isolation',
    5: 'Shoulders, Legs, Calves - Isolation',
    6: 'Back, Traps, Biceps - Isolation',
  };

  return {
    week: mostRecentWorkout.week,
    day: mostRecentWorkout.day,
    date: mostRecentWorkout.date,
    workoutName: workoutNames[mostRecentWorkout.day] || `Day ${mostRecentWorkout.day}`,
  };
}

/**
 * Get all completed workouts for a user
 */
export async function getAllCompletedWorkouts(userEmail: string): Promise<{
  date: string;
  week: WeekNumber;
  day: DayNumber;
}[]> {
  console.log('[getAllCompletedWorkouts] Fetching for email:', userEmail);

  const { data, error } = await supabase
    .from('workout_starts')
    .select('*')
    .ilike('client_email', userEmail)
    .order('workout_date', { ascending: true });

  if (error) {
    console.error('Error fetching completed workouts:', error);
    return [];
  }

  console.log('[getAllCompletedWorkouts] Raw data:', data);

  if (!data || data.length === 0) {
    console.log('[getAllCompletedWorkouts] No workouts found');
    return [];
  }

  // Log first row to see column names
  console.log('[getAllCompletedWorkouts] First row columns:', Object.keys(data[0]));

  return (data || []).map(row => ({
    date: row.workout_date,
    week: row.week as WeekNumber,
    day: row.day as DayNumber,
  }));
}

/**
 * Calculate next workout in sequence
 */
export function getNextWorkout(lastWeek: WeekNumber, lastDay: DayNumber): {
  week: WeekNumber;
  day: DayNumber;
} {
  let nextWeek = lastWeek;
  let nextDay = (lastDay + 1) as DayNumber;

  // Move to next week if we've completed day 6
  if (nextDay > 6) {
    nextDay = 1;
    nextWeek = ((lastWeek % 6) + 1) as WeekNumber;
  }

  return { week: nextWeek, day: nextDay };
}

/**
 * Get next workout by client email
 */
export async function getNextWorkoutByEmail(email: string): Promise<{
  week: WeekNumber;
  day: DayNumber;
  workoutName: string;
} | null> {
  const lastWorkout = await getLastWorkout(email);

  // If no workout history, start at Week 1, Day 1
  if (!lastWorkout) {
    return {
      week: 1 as WeekNumber,
      day: 1 as DayNumber,
      workoutName: 'Chest, Triceps, Abs - Multi-Joint'
    };
  }

  const next = getNextWorkout(lastWorkout.week, lastWorkout.day);

  const workoutNames: Record<number, string> = {
    1: 'Chest, Triceps, Abs - Multi-Joint',
    2: 'Shoulders, Legs, Calves - Multi-Joint',
    3: 'Back, Traps, Biceps - Multi-Joint',
    4: 'Chest, Triceps, Abs - Isolation',
    5: 'Shoulders, Legs, Calves - Isolation',
    6: 'Back, Traps, Biceps - Isolation',
  };

  return {
    week: next.week,
    day: next.day,
    workoutName: workoutNames[next.day] || `Day ${next.day}`
  };
}
