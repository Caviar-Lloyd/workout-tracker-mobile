/**
 * Column Mapper for Shortcut to Shred Workout Tracking
 *
 * CRITICAL: These utilities map form data to database columns and vice versa.
 * The flat table structure uses columns like exercise_1_set2_reps, exercise_1_set2_weight.
 * This module centralizes the mapping logic to prevent errors and injection attacks.
 *
 * @module lib/workout/column-mapper
 */

export type ExerciseIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type SetNumber = 1 | 2 | 3 | 4;
export type FieldType = 'reps' | 'weight' | 'notes';

/**
 * Set data structure for form inputs
 */
export interface SetData {
  reps: number | null;
  weight: number | null;
}

/**
 * Exercise data structure
 */
export interface ExerciseData {
  exerciseIndex: ExerciseIndex;
  name: string;
  sets: SetData[];
  notes: string | null;
}

/**
 * Validates exercise index is within valid range (1-7)
 *
 * @param exerciseIndex - Exercise index (1-7)
 * @returns true if valid, false otherwise
 */
export function validateExerciseIndex(exerciseIndex: number): boolean {
  return Number.isInteger(exerciseIndex) && exerciseIndex >= 1 && exerciseIndex <= 7;
}

/**
 * Validates set number is within valid range (1-4)
 *
 * @param setNumber - Set number (1-4)
 * @returns true if valid, false otherwise
 */
export function validateSetNumber(setNumber: number): boolean {
  return Number.isInteger(setNumber) && setNumber >= 1 && setNumber <= 4;
}

/**
 * Generates the column name for a specific exercise, set, and field
 *
 * SECURITY: This function validates inputs to prevent column name injection.
 * All column access MUST use this function.
 *
 * @param exerciseIndex - Exercise index (1-7)
 * @param setNumber - Set number (1-4)
 * @param field - Field type ('reps', 'weight', or 'notes')
 * @returns Column name string (e.g., "exercise_1_set2_reps")
 * @throws Error if exercise index or set number is invalid
 *
 * @example
 * getColumnName(1, 1, 'reps') // "exercise_1_set1_reps"
 * getColumnName(2, 3, 'weight') // "exercise_2_set3_weight"
 * getColumnName(1, 0, 'reps') // throws Error
 */
export function getColumnName(
  exerciseIndex: number,
  setNumber: number,
  field: FieldType
): string {
  if (!validateExerciseIndex(exerciseIndex)) {
    throw new Error(
      `Invalid exercise index: ${exerciseIndex}. Must be an integer between 1 and 7.`
    );
  }

  if (!validateSetNumber(setNumber)) {
    throw new Error(`Invalid set number: ${setNumber}. Must be an integer between 1 and 4.`);
  }

  // Safe: exerciseIndex and setNumber are validated integers
  return `exercise_${exerciseIndex}_set${setNumber}_${field}`;
}

/**
 * Gets the column name for exercise name
 *
 * @param exerciseIndex - Exercise index (1-7)
 * @returns Column name string (e.g., "exercise_1_name")
 * @throws Error if exercise index is invalid
 *
 * @example
 * getExerciseNameColumn(1) // "exercise_1_name"
 * getExerciseNameColumn(7) // "exercise_7_name"
 */
export function getExerciseNameColumn(exerciseIndex: number): string {
  if (!validateExerciseIndex(exerciseIndex)) {
    throw new Error(
      `Invalid exercise index: ${exerciseIndex}. Must be an integer between 1 and 7.`
    );
  }

  return `exercise_${exerciseIndex}_name`;
}

/**
 * Gets the column name for exercise notes
 *
 * @param exerciseIndex - Exercise index (1-7)
 * @returns Column name string (e.g., "exercise_1_notes")
 * @throws Error if exercise index is invalid
 */
export function getExerciseNotesColumn(exerciseIndex: number): string {
  if (!validateExerciseIndex(exerciseIndex)) {
    throw new Error(
      `Invalid exercise index: ${exerciseIndex}. Must be an integer between 1 and 7.`
    );
  }

  return `exercise_${exerciseIndex}_notes`;
}

/**
 * Maps set data to database column object
 *
 * Converts form data like { reps: 10, weight: 185 } to:
 * { exercise_1_set1_reps: 10, exercise_1_set1_weight: 185 }
 *
 * @param exerciseIndex - Exercise index (1-7)
 * @param setNumber - Set number (1-4)
 * @param data - Set data from form
 * @returns Object with column names as keys
 * @throws Error if exercise index or set number is invalid
 *
 * @example
 * mapSetToColumns(1, 1, { reps: 10, weight: 185 })
 * // Returns: { exercise_1_set1_reps: 10, exercise_1_set1_weight: 185 }
 */
export function mapSetToColumns(
  exerciseIndex: number,
  setNumber: number,
  data: SetData
): Record<string, number | null> {
  const repsColumn = getColumnName(exerciseIndex, setNumber, 'reps');
  const weightColumn = getColumnName(exerciseIndex, setNumber, 'weight');

  return {
    [repsColumn]: data.reps,
    [weightColumn]: data.weight,
  };
}

/**
 * Maps database columns to set data
 *
 * Converts database row like { exercise_1_set1_reps: 10, exercise_1_set1_weight: 185 }
 * to form data: { reps: 10, weight: 185 }
 *
 * @param columns - Database row (partial or full)
 * @param exerciseIndex - Exercise index (1-7)
 * @param setNumber - Set number (1-4)
 * @returns Set data object
 * @throws Error if exercise index or set number is invalid
 *
 * @example
 * const row = { exercise_1_set1_reps: 10, exercise_1_set1_weight: 185 };
 * mapColumnsToSet(row, 1, 1)
 * // Returns: { reps: 10, weight: 185 }
 */
export function mapColumnsToSet(
  columns: Record<string, any>,
  exerciseIndex: number,
  setNumber: number
): SetData {
  const repsColumn = getColumnName(exerciseIndex, setNumber, 'reps');
  const weightColumn = getColumnName(exerciseIndex, setNumber, 'weight');

  return {
    reps: columns[repsColumn] ?? null,
    weight: columns[weightColumn] ?? null,
  };
}

/**
 * Maps all sets for an exercise from database columns
 *
 * @param columns - Database row
 * @param exerciseIndex - Exercise index (1-7)
 * @param maxSets - Maximum number of sets to extract (default: 4)
 * @returns Array of set data
 */
export function mapExerciseSets(
  columns: Record<string, any>,
  exerciseIndex: number,
  maxSets: number = 4
): SetData[] {
  const sets: SetData[] = [];

  for (let setNum = 1; setNum <= maxSets; setNum++) {
    const setData = mapColumnsToSet(columns, exerciseIndex, setNum as SetNumber);

    // Only include set if it has data
    if (setData.reps !== null || setData.weight !== null) {
      sets.push(setData);
    }
  }

  return sets;
}

/**
 * Maps exercise data to database columns (including all sets)
 *
 * @param exerciseData - Exercise data with all sets
 * @returns Object with all column names and values
 */
export function mapExerciseToColumns(exerciseData: ExerciseData): Record<string, any> {
  const columns: Record<string, any> = {};

  // Map each set
  exerciseData.sets.forEach((setData, index) => {
    const setNumber = (index + 1) as SetNumber;
    const setColumns = mapSetToColumns(exerciseData.exerciseIndex, setNumber, setData);
    Object.assign(columns, setColumns);
  });

  // Map notes if provided
  if (exerciseData.notes !== null) {
    const notesColumn = getExerciseNotesColumn(exerciseData.exerciseIndex);
    columns[notesColumn] = exerciseData.notes;
  }

  return columns;
}

/**
 * Extracts all exercise data from a database row
 *
 * @param row - Full database row
 * @param exerciseCount - Number of exercises to extract (default: 7)
 * @returns Array of exercise data
 */
export function extractAllExercises(
  row: Record<string, any>,
  exerciseCount: number = 7
): ExerciseData[] {
  const exercises: ExerciseData[] = [];

  for (let exIndex = 1; exIndex <= exerciseCount; exIndex++) {
    const nameColumn = getExerciseNameColumn(exIndex);
    const notesColumn = getExerciseNotesColumn(exIndex);

    const exerciseData: ExerciseData = {
      exerciseIndex: exIndex as ExerciseIndex,
      name: row[nameColumn] || `Exercise ${exIndex}`,
      sets: mapExerciseSets(row, exIndex),
      notes: row[notesColumn] || null,
    };

    exercises.push(exerciseData);
  }

  return exercises;
}

/**
 * Creates an update object for a partial workout session
 * Useful for updating specific sets without affecting others
 *
 * @param updates - Array of exercise data to update
 * @returns Object with column names and values ready for database UPDATE
 *
 * @example
 * const updates = [
 *   { exerciseIndex: 1, sets: [{ reps: 10, weight: 185 }], notes: null }
 * ];
 * createPartialUpdate(updates)
 * // Returns: { exercise_1_set1_reps: 10, exercise_1_set1_weight: 185, updated_at: ... }
 */
export function createPartialUpdate(updates: ExerciseData[]): Record<string, any> {
  const columns: Record<string, any> = {};

  updates.forEach((exerciseData) => {
    const exerciseColumns = mapExerciseToColumns(exerciseData);
    Object.assign(columns, exerciseColumns);
  });

  // Always update the updated_at timestamp
  columns.updated_at = new Date().toISOString();

  return columns;
}