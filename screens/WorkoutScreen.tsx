import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase/client';
import { getWorkoutTemplate } from '../lib/supabase/workout-service';
import type { WeekNumber, DayNumber } from '../types/workout';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Button, ProgressBar } from '../components/ui';
import DNALoader from '../components/DNALoader';
import ExerciseSwapModal from '../components/ExerciseSwapModal';
import { X, Clock, SwapHorizontal } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Placeholder exercise images - replace with actual images from Supabase
const PLACEHOLDER_EXERCISE_IMAGE = 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800';

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
  week: number;
  day: number;
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
  const params = route.params as { week?: number; day?: number; clientEmail?: string; clientName?: string } || {};

  const week = (params.week || 1) as WeekNumber;
  const day = (params.day || 1) as DayNumber;
  const clientEmail = params.clientEmail;
  const clientName = params.clientName;

  const [workoutTemplate, setWorkoutTemplate] = useState<WorkoutTemplate | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [exerciseData, setExerciseData] = useState<ExerciseData>({});
  const [startTime, setStartTime] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [exerciseToSwap, setExerciseToSwap] = useState<{ name: string; index: number } | null>(null);

  // Fetch workout template
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

        // Auto-start timer
        const now = new Date().toISOString();
        setStartTime(now);
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
    if (!startTime) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const handleInputChange = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: string) => {
    setExerciseData((prev) => ({
      ...prev,
      [exerciseIndex]: prev[exerciseIndex].map((set, idx) =>
        idx === setIndex ? { ...set, [field]: value } : set
      ),
    }));
  };

  const handleSwapExercise = (newExerciseName: string, exerciseIndex: number) => {
    if (!workoutTemplate) return;

    // Update the exercise name in the template
    setWorkoutTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) =>
          ex.index === exerciseIndex ? { ...ex, name: newExerciseName } : ex
        ),
      };
    });

    setSwapModalVisible(false);
    setExerciseToSwap(null);
  };

  const openSwapModal = (exercise: { name: string; index: number }) => {
    setExerciseToSwap(exercise);
    setSwapModalVisible(true);
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
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      const emailToUse = clientEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!emailToUse) throw new Error('No user email');

      const { data: clientData } = await supabase
        .from('clients')
        .select('first_name, last_name')
        .eq('email', emailToUse.toLowerCase())
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

      const workoutData = {
        client_email: emailToUse,
        client_first_name: firstName,
        client_last_name: lastName,
        workout_date: now,
        session_completed: completionPercentage === 100,
        session_start_time: startTime,
        session_end_time: now,
        duration_formatted: formatTime(elapsedTime),
        exercises,
        ...flatData,
      };

      const { data: insertedData, error } = await supabase.from(workoutTemplate.tableName).insert(workoutData).select();

      if (error) throw error;

      // Also insert into workout_starts table for calendar tracking
      const workoutDateOnly = now.split('T')[0];
      await supabase.from('workout_starts').insert({
        client_email: emailToUse.toLowerCase(),
        week: workoutTemplate.week,
        day: workoutTemplate.day,
        workout_date: workoutDateOnly,
        start_time: startTime,
      });

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
        <DNALoader />
      </View>
    );
  }

  if (!workoutTemplate) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  const workoutName = WORKOUT_NAMES[day] || `Day ${day}`;
  const currentExercise = workoutTemplate.exercises[currentExerciseIndex];
  const progress = getProgress();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{workoutName}</Text>
            {clientName && <Text style={styles.headerSubtitle}>{clientName}</Text>}
          </View>

          <View style={styles.timerBadge}>
            <Clock size={14} color={colors.primary} />
            <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <ProgressBar
            current={Math.round(progress)}
            total={100}
            showPercentage
            showFraction={false}
            height={6}
          />
        </View>
      </View>

      {/* Exercise Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Exercise Image */}
        <View style={styles.exerciseImageContainer}>
          <Image
            source={{ uri: currentExercise.videoUrl || PLACEHOLDER_EXERCISE_IMAGE }}
            style={styles.exerciseImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={styles.imageGradient}
          >
            <View style={styles.exerciseInfo}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseTitleContainer}>
                  <Text style={styles.exerciseNumber}>
                    {currentExerciseIndex + 1} / {workoutTemplate.exercises.length}
                  </Text>
                  <Text style={styles.exerciseName}>{currentExercise.name}</Text>
                  <Text style={styles.exerciseTarget}>{currentExercise.repRange} reps</Text>
                </View>

                {/* Swap Button - Only show for coaches */}
                {clientEmail && (
                  <TouchableOpacity
                    style={styles.swapButton}
                    onPress={() => openSwapModal({ name: currentExercise.name, index: currentExercise.index })}
                  >
                    <SwapHorizontal size={20} color={colors.primary} />
                    <Text style={styles.swapButtonText}>Swap</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Sets Input */}
        <View style={styles.setsContainer}>
          <Text style={styles.setsTitle}>SETS</Text>

          {(exerciseData[currentExercise.index] || []).map((set, setIndex) => {
            const isComplete = set.reps && set.weight;
            return (
              <View key={setIndex} style={styles.setRow}>
                <View style={styles.setNumber}>
                  <Text style={styles.setNumberText}>{setIndex + 1}</Text>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>REPS</Text>
                    <TextInput
                      style={[styles.input, isComplete && styles.inputComplete]}
                      placeholder="0"
                      placeholderTextColor={colors.gray600}
                      value={set.reps}
                      onChangeText={(value) => handleInputChange(currentExercise.index, setIndex, 'reps', value)}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>WEIGHT (LBS)</Text>
                    <TextInput
                      style={[styles.input, isComplete && styles.inputComplete]}
                      placeholder="0"
                      placeholderTextColor={colors.gray600}
                      value={set.weight}
                      onChangeText={(value) => handleInputChange(currentExercise.index, setIndex, 'weight', value)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {isComplete && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Exercise Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentExerciseIndex === 0 && styles.navButtonDisabled]}
            onPress={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
            disabled={currentExerciseIndex === 0}
          >
            <Text style={[styles.navButtonText, currentExerciseIndex === 0 && styles.navButtonTextDisabled]}>
              ← Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              currentExerciseIndex === workoutTemplate.exercises.length - 1 && styles.navButtonDisabled
            ]}
            onPress={() => setCurrentExerciseIndex(Math.min(workoutTemplate.exercises.length - 1, currentExerciseIndex + 1))}
            disabled={currentExerciseIndex === workoutTemplate.exercises.length - 1}
          >
            <Text style={[
              styles.navButtonText,
              currentExerciseIndex === workoutTemplate.exercises.length - 1 && styles.navButtonTextDisabled
            ]}>
              Next →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Exercise List */}
        <View style={styles.exerciseList}>
          <Text style={styles.exerciseListTitle}>ALL EXERCISES</Text>
          {workoutTemplate.exercises.map((exercise, index) => {
            const sets = exerciseData[exercise.index] || [];
            const completedSets = sets.filter((set) => set.reps && set.weight).length;
            const isActive = index === currentExerciseIndex;

            return (
              <TouchableOpacity
                key={exercise.index}
                style={[styles.exerciseListItem, isActive && styles.exerciseListItemActive]}
                onPress={() => setCurrentExerciseIndex(index)}
              >
                <View style={styles.exerciseListLeft}>
                  <View style={[styles.exerciseListNumber, isActive && styles.exerciseListNumberActive]}>
                    <Text style={[styles.exerciseListNumberText, isActive && styles.exerciseListNumberTextActive]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.exerciseListName, isActive && styles.exerciseListNameActive]}>
                      {exercise.name}
                    </Text>
                    <Text style={styles.exerciseListSets}>
                      {completedSets}/{exercise.setCount} sets
                    </Text>
                  </View>
                </View>
                {completedSets === exercise.setCount && (
                  <Text style={styles.exerciseListCheck}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Submit Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Button
          onPress={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
          fullWidth
          variant={progress === 100 ? 'primary' : 'secondary'}
        >
          {progress === 100 ? 'Complete Workout' : `Save Progress (${Math.round(progress)}%)`}
        </Button>
      </View>

      {/* Exercise Swap Modal */}
      {exerciseToSwap && (
        <ExerciseSwapModal
          visible={swapModalVisible}
          currentExerciseName={exerciseToSwap.name}
          currentExerciseIndex={exerciseToSwap.index}
          onClose={() => {
            setSwapModalVisible(false);
            setExerciseToSwap(null);
          }}
          onSwap={handleSwapExercise}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginTop: spacing.md,
  },

  // Header
  header: {
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.gray400,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.glassLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  timerText: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: spacing.sm,
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },

  // Exercise Image
  exerciseImageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray900,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
  },
  exerciseInfo: {
    padding: spacing.lg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  exerciseTitleContainer: {
    flex: 1,
  },
  exerciseNumber: {
    ...typography.overline,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  exerciseName: {
    ...typography.h2,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  exerciseTarget: {
    ...typography.body,
    color: colors.gray400,
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.glassLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  swapButtonText: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '600',
  },

  // Sets Input
  setsContainer: {
    padding: spacing.lg,
  },
  setsTitle: {
    ...typography.overline,
    color: colors.gray400,
    marginBottom: spacing.md,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  setNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  setNumberText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
  },
  inputGroup: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.white,
    ...typography.h4,
    textAlign: 'center',
  },
  inputComplete: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Navigation
  navigationContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  navButton: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: colors.gray600,
  },

  // Exercise List
  exerciseList: {
    paddingHorizontal: spacing.lg,
  },
  exerciseListTitle: {
    ...typography.overline,
    color: colors.gray400,
    marginBottom: spacing.md,
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exerciseListItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  exerciseListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  exerciseListNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseListNumberActive: {
    backgroundColor: colors.primary + '20',
  },
  exerciseListNumberText: {
    ...typography.label,
    color: colors.gray400,
    fontWeight: '600',
  },
  exerciseListNumberTextActive: {
    color: colors.primary,
  },
  exerciseListName: {
    ...typography.body,
    color: colors.white,
    marginBottom: 2,
  },
  exerciseListNameActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  exerciseListSets: {
    ...typography.caption,
    color: colors.gray500,
  },
  exerciseListCheck: {
    color: colors.success,
    fontSize: 20,
  },

  // Footer
  footer: {
    backgroundColor: colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
