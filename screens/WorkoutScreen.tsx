import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase/client';
import { getWorkoutTemplate } from '../lib/supabase/workout-service';
import type { WeekNumber, DayNumber } from '../types/workout';
import ParticleBackground from '../components/ParticleBackground';

const WORKOUT_NAMES: Record<number, string> = {
  1: 'Chest, Triceps, Abs',
  2: 'Shoulders, Legs, Calves',
  3: 'Back, Traps, Biceps',
  4: 'Chest, Triceps, Abs',
  5: 'Shoulders, Legs, Calves',
  6: 'Back, Traps, Biceps',
};

interface SetData {
  reps: string;
  weight: string;
}

interface ExerciseData {
  [exerciseIndex: number]: SetData[];
}

interface WorkoutTemplate {
  tableName: string;
  exercises: Array<{
    index: number;
    name: string;
    videoUrl: string;
    setCount: number;
    repRange: string;
  }>;
}

export default function WorkoutScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const params = route.params as { week?: number; day?: number } || {};

  const week = (params.week || 1) as WeekNumber;
  const day = (params.day || 1) as DayNumber;

  const [workoutTemplate, setWorkoutTemplate] = useState<WorkoutTemplate | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(1);
  const [currentSetNumber, setCurrentSetNumber] = useState<number>(1);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [exerciseData, setExerciseData] = useState<ExerciseData>({});
  const [timerStarted, setTimerStarted] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStartedLogging, setHasStartedLogging] = useState(false);

  // Fetch workout template and week schedule
  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const template = await getWorkoutTemplate(week, day);
        setWorkoutTemplate(template);

        // Initialize exercise data with empty sets
        const initialData: ExerciseData = {};
        template.exercises.forEach((exercise) => {
          initialData[exercise.index] = Array.from({ length: exercise.setCount }, () => ({
            reps: '',
            weight: '',
          }));
        });
        setExerciseData(initialData);
      } catch (error) {
        console.error('Error fetching template:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkout();
  }, [week, day]);

  // Timer effect
  useEffect(() => {
    if (!timerStarted) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStarted]);

  // Auto-start timer when first input is filled
  useEffect(() => {
    if (!timerStarted) {
      const hasAnyInput = Object.values(exerciseData).some((sets) =>
        sets.some((set) => set.reps || set.weight)
      );
      if (hasAnyInput && !hasStartedLogging) {
        const now = new Date().toISOString();
        setStartTime(now);
        setTimerStarted(true);
        setHasStartedLogging(true);
      }
    }
  }, [exerciseData, timerStarted, hasStartedLogging]);

  const handleInputChange = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: string) => {
    setExerciseData((prev) => ({
      ...prev,
      [exerciseIndex]: prev[exerciseIndex].map((set, idx) =>
        idx === setIndex ? { ...set, [field]: value } : set
      ),
    }));

    updateCurrentSet();
  };

  const updateCurrentSet = () => {
    if (!workoutTemplate) return;

    for (const exercise of workoutTemplate.exercises) {
      const sets = exerciseData[exercise.index] || [];
      for (let i = 0; i < sets.length; i++) {
        if (!sets[i].reps || !sets[i].weight) {
          setCurrentExerciseIndex(exercise.index);
          setCurrentSetNumber(i + 1);
          return;
        }
      }
    }

    const lastExercise = workoutTemplate.exercises[workoutTemplate.exercises.length - 1];
    setCurrentExerciseIndex(lastExercise.index);
    setCurrentSetNumber(lastExercise.setCount);
  };

  const getProgress = () => {
    if (!workoutTemplate) return 0;
    let totalSets = 0;
    let completedSets = 0;

    workoutTemplate.exercises.forEach((exercise) => {
      const sets = exerciseData[exercise.index] || [];
      totalSets += exercise.setCount;
      completedSets += sets.filter((set) => set.reps && set.weight).length;
    });

    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs}s`;
  };

  const handleSubmit = async () => {
    if (!workoutTemplate) return;

    const currentProgress = getProgress();

    if (currentProgress < 100) {
      Alert.alert(
        'Incomplete Workout',
        `This workout is ${Math.round(currentProgress)}% complete. Do you want to save this partial workout?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: () => submitWorkout() }
        ]
      );
    } else {
      submitWorkout();
    }
  };

  const submitWorkout = async () => {
    if (!workoutTemplate || !startTime) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No user email');

      const { data: clientData } = await supabase
        .from('clients')
        .select('first_name, last_name')
        .eq('email', user.email.toLowerCase())
        .single();

      const firstName = clientData?.first_name || '';
      const lastName = clientData?.last_name || '';

      const exercises: any = {};
      const flatData: any = {};

      workoutTemplate.exercises.forEach((exercise) => {
        const sets = exerciseData[exercise.index] || [];

        exercises[`exercise_${exercise.index}`] = {
          name: exercise.name,
          sets: sets.map((set) => ({
            reps: set.reps ? parseInt(set.reps) : null,
            weight: set.weight ? parseFloat(set.weight) : null,
          })),
        };

        flatData[`exercise_${exercise.index}_name`] = exercise.name;
        sets.forEach((set, setIndex) => {
          const setNum = setIndex + 1;
          flatData[`exercise_${exercise.index}_set${setNum}_reps`] = set.reps ? parseInt(set.reps) : null;
          flatData[`exercise_${exercise.index}_set${setNum}_weight`] = set.weight ? parseFloat(set.weight) : null;
        });
      });

      const now = new Date().toISOString();
      const completionPercentage = Math.round(getProgress());

      const { error } = await supabase.from(workoutTemplate.tableName).insert({
        client_email: user.email,
        client_first_name: firstName,
        client_last_name: lastName,
        workout_date: now,
        session_completed: completionPercentage,
        session_start_time: startTime,
        session_end_time: now,
        workout_duration_formatted: formatTime(elapsedTime),
        exercises,
        ...flatData,
      });

      if (error) throw error;

      // Also insert into workout_starts table for calendar tracking
      const workoutDateOnly = now.split('T')[0]; // Get just the date part (YYYY-MM-DD)
      const { error: startsError } = await supabase.from('workout_starts').insert({
        client_email: user.email.toLowerCase(),
        week: workoutTemplate.week,
        day: workoutTemplate.day,
        workout_date: workoutDateOnly,
        start_time: startTime,
      });

      if (startsError) {
        console.error('Error inserting into workout_starts:', startsError);
        // Don't throw - workout was saved successfully, just log the error
      }

      const message = completionPercentage === 100
        ? 'Workout saved successfully!'
        : `Partial workout saved (${completionPercentage}% complete)`;

      Alert.alert('Success', message, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', error.message || 'Failed to save workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ddbdb" />
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }

  if (!workoutTemplate) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  const workoutName = WORKOUT_NAMES[day] || `Day ${day}`;
  const currentExercise = workoutTemplate.exercises.find(e => e.index === currentExerciseIndex);

  return (
    <View style={styles.outerContainer}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0a0e27', '#1a1f3a', '#2a1f3a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* Dark Overlay (25% opacity) */}
      <View style={styles.darkOverlay} />

      {/* Particle Background */}
      <ParticleBackground />

      {/* Content Wrapper */}
      <View style={styles.contentWrapper}>
        <View style={[styles.content, {
          paddingTop: Math.max(insets.top, 20) + 10,
          paddingBottom: Math.max(insets.bottom, 20) + 60,
        }]}>
          {/* Header */}
          <View style={styles.header}>
          <Text style={styles.title}>{workoutName}</Text>
          <Text style={styles.subtitle}>Week {week}, Day {day}</Text>
        </View>

        {/* Timer, Progress, and Submit Button */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Progress</Text>
            <Text style={styles.statValue}>{Math.round(getProgress())}%</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.submitButtonTop,
              (isSubmitting || !hasStartedLogging) && styles.submitButtonDisabled,
              getProgress() === 100 && styles.submitButtonComplete
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !hasStartedLogging}
          >
            <Text style={styles.submitButtonTopText}>
              {isSubmitting
                ? 'Saving...'
                : !hasStartedLogging
                  ? 'Start Logging'
                  : getProgress() === 100
                    ? 'Complete Workout'
                    : 'Submit Partial'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Two Column Layout */}
        <View style={styles.mainContent}>
          {/* Left Column - Exercise List */}
          <View style={styles.exerciseColumn}>
            <View style={styles.exerciseListHeader}>
              <Text style={styles.exerciseListTitle}>Exercises</Text>
              <Text style={styles.exerciseListSubtitle}>{workoutTemplate.exercises.length} exercises</Text>
            </View>

            <ScrollView
              style={styles.exerciseList}
              showsVerticalScrollIndicator={false}
            >
              {workoutTemplate.exercises.map((exercise, index) => {
                const sets = exerciseData[exercise.index] || [];
                const completedSets = sets.filter(set => set.reps && set.weight).length;
                const isActive = currentExerciseIndex === exercise.index;

                return (
                  <TouchableOpacity
                    key={exercise.index}
                    style={[
                      styles.exerciseItem,
                      isActive && styles.exerciseItemActive
                    ]}
                    onPress={() => setCurrentExerciseIndex(exercise.index)}
                  >
                    <View style={styles.exerciseNumberBadge}>
                      <Text style={[
                        styles.exerciseNumberText,
                        isActive && styles.exerciseNumberTextActive
                      ]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={[
                        styles.exerciseName,
                        isActive && styles.exerciseNameActive
                      ]}>
                        {exercise.name}
                      </Text>
                      <Text style={styles.exerciseDetails}>
                        {completedSets}/{exercise.setCount} sets
                      </Text>
                    </View>
                    {completedSets === exercise.setCount && (
                      <Text style={styles.completedIndicator}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Right Column - Workout Tracker */}
          <View style={styles.trackerColumn}>
            {currentExercise ? (
              <>
                <View style={styles.trackerHeader}>
                  <Text style={styles.trackerTitle}>{currentExercise.name}</Text>
                  <Text style={styles.trackerSubtitle}>
                    {currentExercise.setCount} sets × {currentExercise.repRange} reps
                  </Text>
                </View>

                {/* Video/GIF Preview Section */}
                <View style={styles.videoPreviewContainer}>
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoPlaceholderText}>Movement Pattern</Text>
                    <Text style={styles.videoPlaceholderSubtext}>3-5 sec demo</Text>
                  </View>
                </View>

                <ScrollView style={styles.setsContainer} showsVerticalScrollIndicator={false}>
                  {(exerciseData[currentExercise.index] || []).map((set, setIndex) => (
                    <View key={setIndex} style={styles.setRow}>
                      <Text style={styles.setNumber}>Set {setIndex + 1}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Reps"
                        placeholderTextColor="#6b7280"
                        value={set.reps}
                        onChangeText={(value) => handleInputChange(currentExercise.index, setIndex, 'reps', value)}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Weight"
                        placeholderTextColor="#6b7280"
                        value={set.weight}
                        onChangeText={(value) => handleInputChange(currentExercise.index, setIndex, 'weight', value)}
                        keyboardType="decimal-pad"
                      />
                      {set.reps && set.weight && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : (
              <View style={styles.trackerPlaceholder}>
                <Text style={styles.trackerPlaceholderText}>
                  Select an exercise to start tracking
                </Text>
              </View>
            )}
          </View>
        </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    position: 'relative' as const,
  },
  gradient: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
  },
  darkOverlay: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    zIndex: 1,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 768 : undefined,
    alignSelf: 'center',
    zIndex: 2,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2ddbdb',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  statBox: {
    flex: 0.7,
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  submitButtonTop: {
    flex: 1,
    backgroundColor: 'rgba(255, 165, 0, 0.8)',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.5)',
  },
  submitButtonComplete: {
    backgroundColor: '#2ddbdb',
    borderColor: 'rgba(45, 219, 219, 0.5)',
  },
  submitButtonTopText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  exerciseColumn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  exerciseListHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
  },
  exerciseListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  exerciseListSubtitle: {
    fontSize: 11,
    color: '#2ddbdb',
  },
  exerciseList: {
    flex: 1,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  exerciseItemActive: {
    backgroundColor: 'rgba(45, 219, 219, 0.15)',
  },
  exerciseNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9ca3af',
  },
  exerciseNumberTextActive: {
    color: '#2ddbdb',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  exerciseNameActive: {
    color: '#2ddbdb',
  },
  exerciseDetails: {
    fontSize: 11,
    color: '#9ca3af',
  },
  completedIndicator: {
    fontSize: 16,
    color: '#10b981',
    marginLeft: 8,
  },
  trackerColumn: {
    flex: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  trackerHeader: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
  },
  trackerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  trackerSubtitle: {
    fontSize: 10,
    color: '#2ddbdb',
  },
  videoPreviewContainer: {
    height: 120,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoPlaceholderText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  videoPlaceholderSubtext: {
    color: '#6b7280',
    fontSize: 10,
    marginTop: 4,
  },
  setsContainer: {
    flex: 1,
    padding: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  setNumber: {
    width: 45,
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 3,
    color: '#fff',
    fontSize: 13,
  },
  checkmark: {
    fontSize: 16,
    color: '#10b981',
    marginLeft: 6,
  },
  trackerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  trackerPlaceholderText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
});
