/**
 * TypeScript Type Definitions for Workout Tracking
 *
 * Complete type safety for Recomposition Transformation workout tracking system
 *
 * @module types/workout
 */

// =====================================================
// Base Types
// =====================================================

export type WeekNumber = 1 | 2 | 3 | 4 | 5 | 6;
export type DayNumber = 1 | 2 | 3 | 4 | 5 | 6;
export type PhaseNumber = 1 | 2;
export type ExerciseIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type SetNumber = 1 | 2 | 3 | 4;

export type WorkoutType = 'Multi-Joint' | 'Isolation';
export type WorkoutStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped';

// =====================================================
// Set & Exercise Data
// =====================================================

/**
 * Individual set data
 */
export interface SetData {
  setNumber: SetNumber;
  targetReps: number;
  actualReps: number | null;
  targetWeight: number;
  actualWeight: number | null;
  completed: boolean;
}

/**
 * Exercise data with all sets
 */
export interface ExerciseData {
  exerciseIndex: ExerciseIndex;
  name: string;
  sets: SetData[];
  notes: string | null;
  completed: boolean;
}

/**
 * Exercise preview (before workout starts)
 */
export interface ExercisePreview {
  exerciseIndex: ExerciseIndex;
  name: string;
  sets: number;
  repRange: string;
  restSeconds: number;
}

// =====================================================
// Workout Session
// =====================================================

/**
 * Workout session state
 */
export interface WorkoutSession {
  id: string;
  week: WeekNumber;
  day: DayNumber;
  workoutDate: string; // ISO date string
  sessionStartTime: string | null; // ISO timestamp
  sessionEndTime: string | null; // ISO timestamp
  sessionCompleted: boolean;
  workoutDurationSeconds: number | null;
  workoutDurationFormatted: string | null;
  exercises: ExerciseData[];
  sessionNotes: string | null;
  currentExerciseIndex: ExerciseIndex;
  currentSetNumber: SetNumber;
}

/**
 * Workout session creation data
 */
export interface CreateWorkoutSessionData {
  week: WeekNumber;
  day: DayNumber;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  trainerName?: string | null;
  workoutDate?: string; // Defaults to current date
}

/**
 * Workout session update data (partial)
 */
export interface UpdateWorkoutSessionData {
  sessionEndTime?: string;
  sessionCompleted?: boolean;
  workoutDurationSeconds?: number;
  workoutDurationFormatted?: string;
  sessionNotes?: string;
  [key: string]: any; // Allow dynamic exercise columns
}

// =====================================================
// Database Row Types
// =====================================================

/**
 * Full workout tracking table row
 * (Represents the flat table structure)
 */
export interface WorkoutTrackingRow {
  // Primary key & timestamps
  id: string;
  created_at: string;
  updated_at: string;

  // Client information (denormalized)
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  trainer_name: string | null;

  // Session tracking
  workout_date: string;
  session_start_time: string | null;
  session_end_time: string | null;
  session_completed: boolean;
  workout_duration_seconds: number | null;
  workout_duration_formatted: string | null;
  session_notes: string | null;

  // Exercise 1 (4 sets)
  exercise_1_name: string;
  exercise_1_set1_reps: number | null;
  exercise_1_set1_weight: number | null;
  exercise_1_set2_reps: number | null;
  exercise_1_set2_weight: number | null;
  exercise_1_set3_reps: number | null;
  exercise_1_set3_weight: number | null;
  exercise_1_set4_reps: number | null;
  exercise_1_set4_weight: number | null;
  exercise_1_notes: string | null;

  // Exercise 2 (3 sets)
  exercise_2_name: string;
  exercise_2_set1_reps: number | null;
  exercise_2_set1_weight: number | null;
  exercise_2_set2_reps: number | null;
  exercise_2_set2_weight: number | null;
  exercise_2_set3_reps: number | null;
  exercise_2_set3_weight: number | null;
  exercise_2_notes: string | null;

  // Exercise 3 (3 sets)
  exercise_3_name: string;
  exercise_3_set1_reps: number | null;
  exercise_3_set1_weight: number | null;
  exercise_3_set2_reps: number | null;
  exercise_3_set2_weight: number | null;
  exercise_3_set3_reps: number | null;
  exercise_3_set3_weight: number | null;
  exercise_3_notes: string | null;

  // Exercise 4 (4 sets)
  exercise_4_name: string;
  exercise_4_set1_reps: number | null;
  exercise_4_set1_weight: number | null;
  exercise_4_set2_reps: number | null;
  exercise_4_set2_weight: number | null;
  exercise_4_set3_reps: number | null;
  exercise_4_set3_weight: number | null;
  exercise_4_set4_reps: number | null;
  exercise_4_set4_weight: number | null;
  exercise_4_notes: string | null;

  // Exercise 5 (4 sets)
  exercise_5_name: string;
  exercise_5_set1_reps: number | null;
  exercise_5_set1_weight: number | null;
  exercise_5_set2_reps: number | null;
  exercise_5_set2_weight: number | null;
  exercise_5_set3_reps: number | null;
  exercise_5_set3_weight: number | null;
  exercise_5_set4_reps: number | null;
  exercise_5_set4_weight: number | null;
  exercise_5_notes: string | null;

  // Exercise 6 (3 sets)
  exercise_6_name: string;
  exercise_6_set1_reps: number | null;
  exercise_6_set1_weight: number | null;
  exercise_6_set2_reps: number | null;
  exercise_6_set2_weight: number | null;
  exercise_6_set3_reps: number | null;
  exercise_6_set3_weight: number | null;
  exercise_6_notes: string | null;

  // Exercise 7 (3 sets)
  exercise_7_name: string;
  exercise_7_set1_reps: number | null;
  exercise_7_set1_weight: number | null;
  exercise_7_set2_reps: number | null;
  exercise_7_set2_weight: number | null;
  exercise_7_set3_reps: number | null;
  exercise_7_set3_weight: number | null;
  exercise_7_notes: string | null;
}

/**
 * Client table row
 */
export interface ClientRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  trainer_name: string | null;
  workout_date: string | null;
  current_week: number | null;
  current_phase: number | null;
  created_at: string;
}

// =====================================================
// UI State Types
// =====================================================

/**
 * Programs page state
 */
export interface ProgramsPageState {
  selectedWeek: WeekNumber | null;
  selectedDay: DayNumber | null;
  currentPhase: PhaseNumber;
  isWorkoutActive: boolean;
  workoutSessionId: string | null;
  workoutData: WorkoutDayData | null;
}

/**
 * Workout day data (for preview)
 */
export interface WorkoutDayData {
  week: WeekNumber;
  day: DayNumber;
  workoutType: WorkoutType;
  name: string;
  focusAreas: string[];
  estimatedDuration: number;
  exercises: ExercisePreview[];
  repRange: string;
  restPeriod: number;
}

/**
 * Exercise tracker state
 */
export interface ExerciseTrackerState {
  currentExerciseIndex: ExerciseIndex;
  currentSetNumber: SetNumber;
  exercises: ExerciseData[];
  isResting: boolean;
  restTimeRemaining: number;
  sessionStartTime: Date;
  totalDuration: number;
}

// =====================================================
// Form Types
// =====================================================

/**
 * Set log form data
 */
export interface SetLogFormData {
  reps: number;
  weight: number;
}

/**
 * Exercise notes form data
 */
export interface ExerciseNotesFormData {
  notes: string;
}

/**
 * Session notes form data
 */
export interface SessionNotesFormData {
  notes: string;
}

// =====================================================
// API Response Types
// =====================================================

/**
 * Workout history entry
 */
export interface WorkoutHistoryEntry {
  id: string;
  workoutDate: string;
  week: WeekNumber;
  day: DayNumber;
  completed: boolean;
  duration: number | null;
  durationFormatted: string | null;
}

/**
 * Exercise progress entry
 */
export interface ExerciseProgressEntry {
  date: string;
  exerciseName: string;
  sets: {
    setNumber: number;
    reps: number;
    weight: number;
  }[];
}

// =====================================================
// Validation Types
// =====================================================

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Set data validation schema (for Zod)
 */
export interface SetDataValidation {
  reps: number; // min: 0, max: 100
  weight: number; // min: 0, max: 1000
}

// =====================================================
// Utility Types
// =====================================================

/**
 * Partial workout session for updates
 */
export type PartialWorkoutSession = Partial<WorkoutSession>;

/**
 * Partial exercise data for updates
 */
export type PartialExerciseData = Partial<ExerciseData>;

/**
 * Workout table name type
 */
export type WorkoutTableName =
  `week${WeekNumber}_day${DayNumber}_workout_tracking`;

/**
 * Exercise column name pattern
 */
export type ExerciseColumnName =
  `exercise_${ExerciseIndex}_${string}`;