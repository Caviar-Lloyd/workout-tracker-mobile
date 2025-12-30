/**
 * Workout Swap Service
 *
 * Handles real-time exercise swapping during workout sessions
 */

import { supabase } from './client';

export interface ExerciseSwap {
  originalExerciseName: string;
  newExerciseName: string;
  exerciseIndex: number;
  coachEmail: string;
  clientEmail?: string;
  reason?: string;
}

/**
 * Swap an exercise during a workout session
 */
export async function swapExercise({
  originalExerciseName,
  newExerciseName,
  exerciseIndex,
  coachEmail,
  clientEmail,
  reason,
}: ExerciseSwap) {
  try {
    // Log the swap
    const { error: logError } = await supabase
      .from('workout_modifications')
      .insert({
        coach_email: coachEmail,
        client_email: clientEmail,
        original_exercise_name: originalExerciseName,
        new_exercise_name: newExerciseName,
        exercise_index: exerciseIndex,
        modification_type: 'swap',
        reason,
      });

    if (logError) {
      console.error('Error logging swap:', logError);
      // Don't throw - swap should still work even if logging fails
    }

    // Increment popularity of new exercise
    try {
      await supabase.rpc('increment_exercise_popularity', {
        exercise_name: newExerciseName,
      });
    } catch (error) {
      console.log('Could not update popularity:', error);
    }

    return { success: true };
  } catch (error) {
    console.error('Error swapping exercise:', error);
    return { success: false, error };
  }
}

/**
 * Get recent exercise swaps for a coach
 */
export async function getRecentSwaps(coachEmail: string, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('workout_modifications')
      .select('original_exercise_name, new_exercise_name, created_at')
      .eq('coach_email', coachEmail)
      .eq('modification_type', 'swap')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { swaps: data || [], error: null };
  } catch (error) {
    console.error('Error fetching recent swaps:', error);
    return { swaps: [], error };
  }
}

/**
 * Get swap suggestions based on original exercise
 */
export async function getSwapSuggestions(exerciseName: string) {
  try {
    // First, try to get the exercise from the database
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('id, category, muscle_groups, alternatives, equipment')
      .ilike('name', exerciseName)
      .limit(1)
      .single();

    if (exerciseError || !exercise) {
      // Fallback to popular exercises
      return getPopularExercises();
    }

    // If exercise has predefined alternatives, use those
    if (exercise.alternatives && exercise.alternatives.length > 0) {
      const { data: altExercises, error: altError } = await supabase
        .from('exercises')
        .select('*')
        .in('name', exercise.alternatives)
        .order('popularity_score', { ascending: false });

      if (!altError && altExercises && altExercises.length > 0) {
        return { suggestions: altExercises, error: null };
      }
    }

    // Otherwise, find similar exercises by category and muscle groups
    let query = supabase
      .from('exercises')
      .select('*')
      .eq('category', exercise.category)
      .neq('name', exerciseName);

    // Filter by equipment if available
    if (exercise.equipment && exercise.equipment.length > 0) {
      query = query.overlaps('equipment', exercise.equipment);
    }

    const { data: similarExercises, error: similarError } = await query
      .order('popularity_score', { ascending: false })
      .limit(10);

    if (similarError) throw similarError;

    return { suggestions: similarExercises || [], error: null };
  } catch (error) {
    console.error('Error getting swap suggestions:', error);
    return { suggestions: [], error };
  }
}

/**
 * Get popular exercises as fallback
 */
export async function getPopularExercises(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('popularity_score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { suggestions: data || [], error: null };
  } catch (error) {
    console.error('Error fetching popular exercises:', error);
    return { suggestions: [], error };
  }
}

/**
 * Search exercises for swapping
 */
export async function searchExercisesForSwap(
  query: string,
  options?: {
    category?: string;
    equipment?: string[];
    limit?: number;
  }
) {
  const { category, equipment, limit = 10 } = options || {};

  try {
    const normalizedQuery = query.toLowerCase().trim();

    let searchQuery = supabase
      .from('exercises')
      .select('*');

    // Fuzzy search on name and keywords
    if (query) {
      searchQuery = searchQuery.or(
        `name.ilike.%${normalizedQuery}%,` +
        `search_keywords.cs.{${normalizedQuery}}`
      );
    }

    // Apply filters
    if (category) {
      searchQuery = searchQuery.eq('category', category);
    }

    if (equipment && equipment.length > 0) {
      searchQuery = searchQuery.overlaps('equipment', equipment);
    }

    // Order by relevance (popularity)
    searchQuery = searchQuery
      .order('popularity_score', { ascending: false })
      .limit(limit);

    const { data, error } = await searchQuery;

    if (error) throw error;

    return { exercises: data || [], error: null };
  } catch (error) {
    console.error('Error searching exercises:', error);
    return { exercises: [], error };
  }
}
