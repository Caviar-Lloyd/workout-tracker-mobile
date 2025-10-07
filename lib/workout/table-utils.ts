/**
 * Table Utilities for Shortcut to Shred Workout Tracking
 *
 * CRITICAL: These utilities prevent SQL injection by validating and sanitizing
 * table names before database queries. ALWAYS use these functions instead of
 * manual string interpolation.
 *
 * @module lib/workout/table-utils
 */

export type WeekNumber = 1 | 2 | 3 | 4 | 5 | 6;
export type DayNumber = 1 | 2 | 3 | 4 | 5 | 6;
export type PhaseNumber = 1 | 2;

/**
 * Validates that week and day numbers are within valid ranges
 *
 * @param week - Week number (1-6)
 * @param day - Day number (1-6)
 * @returns true if valid, false otherwise
 *
 * @example
 * validateWeekDay(1, 1) // true
 * validateWeekDay(0, 1) // false
 * validateWeekDay(7, 1) // false
 */
export function validateWeekDay(week: number, day: number): boolean {
  const isValidWeek = Number.isInteger(week) && week >= 1 && week <= 6;
  const isValidDay = Number.isInteger(day) && day >= 1 && day <= 6;
  return isValidWeek && isValidDay;
}

/**
 * Generates the table name for a specific week and day
 *
 * SECURITY: This function validates inputs to prevent SQL injection via
 * dynamic table names. All table access MUST use this function.
 *
 * @param week - Week number (1-6)
 * @param day - Day number (1-6)
 * @returns Table name string (e.g., "week1_day1_workout_tracking")
 * @throws Error if week or day is invalid
 *
 * @example
 * generateTableName(1, 1) // "week1_day1_workout_tracking"
 * generateTableName(6, 6) // "week6_day6_workout_tracking"
 * generateTableName(0, 1) // throws Error
 */
export function generateTableName(week: number, day: number): string {
  if (!validateWeekDay(week, day)) {
    throw new Error(
      `Invalid week (${week}) or day (${day}). Week and day must be integers between 1 and 6.`
    );
  }

  // Safe: week and day are validated integers
  return `week${week}_day${day}_workout_tracking`;
}

/**
 * Parses a table name to extract week and day numbers
 *
 * @param tableName - Table name string (e.g., "week3_day4_workout_tracking")
 * @returns Object with week and day numbers
 * @throws Error if table name format is invalid
 *
 * @example
 * parseTableName("week3_day4_workout_tracking") // { week: 3, day: 4 }
 * parseTableName("invalid_table") // throws Error
 */
export function parseTableName(tableName: string): { week: WeekNumber; day: DayNumber } {
  const match = tableName.match(/^week(\d+)_day(\d+)_workout_tracking$/);

  if (!match) {
    throw new Error(`Invalid table name format: ${tableName}`);
  }

  const week = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);

  if (!validateWeekDay(week, day)) {
    throw new Error(`Invalid week (${week}) or day (${day}) in table name: ${tableName}`);
  }

  return { week: week as WeekNumber, day: day as DayNumber };
}

/**
 * Determines the phase number based on week number
 * Phase 1: Weeks 1-3
 * Phase 2: Weeks 4-6
 *
 * @param week - Week number (1-6)
 * @returns Phase number (1 or 2)
 * @throws Error if week is invalid
 *
 * @example
 * getPhaseFromWeek(1) // 1
 * getPhaseFromWeek(4) // 2
 * getPhaseFromWeek(7) // throws Error
 */
export function getPhaseFromWeek(week: number): PhaseNumber {
  if (!Number.isInteger(week) || week < 1 || week > 6) {
    throw new Error(`Invalid week number: ${week}. Must be between 1 and 6.`);
  }

  return week <= 3 ? 1 : 2;
}

/**
 * Gets the workout type label for a specific day
 * Days 1-3: Multi-Joint (Compound movements)
 * Days 4-6: Isolation (Single-joint movements)
 *
 * @param day - Day number (1-6)
 * @returns Workout type label
 * @throws Error if day is invalid
 *
 * @example
 * getWorkoutType(1) // "Multi-Joint"
 * getWorkoutType(4) // "Isolation"
 */
export function getWorkoutType(day: number): 'Multi-Joint' | 'Isolation' {
  if (!Number.isInteger(day) || day < 1 || day > 6) {
    throw new Error(`Invalid day number: ${day}. Must be between 1 and 6.`);
  }

  return day <= 3 ? 'Multi-Joint' : 'Isolation';
}

/**
 * Gets the rep range for a specific week and workout type from actual workout data
 *
 * Multi-Joint (Days 1-3):
 * - Week 1: 9-11 reps
 * - Week 2: 6-8 reps
 * - Week 3: 2-5 reps
 * - Week 4: 9-11 reps (Phase 2 reset)
 * - Week 5: 6-8 reps
 * - Week 6: 2-5 reps
 *
 * Isolation (Days 4-6):
 * - Week 1: 12-15 reps
 * - Week 2: 16-20 reps
 * - Week 3: 21-30 reps (High rep week)
 * - Week 4: 12-15 reps (Phase 2 reset)
 * - Week 5: 16-20 reps
 * - Week 6: 21-30 reps (High rep week)
 *
 * @param week - Week number (1-6)
 * @param day - Day number (1-6)
 * @returns Rep range string (e.g., "9-11")
 */
export function getRepRange(week: number, day: number): string {
  if (!validateWeekDay(week, day)) {
    throw new Error(`Invalid week (${week}) or day (${day})`);
  }

  const workoutType = getWorkoutType(day);
  const weekInPhase = week <= 3 ? week : week - 3; // Week 1-3 or 1-3 within phase

  if (workoutType === 'Multi-Joint') {
    switch (weekInPhase) {
      case 1:
        return '9-11';
      case 2:
        return '6-8';
      case 3:
        return '2-5';
      default:
        throw new Error(`Invalid week in phase: ${weekInPhase}`);
    }
  } else {
    // Isolation
    switch (weekInPhase) {
      case 1:
        return '12-15';
      case 2:
        return '16-20';
      case 3:
        return '21-30';
      default:
        throw new Error(`Invalid week in phase: ${weekInPhase}`);
    }
  }
}

/**
 * Gets the rest period in seconds for a specific week and workout type
 *
 * Multi-Joint: 90, 120, 180 seconds
 * Isolation: 60, 75, 90 seconds
 *
 * @param week - Week number (1-6)
 * @param day - Day number (1-6)
 * @returns Rest period in seconds
 */
export function getRestPeriod(week: number, day: number): number {
  if (!validateWeekDay(week, day)) {
    throw new Error(`Invalid week (${week}) or day (${day})`);
  }

  const workoutType = getWorkoutType(day);
  const weekInPhase = week <= 3 ? week : week - 3;

  if (workoutType === 'Multi-Joint') {
    switch (weekInPhase) {
      case 1:
        return 90;
      case 2:
        return 120;
      case 3:
        return 180;
      default:
        return 90;
    }
  } else {
    // Isolation
    switch (weekInPhase) {
      case 1:
        return 60;
      case 2:
        return 75;
      case 3:
        return 90;
      default:
        return 60;
    }
  }
}

/**
 * Generates all 36 table names
 * Useful for batch operations or verification
 *
 * @returns Array of all 36 table names
 */
export function getAllTableNames(): string[] {
  const tables: string[] = [];
  for (let week = 1; week <= 6; week++) {
    for (let day = 1; day <= 6; day++) {
      tables.push(generateTableName(week, day));
    }
  }
  return tables;
}