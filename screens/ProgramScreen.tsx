import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getWorkoutTemplate } from '../lib/supabase/workout-service';
import type { WeekNumber, DayNumber } from '../types/workout';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import ParticleBackground from '../components/ParticleBackground';
import UniversalHeader from '../components/UniversalHeader';

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
  const route = useRoute();
  const insets = useSafeAreaInsets();

  // Get week/day from route params (from calendar preview) or default to 1
  const routeParams = route.params as { week?: number; day?: number } | undefined;
  const initialWeek = routeParams?.week || 1;
  const initialDay = routeParams?.day || 1;

  const [selectedWeek, setSelectedWeek] = useState<number>(initialWeek);
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Scroll refs for each column
  const weekScrollRef = useRef<any>(null);
  const dayScrollRef = useRef<any>(null);
  const exerciseScrollRef = useRef<any>(null);

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

  // Cycle through week selection with auto-scroll
  const cycleWeek = (direction: 'up' | 'down') => {
    const newWeek = direction === 'down'
      ? (selectedWeek === 3 ? 1 : selectedWeek + 1)
      : (selectedWeek === 1 ? 3 : selectedWeek - 1);

    setSelectedWeek(newWeek);

    // Auto-scroll to make the selected item visible
    setTimeout(() => {
      const itemHeight = 65; // Approximate height of each item
      const scrollPosition = (newWeek - 1) * itemHeight;
      weekScrollRef.current?.scrollTo({ y: scrollPosition, animated: true });
    }, 100);
  };

  // Cycle through day selection with auto-scroll
  const cycleDay = (direction: 'up' | 'down') => {
    const newDay = direction === 'down'
      ? (selectedDay === 6 ? 1 : selectedDay + 1)
      : (selectedDay === 1 ? 6 : selectedDay - 1);

    setSelectedDay(newDay);

    // Auto-scroll to make the selected item visible
    setTimeout(() => {
      const itemHeight = 65; // Approximate height of each item
      const scrollPosition = (newDay - 1) * itemHeight;
      dayScrollRef.current?.scrollTo({ y: scrollPosition, animated: true });
    }, 100);
  };

  // Cycle through exercise selection with auto-scroll
  const cycleExercise = (direction: 'up' | 'down') => {
    if (exercises.length === 0) return;

    const newIndex = direction === 'down'
      ? (selectedExerciseIndex === exercises.length - 1 ? 0 : selectedExerciseIndex + 1)
      : (selectedExerciseIndex === 0 ? exercises.length - 1 : selectedExerciseIndex - 1);

    setSelectedExerciseIndex(newIndex);

    // Auto-scroll to make the selected item visible
    setTimeout(() => {
      const itemHeight = 65; // Approximate height of each item
      const scrollPosition = newIndex * itemHeight;
      exerciseScrollRef.current?.scrollTo({ y: scrollPosition, animated: true });
    }, 100);
  };

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
<UniversalHeader title="Program" />
        <Text style={styles.subtitle}>Complete Recomposition Training System</Text>

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

      {/* 3 Column Layout: Weeks | Days | Exercises */}
      <View style={styles.threeColumnContainer}>
        {/* Column 1: Weeks */}
        <View style={styles.column}>
          <View style={styles.columnHeader}>
            <Text style={styles.columnTitle}>Week</Text>
          </View>
          <TouchableOpacity
            style={styles.scrollIndicatorUp}
            onPress={() => cycleWeek('up')}
            activeOpacity={0.7}
          >
            <Text style={styles.scrollIndicatorText}>↑</Text>
          </TouchableOpacity>
          <ScrollView
            ref={weekScrollRef}
            style={styles.columnScroll}
            showsVerticalScrollIndicator={false}
          >
            {weeks.map((week) => (
              <TouchableOpacity
                key={week.number}
                style={[
                  styles.columnItem,
                  selectedWeek === week.number && styles.columnItemActive
                ]}
                onPress={() => setSelectedWeek(week.number)}
              >
                <Text style={[
                  styles.columnItemTitle,
                  selectedWeek === week.number && styles.columnItemTitleActive
                ]}>
                  Week {week.number}
                </Text>
                <Text style={[
                  styles.columnItemSubtitle,
                  selectedWeek === week.number && styles.columnItemSubtitleActive
                ]}>
                  {week.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.scrollIndicatorDown}
            onPress={() => cycleWeek('down')}
            activeOpacity={0.7}
          >
            <Text style={styles.scrollIndicatorText}>↓</Text>
          </TouchableOpacity>
        </View>

        {/* Column 2: Days */}
        <View style={styles.column}>
          <View style={styles.columnHeader}>
            <Text style={styles.columnTitle}>Day</Text>
          </View>
          <TouchableOpacity
            style={styles.scrollIndicatorUp}
            onPress={() => cycleDay('up')}
            activeOpacity={0.7}
          >
            <Text style={styles.scrollIndicatorText}>↑</Text>
          </TouchableOpacity>
          <ScrollView
            ref={dayScrollRef}
            style={styles.columnScroll}
            showsVerticalScrollIndicator={false}
          >
            {WORKOUT_DAYS.map((workout) => (
              <TouchableOpacity
                key={workout.day}
                style={[
                  styles.columnItem,
                  selectedDay === workout.day && styles.columnItemActive
                ]}
                onPress={() => setSelectedDay(workout.day)}
              >
                <Text style={[
                  styles.columnItemTitle,
                  selectedDay === workout.day && styles.columnItemTitleActive
                ]}>
                  Day {workout.day}
                </Text>
                <Text style={[
                  styles.columnItemSubtitle,
                  selectedDay === workout.day && styles.columnItemSubtitleActive
                ]}>
                  {workout.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.scrollIndicatorDown}
            onPress={() => cycleDay('down')}
            activeOpacity={0.7}
          >
            <Text style={styles.scrollIndicatorText}>↓</Text>
          </TouchableOpacity>
        </View>

        {/* Column 3: Exercises */}
        <View style={styles.column}>
          <View style={styles.columnHeader}>
            <Text style={styles.columnTitle}>Exercises</Text>
          </View>
          <TouchableOpacity
            style={styles.scrollIndicatorUp}
            onPress={() => cycleExercise('up')}
            activeOpacity={0.7}
          >
            <Text style={styles.scrollIndicatorText}>↑</Text>
          </TouchableOpacity>
          <ScrollView
            ref={exerciseScrollRef}
            style={styles.columnScroll}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : (
              exercises.map((exercise, index) => (
                <TouchableOpacity
                  key={exercise.index}
                  style={[
                    styles.columnItem,
                    selectedExerciseIndex === index && styles.columnItemActive
                  ]}
                  onPress={() => setSelectedExerciseIndex(index)}
                >
                  <View style={styles.exerciseRow}>
                    <Text style={styles.exerciseNumber}>{index + 1}</Text>
                    <View style={styles.exerciseInfo}>
                      <Text style={[
                        styles.columnItemTitle,
                        selectedExerciseIndex === index && styles.columnItemTitleActive
                      ]}>
                        {exercise.name}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.scrollIndicatorDown}
            onPress={() => cycleExercise('down')}
            activeOpacity={0.7}
          >
            <Text style={styles.scrollIndicatorText}>↓</Text>
          </TouchableOpacity>
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
  // 3 Column Layout
  threeColumnContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    height: 360,
  },
  column: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  columnHeader: {
    backgroundColor: 'rgba(45, 219, 219, 0.15)',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2ddbdb',
    textAlign: 'center',
  },
  columnScroll: {
    flex: 1,
  },
  columnItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'transparent',
  },
  columnItemActive: {
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#2ddbdb',
  },
  columnItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  columnItemTitleActive: {
    color: '#2ddbdb',
  },
  columnItemSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '400',
  },
  columnItemSubtitleActive: {
    color: '#2ddbdb',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  exerciseNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2ddbdb',
    minWidth: 20,
  },
  loadingText: {
    color: '#9ca3af',
    textAlign: 'center',
    padding: 20,
  },
  exerciseInfo: {
    flex: 1,
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
  scrollIndicatorUp: {
    backgroundColor: 'rgba(45, 219, 219, 0.15)',
    paddingVertical: 6,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollIndicatorDown: {
    backgroundColor: 'rgba(45, 219, 219, 0.15)',
    paddingVertical: 6,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollIndicatorText: {
    fontSize: 18,
    color: '#2ddbdb',
    fontWeight: '700',
  },
});
