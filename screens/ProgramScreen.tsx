import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getWorkoutTemplate } from '../lib/supabase/workout-service';
import type { WeekNumber, DayNumber } from '../types/workout';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import ParticleBackground from '../components/ParticleBackground';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const WORKOUT_DAYS = [
  { day: 1, name: 'Chest, Triceps, Abs', type: 'Multi-Joint' },
  { day: 2, name: 'Shoulders, Legs, Calves', type: 'Multi-Joint' },
  { day: 3, name: 'Back, Traps, Biceps', type: 'Multi-Joint' },
  { day: 4, name: 'Chest, Triceps, Abs', type: 'Isolation' },
  { day: 5, name: 'Shoulders, Legs, Calves', type: 'Isolation' },
  { day: 6, name: 'Back, Traps, Biceps', type: 'Isolation' },
];

interface Exercise {
  index: number;
  name: string;
  videoUrl: string;
  setCount: number;
  repRange: string;
}

export default function ProgramScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPhase, setSelectedPhase] = useState<1 | 2>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch exercises when day or phase changes
  useEffect(() => {
    fetchExercises();
  }, [selectedDay, selectedPhase]);

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const week = (selectedPhase === 1 ? 1 : 4) as WeekNumber;
      const template = await getWorkoutTemplate(week, selectedDay as DayNumber);
      setExercises(template.exercises);
      setSelectedExerciseIndex(0);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedWorkoutDay = WORKOUT_DAYS.find(d => d.day === selectedDay);
  const selectedExercise = exercises[selectedExerciseIndex];

  return (
    <View style={styles.container}>
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
          paddingTop: Math.max(insets.top, 20) + 10, // Minimal top padding for safe area
          paddingBottom: Math.max(insets.bottom, 20) + 60, // Space for bottom menu
        }]}>
        {/* Header */}
        <View style={styles.header}>
        <Text style={styles.title}>Program Overview</Text>
        <Text style={styles.subtitle}>Complete 12-Week Eccentric Training System</Text>
      </View>

      {/* Combined Phase and Day Selector */}
      <View style={styles.phaseAndDayContainer}>
        {/* Phase 1 Row */}
        <View style={styles.phaseRow}>
          <TouchableOpacity
            style={[styles.phaseButton, selectedPhase === 1 && styles.phaseButtonActive]}
            onPress={() => setSelectedPhase(1)}
          >
            <Text style={[styles.phaseButtonText, selectedPhase === 1 && styles.phaseButtonTextActive]}>
              Phase 1
            </Text>
            <Text style={[styles.phaseWeeks, selectedPhase === 1 && styles.phaseWeeksActive]}>
              Weeks 1-3
            </Text>
          </TouchableOpacity>

          <View style={styles.dayChipsRow}>
            {WORKOUT_DAYS.slice(0, 3).map((workout) => (
              <TouchableOpacity
                key={workout.day}
                style={[
                  styles.dayChip,
                  selectedDay === workout.day && styles.dayChipActive
                ]}
                onPress={() => setSelectedDay(workout.day)}
              >
                <Text style={[
                  styles.dayChipNumber,
                  selectedDay === workout.day && styles.dayChipNumberActive
                ]}>
                  Day {workout.day}
                </Text>
                <Text style={[
                  styles.dayChipName,
                  selectedDay === workout.day && styles.dayChipNameActive
                ]}>
                  {workout.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Phase 2 Row */}
        <View style={styles.phaseRow}>
          <TouchableOpacity
            style={[styles.phaseButton, selectedPhase === 2 && styles.phaseButtonActive]}
            onPress={() => setSelectedPhase(2)}
          >
            <Text style={[styles.phaseButtonText, selectedPhase === 2 && styles.phaseButtonTextActive]}>
              Phase 2
            </Text>
            <Text style={[styles.phaseWeeks, selectedPhase === 2 && styles.phaseWeeksActive]}>
              Weeks 4-6
            </Text>
          </TouchableOpacity>

          <View style={styles.dayChipsRow}>
            {WORKOUT_DAYS.slice(3, 6).map((workout) => (
              <TouchableOpacity
                key={workout.day}
                style={[
                  styles.dayChip,
                  selectedDay === workout.day && styles.dayChipActive
                ]}
                onPress={() => setSelectedDay(workout.day)}
              >
                <Text style={[
                  styles.dayChipNumber,
                  selectedDay === workout.day && styles.dayChipNumberActive
                ]}>
                  Day {workout.day}
                </Text>
                <Text style={[
                  styles.dayChipName,
                  selectedDay === workout.day && styles.dayChipNameActive
                ]}>
                  {workout.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Main Content Area - Two Columns */}
      <View style={styles.mainContent}>
        {/* Left Column - Exercise List */}
        <View style={styles.exerciseColumn}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseHeaderTitle}>
              {selectedWorkoutDay?.name}
            </Text>
            <Text style={styles.exerciseHeaderSubtitle}>
              {selectedWorkoutDay?.type}
            </Text>
          </View>

          <ScrollView
            style={styles.exerciseList}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : (
              exercises.map((exercise, index) => (
                <TouchableOpacity
                  key={exercise.index}
                  style={[
                    styles.exerciseItem,
                    selectedExerciseIndex === index && styles.exerciseItemActive
                  ]}
                  onPress={() => setSelectedExerciseIndex(index)}
                >
                  <View style={styles.exerciseNumberBadge}>
                    <Text style={[
                      styles.exerciseNumberText,
                      selectedExerciseIndex === index && styles.exerciseNumberTextActive
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={[
                      styles.exerciseName,
                      selectedExerciseIndex === index && styles.exerciseNameActive
                    ]}>
                      {exercise.name}
                    </Text>
                    <Text style={styles.exerciseDetails}>
                      {exercise.setCount} sets × {exercise.repRange} reps
                    </Text>
                  </View>
                  {selectedExerciseIndex === index && (
                    <Text style={styles.playingIndicator}>▶</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Right Column - Video Player */}
        <View style={styles.videoColumn}>
          <View style={styles.videoHeader}>
            <Text style={styles.videoHeaderTitle}>
              {selectedExercise ? selectedExercise.name : 'Select an exercise'}
            </Text>
            {selectedExercise && (
              <Text style={styles.videoHeaderDetails}>
                {selectedExercise.setCount} sets × {selectedExercise.repRange} reps
              </Text>
            )}
          </View>

          {selectedExercise ? (
            <View style={styles.videoContainer}>
              <CustomVideoPlayer videoUrl={selectedExercise.videoUrl} />
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>
                Select an exercise to view video
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
  container: {
    flex: 1,
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
  },
  darkOverlay: {
    position: 'absolute',
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
    zIndex: 2,
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
  phaseAndDayContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    margin: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dayChipsRow: {
    flexDirection: 'row',
    flex: 1,
    gap: 6,
  },
  phaseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 90,
  },
  phaseButtonActive: {
    backgroundColor: '#2ddbdb',
    borderColor: '#2ddbdb',
  },
  phaseButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 2,
  },
  phaseButtonTextActive: {
    color: '#000',
  },
  phaseWeeks: {
    fontSize: 9,
    color: '#6b7280',
  },
  phaseWeeksActive: {
    color: '#000',
    fontWeight: '600',
  },
  dayChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    borderColor: '#2ddbdb',
  },
  dayChipNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: 2,
  },
  dayChipNumberActive: {
    color: '#2ddbdb',
  },
  dayChipName: {
    fontSize: 7,
    fontWeight: '500',
    color: '#9ca3af',
    textAlign: 'center',
  },
  dayChipNameActive: {
    color: '#2ddbdb',
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
  exerciseHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
  },
  exerciseHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  exerciseHeaderSubtitle: {
    fontSize: 11,
    color: '#2ddbdb',
  },
  exerciseList: {
    flex: 1,
  },
  loadingText: {
    color: '#9ca3af',
    textAlign: 'center',
    padding: 20,
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
  playingIndicator: {
    fontSize: 14,
    color: '#2ddbdb',
    marginLeft: 8,
  },
  videoColumn: {
    flex: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  videoHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
  },
  videoHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  videoHeaderDetails: {
    fontSize: 11,
    color: '#2ddbdb',
  },
  videoContainer: {
    aspectRatio: 9 / 16,
    backgroundColor: '#000',
    width: '100%',
    alignSelf: 'center',
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoPlaceholderText: {
    color: '#9ca3af',
    fontSize: 14,
  },
});
