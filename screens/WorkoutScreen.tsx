import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Platform, Animated } from 'react-native';
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

  // Animated value for scroll indicator pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  // Pulse animation for scroll indicator
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleInputChange = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: string) => {
    setExerciseData((prev) => ({
      ...prev,
      [exerciseIndex]: prev[exerciseIndex].map((set, idx) =>
        idx === setIndex ? { ...set, [field]: value } : set
      ),
    }));
    // Removed auto-advance - user manually selects exercises
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
          paddingBottom: Math.max(insets.bottom, 20) + 20,
        }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{workoutName}</Text>
            <Text style={styles.subtitle}>Week {week}, Day {day}</Text>
          </View>

          {/* Main Container with Video and 3 Columns */}
          <View style={styles.mainContainer}>
            {/* 16:9 Video Container */}
            <View style={styles.videoContainer}>
              {currentExercise ? (
                <View style={styles.videoWrapper}>
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoPlaceholderText}>{currentExercise.name}</Text>
                    <Text style={styles.videoPlaceholderSubtext}>3-5 sec demo</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.videoPlaceholderText}>Select an exercise</Text>
                </View>
              )}
            </View>

            {/* Three Column Layout with Progress Bar */}
            <View style={styles.threeColumnLayout}>
              {/* Top Row: Exercises | Reps | Weight */}
              <View style={styles.topRow}>
                {/* Left: Exercise List (4 items max visible) */}
                <View style={styles.column1}>
                  <View style={styles.columnHeader}>
                    <Text style={styles.columnTitle}>Exercises</Text>
                  </View>
                  <View style={styles.scrollableContainer}>
                    <ScrollView
                      style={styles.exerciseScrollList}
                      contentContainerStyle={styles.exerciseScrollContent}
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
                              styles.exerciseButton,
                              isActive && styles.exerciseButtonActive
                            ]}
                            onPress={() => setCurrentExerciseIndex(exercise.index)}
                          >
                            <View style={styles.exerciseButtonContent}>
                              <Text style={[styles.exerciseNumber, isActive && styles.exerciseNumberActive]}>
                                {index + 1}
                              </Text>
                              <View style={styles.exerciseTextContainer}>
                                <Text
                                  style={[styles.exerciseButtonName, isActive && styles.exerciseButtonNameActive]}
                                  numberOfLines={2}
                                >
                                  {exercise.name}
                                </Text>
                                <Text style={styles.exerciseProgress}>
                                  {completedSets}/{exercise.setCount}
                                </Text>
                              </View>
                            </View>
                            {completedSets === exercise.setCount && (
                              <Text style={styles.completedCheck}>✓</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    {/* Scroll indicator */}
                    {workoutTemplate.exercises.length > 4 && (
                      <View style={styles.scrollIndicator}>
                        <Animated.Text style={[styles.scrollArrow, { opacity: pulseAnim }]}>
                          ↓
                        </Animated.Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Right: Reps and Weight Columns */}
                <View style={styles.inputsWrapper}>
                  {/* Column 2: Reps Input */}
                  <View style={styles.column2}>
                    <View style={styles.columnHeader}>
                      <Text style={styles.columnTitle}>Reps</Text>
                    </View>
                    <View style={styles.inputColumn}>
                      {currentExercise && (exerciseData[currentExercise.index] || []).map((set, setIndex) => (
                        <View key={setIndex} style={styles.inputRow}>
                          <Text style={styles.setLabel}>{setIndex + 1}</Text>
                          <TextInput
                            style={styles.columnInput}
                            placeholder="0"
                            placeholderTextColor="#6b7280"
                            value={set.reps}
                            onChangeText={(value) => handleInputChange(currentExercise.index, setIndex, 'reps', value)}
                            keyboardType="numeric"
                          />
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Column 3: Weight Input */}
                  <View style={styles.column3}>
                    <View style={styles.columnHeader}>
                      <Text style={styles.columnTitle}>Weight</Text>
                    </View>
                    <View style={styles.inputColumn}>
                      {currentExercise && (exerciseData[currentExercise.index] || []).map((set, setIndex) => (
                        <View key={setIndex} style={styles.inputRow}>
                          <Text style={styles.setLabel}>{setIndex + 1}</Text>
                          <TextInput
                            style={styles.columnInput}
                            placeholder="0"
                            placeholderTextColor="#6b7280"
                            value={set.weight}
                            onChangeText={(value) => handleInputChange(currentExercise.index, setIndex, 'weight', value)}
                            keyboardType="decimal-pad"
                          />
                          {set.reps && set.weight && (
                            <Text style={styles.inputCheckmark}>✓</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {/* Submit Button (full width) */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (isSubmitting || !hasStartedLogging) && styles.submitButtonDisabled,
                  getProgress() === 100 && styles.submitButtonComplete
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting || !hasStartedLogging}
              >
                <Text style={styles.submitButtonText}>
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
  // Main container with video and columns
  mainContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  // 16:9 Video Container
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoWrapper: {
    flex: 1,
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  videoPlaceholderText: {
    color: '#2ddbdb',
    fontSize: 14,
    fontWeight: '600',
  },
  videoPlaceholderSubtext: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 4,
  },
  // Three Column Layout with Progress Bar
  threeColumnLayout: {
    flexDirection: 'column',
  },
  topRow: {
    flexDirection: 'row',
    height: 240,
  },
  column1: {
    flex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(45, 219, 219, 0.3)',
  },
  inputsWrapper: {
    flex: 2,
    flexDirection: 'row',
  },
  column2: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(45, 219, 219, 0.3)',
  },
  column3: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  columnHeader: {
    padding: 10,
    backgroundColor: 'rgba(45, 219, 219, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  columnTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2ddbdb',
    textAlign: 'center',
  },
  // Exercise List (Column 1)
  scrollableContainer: {
    flex: 1,
    position: 'relative',
  },
  exerciseScrollList: {
    flex: 1,
  },
  exerciseScrollContent: {
    paddingBottom: 25,
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(45, 219, 219, 0.3)',
  },
  scrollArrow: {
    fontSize: 14,
    color: '#2ddbdb',
    fontWeight: 'bold',
  },
  exerciseButton: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseButtonActive: {
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
  },
  exerciseButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9ca3af',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 8,
  },
  exerciseNumberActive: {
    color: '#2ddbdb',
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
  },
  exerciseTextContainer: {
    flex: 1,
  },
  exerciseButtonName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  exerciseButtonNameActive: {
    color: '#2ddbdb',
  },
  exerciseProgress: {
    fontSize: 10,
    color: '#9ca3af',
  },
  completedCheck: {
    fontSize: 14,
    color: '#10b981',
    marginLeft: 8,
  },
  // Input Columns (Column 2 & 3)
  inputColumn: {
    flex: 1,
    padding: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  setLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    width: 16,
  },
  columnInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputCheckmark: {
    fontSize: 14,
    color: '#10b981',
    width: 18,
  },
  // Submit Button
  submitButton: {
    height: 60,
    backgroundColor: '#10b981',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonComplete: {
    backgroundColor: '#2ddbdb',
    shadowColor: '#2ddbdb',
  },
  submitButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
