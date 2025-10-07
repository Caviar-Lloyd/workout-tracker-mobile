/**
 * Schema Introspection for Shortcut to Shred Workout Tracking
 *
 * This module reads exercise names and structure from database table schemas.
 * Exercise names are stored as DEFAULT values in column definitions.
 *
 * @module lib/workout/schema-introspection
 */

import { createClient } from '@supabase/supabase-js';
import { generateTableName } from './table-utils';
import { getExerciseNameColumn } from './column-mapper';

/**
 * Exercise information from schema
 */
export interface ExerciseInfo {
  exerciseIndex: number;
  name: string;
  defaultName: string;
}

/**
 * Table schema information
 */
export interface TableSchema {
  tableName: string;
  exercises: ExerciseInfo[];
  totalExercises: number;
}

/**
 * Gets exercise names from table column defaults
 *
 * This function queries the information_schema to read DEFAULT values
 * for exercise name columns (e.g., exercise_1_name, exercise_2_name, etc.)
 *
 * @param supabase - Supabase client instance
 * @param week - Week number (1-6)
 * @param day - Day number (1-6)
 * @returns Array of exercise information
 *
 * @example
 * const exercises = await getExerciseNames(supabase, 1, 1);
 * // Returns: [{ exerciseIndex: 1, name: 'Bench Press', defaultName: 'Bench Press' }, ...]
 */
export async function getExerciseNames(
  supabase: ReturnType<typeof createClient>,
  week: number,
  day: number
): Promise<ExerciseInfo[]> {
  const tableName = generateTableName(week, day);

  // Query information_schema to get column defaults
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        column_name,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = '${tableName}'
        AND column_name LIKE 'exercise_%_name'
      ORDER BY column_name;
    `,
  });

  if (error) {
    console.error('Failed to fetch exercise names:', error);
    throw new Error(`Failed to fetch exercise names: ${error.message}`);
  }

  if (!data || data.length === 0) {
    // Fallback: Query the table directly to get exercise names
    return await getExerciseNamesFromTable(supabase, tableName);
  }

  // Parse the column defaults to extract exercise names
  const exercises: ExerciseInfo[] = data.map((row: any, index: number) => {
    const exerciseIndex = index + 1;
    // column_default format: "'Exercise Name'::text"
    // Extract the name between quotes
    let name = `Exercise ${exerciseIndex}`;
    if (row.column_default) {
      const match = row.column_default.match(/'([^']+)'/);
      if (match) {
        name = match[1];
      }
    }

    return {
      exerciseIndex,
      name,
      defaultName: name,
    };
  });

  return exercises;
}

/**
 * Gets exercise names by querying the table directly
 * Fallback method when information_schema query fails
 *
 * @param supabase - Supabase client instance
 * @param tableName - Table name to query
 * @returns Array of exercise information
 */
async function getExerciseNamesFromTable(
  supabase: ReturnType<typeof createClient>,
  tableName: string
): Promise<ExerciseInfo[]> {
  // Get first row from table to read exercise names
  const { data, error } = await supabase.from(tableName).select('*').limit(1).single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows, which is okay
    console.error('Failed to fetch exercise names from table:', error);
    throw new Error(`Failed to fetch exercise names: ${error.message}`);
  }

  const exercises: ExerciseInfo[] = [];

  // If no data, create default exercise list
  if (!data) {
    for (let i = 1; i <= 7; i++) {
      exercises.push({
        exerciseIndex: i,
        name: `Exercise ${i}`,
        defaultName: `Exercise ${i}`,
      });
    }
    return exercises;
  }

  // Extract exercise names from row
  for (let i = 1; i <= 7; i++) {
    const nameColumn = getExerciseNameColumn(i);
    const name = data[nameColumn] || `Exercise ${i}`;

    exercises.push({
      exerciseIndex: i,
      name,
      defaultName: name,
    });
  }

  return exercises;
}

/**
 * Gets complete table schema including all exercises
 *
 * @param supabase - Supabase client instance
 * @param week - Week number (1-6)
 * @param day - Day number (1-6)
 * @returns Complete table schema information
 *
 * @example
 * const schema = await getTableSchema(supabase, 1, 1);
 * console.log(schema.exercises); // All 7 exercises with names
 */
export async function getTableSchema(
  supabase: ReturnType<typeof createClient>,
  week: number,
  day: number
): Promise<TableSchema> {
  const tableName = generateTableName(week, day);
  const exercises = await getExerciseNames(supabase, week, day);

  return {
    tableName,
    exercises,
    totalExercises: exercises.length,
  };
}

/**
 * Gets the number of sets for a specific exercise
 * by checking which set columns exist in the table
 *
 * @param supabase - Supabase client instance
 * @param week - Week number (1-6)
 * @param day - Day number (1-6)
 * @param exerciseIndex - Exercise index (1-7)
 * @returns Number of sets (typically 3 or 4)
 *
 * @example
 * const setCount = await getSetCount(supabase, 1, 1, 1);
 * console.log(setCount); // 4 (if exercise_1_set4_reps exists)
 */
export async function getSetCount(
  supabase: ReturnType<typeof createClient>,
  week: number,
  day: number,
  exerciseIndex: number
): Promise<number> {
  const tableName = generateTableName(week, day);

  // Query to check which set columns exist
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = '${tableName}'
        AND column_name LIKE 'exercise_${exerciseIndex}_set%_reps'
      ORDER BY column_name;
    `,
  });

  if (error) {
    console.warn('Failed to get set count, defaulting to 4:', error);
    return 4; // Default to 4 sets
  }

  return data?.length || 4;
}

/**
 * Gets set counts for all exercises in a workout
 *
 * @param supabase - Supabase client instance
 * @param week - Week number (1-6)
 * @param day - Day number (1-6)
 * @returns Array of set counts (one per exercise)
 *
 * @example
 * const setCounts = await getAllSetCounts(supabase, 1, 1);
 * console.log(setCounts); // [4, 3, 3, 4, 4, 3, 3]
 */
export async function getAllSetCounts(
  supabase: ReturnType<typeof createClient>,
  week: number,
  day: number
): Promise<number[]> {
  const setCounts: number[] = [];

  for (let i = 1; i <= 7; i++) {
    const count = await getSetCount(supabase, week, day, i);
    setCounts.push(count);
  }

  return setCounts;
}

/**
 * Checks if a table exists in the database
 *
 * @param supabase - Supabase client instance
 * @param tableName - Table name to check
 * @returns true if table exists, false otherwise
 */
export async function tableExists(
  supabase: ReturnType<typeof createClient>,
  tableName: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = '${tableName}'
      );
    `,
  });

  if (error) {
    console.error('Failed to check table existence:', error);
    return false;
  }

  return data?.[0]?.exists || false;
}

/**
 * Verifies that all 36 workout tracking tables exist
 *
 * @param supabase - Supabase client instance
 * @returns Object with results for each table
 *
 * @example
 * const verification = await verifyAllTables(supabase);
 * console.log(verification.missingTables); // []
 */
export async function verifyAllTables(
  supabase: ReturnType<typeof createClient>
): Promise<{
  totalTables: number;
  existingTables: number;
  missingTables: string[];
}> {
  const missingTables: string[] = [];
  let existingTables = 0;

  for (let week = 1; week <= 6; week++) {
    for (let day = 1; day <= 6; day++) {
      const tableName = generateTableName(week, day);
      const exists = await tableExists(supabase, tableName);

      if (exists) {
        existingTables++;
      } else {
        missingTables.push(tableName);
      }
    }
  }

  return {
    totalTables: 36,
    existingTables,
    missingTables,
  };
}