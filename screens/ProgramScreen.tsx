import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedWeek, setSelectedWeek] = useState<number>(1); // Week 1, 2, or 3
  const [selectedDay, setSelectedDay] = useState<number>(1); // Day 1-6
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch exercises when day or week changes
  useEffect(() => {
    fetchExercises();
  }, [selectedDay, selectedWeek]);

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const template = await getWorkoutTemplate(selectedWeek as WeekNumber, selectedDay as DayNumber);
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

  // Week data with labels
  const weeks = [
    { number: 1, label: 'Multi-Joint' },
    { number: 2, label: 'Multi-Joint' },
    { number: 3, label: 'Multi-Joint' },
  ];

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
        {/* Breadcrumb Navigation */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>
            <Text style={styles.breadcrumbHome} onPress={() => navigation.navigate('Dashboard')}>Home</Text>
            <Text style={styles.breadcrumbSeparator}> / </Text>
            <Text style={styles.breadcrumbCurrent}>Program Overview</Text>
          </Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Program Overview</Text>
          <Text style={styles.subtitle}>Complete Recomposition Training System</Text>
        </View>

        {/* 16:9 Video Container */}
        <View style={styles.videoContainer}>
          {selectedExercise ? (
            <View style={styles.videoWrapper}>
              <CustomVideoPlayer
                exerciseName={selectedExercise.name}
                style={styles.video}
              />
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>Select an exercise to view</Text>
            </View>
          )}
        </View>

      {/* Weeks Horizontal Scroll */}
      <View style={styles.weeksSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weeksScrollContent}
        >
          {weeks.map((week) => (
            <TouchableOpacity
              key={week.number}
              style={[
                styles.weekCard,
                selectedWeek === week.number && styles.weekCardActive
              ]}
              onPress={() => setSelectedWeek(week.number)}
            >
              <Text style={[
                styles.weekTitle,
                selectedWeek === week.number && styles.weekTitleActive
              ]}>
                Week {week.number}
              </Text>
              <Text style={[
                styles.weekLabel,
                selectedWeek === week.number && styles.weekLabelActive
              ]}>
                {week.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Days Horizontal Scroll */}
      <View style={styles.daysSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysScrollContent}
        >
          {WORKOUT_DAYS.map((workout) => (
            <TouchableOpacity
              key={workout.day}
              style={[
                styles.dayCard,
                selectedDay === workout.day && styles.dayCardActive
              ]}
              onPress={() => setSelectedDay(workout.day)}
            >
              <Text style={[
                styles.dayNumber,
                selectedDay === workout.day && styles.dayNumberActive
              ]}>
                Day {workout.day}
              </Text>
              <Text style={[
                styles.dayName,
                selectedDay === workout.day && styles.dayNameActive
              ]}>
                {workout.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Exercises Vertical Scroll */}
      <View style={styles.exercisesSection}>
        <View style={styles.exercisesSectionHeader}>
          <Text style={styles.exercisesSectionTitle}>
            {selectedWorkoutDay?.name}
          </Text>
          <Text style={styles.exercisesSectionSubtitle}>
            Week {selectedWeek} - {selectedWorkoutDay?.type}
          </Text>
        </View>

        <ScrollView
          style={styles.exercisesList}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            exercises.map((exercise, index) => (
              <TouchableOpacity
                key={exercise.index}
                style={[
                  styles.exerciseCard,
                  selectedExerciseIndex === index && styles.exerciseCardActive
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
  // Weeks Horizontal Scroll
  weeksSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  weeksScrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  weekCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 120,
    alignItems: 'center',
  },
  weekCardActive: {
    backgroundColor: '#2ddbdb',
    borderColor: '#2ddbdb',
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  weekTitleActive: {
    color: '#000',
  },
  weekLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  weekLabelActive: {
    color: '#000',
    fontWeight: '600',
  },
  // Days Horizontal Scroll
  daysSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  daysScrollContent: {
    paddingRight: 16,
    gap: 10,
  },
  dayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 130,
  },
  dayCardActive: {
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    borderColor: '#2ddbdb',
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: 4,
  },
  dayNumberActive: {
    color: '#2ddbdb',
  },
  dayName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9ca3af',
  },
  dayNameActive: {
    color: '#2ddbdb',
  },
  // Exercises Vertical Scroll
  exercisesSection: {
    flex: 1,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  exercisesSectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
  },
  exercisesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  exercisesSectionSubtitle: {
    fontSize: 12,
    color: '#2ddbdb',
  },
  exercisesList: {
    flex: 1,
  },
  loadingText: {
    color: '#9ca3af',
    textAlign: 'center',
    padding: 20,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  exerciseCardActive: {
    backgroundColor: 'rgba(45, 219, 219, 0.15)',
  },
  exerciseNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    fontSize: 13,
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
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  exerciseNameActive: {
    color: '#2ddbdb',
  },
  exerciseDetails: {
    fontSize: 12,
    color: '#9ca3af',
  },
  playingIndicator: {
    fontSize: 16,
    color: '#2ddbdb',
    marginLeft: 8,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
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
    fontWeight: '500',
  },
  // Breadcrumb Navigation - Top Right
  breadcrumb: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingTop: 8,
    paddingRight: 20,
    zIndex: 10,
  },
  breadcrumbText: {
    fontSize: 12,
  },
  breadcrumbHome: {
    color: '#2ddbdb',
    fontWeight: '600',
  },
  breadcrumbSeparator: {
    color: '#6b7280',
  },
  breadcrumbCurrent: {
    color: '#9ca3af',
    fontWeight: '400',
  },
});
