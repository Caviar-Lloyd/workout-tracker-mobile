import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase/client';
import { getWorkoutTemplate, getAllExerciseHistory } from '../lib/supabase/workout-service';
import type { WeekNumber, DayNumber } from '../types/workout';
import ParticleBackground from '../components/ParticleBackground';

const WORKOUT_DAYS = [
  { day: 1, name: "Chest, Triceps, Abs", type: "Multi-Joint" },
  { day: 2, name: "Shoulders, Legs, Calves", type: "Multi-Joint" },
  { day: 3, name: "Back, Traps, Biceps", type: "Multi-Joint" },
  { day: 4, name: "Chest, Triceps, Abs", type: "Isolation" },
  { day: 5, name: "Shoulders, Legs, Calves", type: "Isolation" },
  { day: 6, name: "Back, Traps, Biceps", type: "Isolation" },
];

interface ExerciseData {
  name: string;
  setCount: number;
  repRange: string;
  index: number;
  history: any[];
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState<{ email: string } | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<WeekNumber>(1);
  const [selectedDay, setSelectedDay] = useState<DayNumber>(1);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false);
  const [showWorkoutDropdown, setShowWorkoutDropdown] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserData({ email: user.email || '' });
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!userData) return;

    const fetchExercises = async () => {
      setIsLoading(true);
      try {
        const template = await getWorkoutTemplate(selectedWeek, selectedDay);
        const history = await getAllExerciseHistory(userData.email, selectedWeek, selectedDay);

        if (template && template.exercises.length > 0) {
          const exerciseData: ExerciseData[] = template.exercises.map((exercise: any) => {
            const exerciseHistory = history.filter((h: any) => h.exerciseName === exercise.name);
            return {
              name: exercise.name,
              setCount: exercise.setCount,
              repRange: exercise.repRange,
              index: exercise.index,
              history: exerciseHistory,
            };
          });
          setExercises(exerciseData);
          setCurrentExerciseIndex(0);
        }
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExercises();
  }, [selectedWeek, selectedDay, userData]);

  const handlePrevDay = () => {
    setSelectedDay((selectedDay === 1 ? 6 : selectedDay - 1) as DayNumber);
  };

  const handleNextDay = () => {
    setSelectedDay((selectedDay === 6 ? 1 : selectedDay + 1) as DayNumber);
  };

  const handlePrevWeek = () => {
    setSelectedWeek((selectedWeek === 1 ? 6 : selectedWeek - 1) as WeekNumber);
  };

  const handleNextWeek = () => {
    setSelectedWeek((selectedWeek === 6 ? 1 : selectedWeek + 1) as WeekNumber);
  };

  const currentExercise = exercises[currentExerciseIndex];
  const chartData = currentExercise?.history.length > 0
    ? currentExercise.history.slice(0, 10).reverse().map((h: any) => ({
        date: new Date(h.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: h.sets.reduce((sum: number, set: any) => sum + (set.weight || 0), 0) / h.sets.length,
      }))
    : [];
  const maxWeight = chartData.length > 0 ? Math.max(...chartData.map(d => d.weight)) : 0;
  const workoutInfo = WORKOUT_DAYS.find(w => w.day === selectedDay);

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
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, {
          paddingTop: Math.max(insets.top, 20) + 10,
          paddingBottom: Math.max(insets.bottom, 20) + 20,
        }]}
      >
        <Text style={styles.title}>Progress Tracker</Text>
        <Text style={styles.subtitle}>Track your performance</Text>

        {/* Backdrop to close dropdowns when clicking outside */}
        {(showWorkoutDropdown || showExerciseDropdown) && (
          <TouchableOpacity
            style={styles.dropdownBackdropOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowWorkoutDropdown(false);
              setShowExerciseDropdown(false);
            }}
          />
        )}

        {/* Combined Container with Arrows and Dropdowns */}
        <View style={styles.combinedContainer}>
          {/* Left Arrow with Day Hint */}
          <View style={styles.dayNavContainer}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={handlePrevDay}
            >
              <Text style={styles.arrowText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.dayHintText}>Day {selectedDay === 1 ? 6 : selectedDay - 1}</Text>
          </View>

          {/* Dropdowns in the middle */}
          <View style={styles.dropdownsRow}>
            {/* Workout Dropdown */}
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setShowWorkoutDropdown(!showWorkoutDropdown);
                  setShowExerciseDropdown(false);
                }}
              >
                <View style={styles.dropdownContent}>
                  <Text style={styles.dropdownLabel}>Workout</Text>
                  <Text style={styles.dropdownValue} numberOfLines={1}>
                    {workoutInfo?.name || 'Select'}
                  </Text>
                  <Text style={styles.dropdownSubtext}>Day {selectedDay}</Text>
                </View>
                <Text style={[styles.dropdownArrow, showWorkoutDropdown && styles.dropdownArrowActive]}>
                  {showWorkoutDropdown ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {showWorkoutDropdown && (
                <View style={styles.dropdownMenu}>
                  <View style={styles.dropdownBackdrop}>
                    {WORKOUT_DAYS.map((workout) => (
                      <TouchableOpacity
                        key={workout.day}
                        activeOpacity={0.8}
                        style={[
                          styles.dropdownMenuItem,
                          selectedDay === workout.day && styles.dropdownMenuItemActive
                        ]}
                        onPress={() => {
                          setSelectedDay(workout.day as DayNumber);
                          setShowWorkoutDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownMenuItemText,
                            selectedDay === workout.day && styles.dropdownMenuItemTextActive
                          ]}
                        >
                          {workout.name}
                        </Text>
                        <Text style={styles.dropdownMenuItemSubtext}>Day {workout.day}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Exercise Dropdown */}
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setShowExerciseDropdown(!showExerciseDropdown);
                  setShowWorkoutDropdown(false);
                }}
              >
                <View style={styles.dropdownContent}>
                  <Text style={styles.dropdownLabel}>Exercise</Text>
                  <Text style={styles.dropdownValue} numberOfLines={1}>
                    {exercises[currentExerciseIndex]?.name || 'Select'}
                  </Text>
                  <Text style={styles.dropdownSubtext}>
                    {exercises.length > 0 ? `${currentExerciseIndex + 1} of ${exercises.length}` : ''}
                  </Text>
                </View>
                <Text style={[styles.dropdownArrow, showExerciseDropdown && styles.dropdownArrowActive]}>
                  {showExerciseDropdown ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {showExerciseDropdown && exercises.length > 0 && (
                <View style={styles.dropdownMenu}>
                  <View style={styles.dropdownBackdrop}>
                    {exercises.map((exercise, index) => (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.8}
                        style={[
                          styles.dropdownMenuItem,
                          currentExerciseIndex === index && styles.dropdownMenuItemActive
                        ]}
                        onPress={() => {
                          setCurrentExerciseIndex(index);
                          setShowExerciseDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownMenuItemText,
                            currentExerciseIndex === index && styles.dropdownMenuItemTextActive
                          ]}
                        >
                          {exercise.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Right Arrow with Day Hint */}
          <View style={styles.dayNavContainer}>
            <Text style={styles.dayHintText}>Day {selectedDay === 6 ? 1 : selectedDay + 1}</Text>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={handleNextDay}
            >
              <Text style={styles.arrowText}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2ddbdb" />
          </View>
        ) : (
          <>

            {/* Chart Container - Always visible */}
            <View style={styles.chartContainer}>
              {/* Week Navigation in Chart Header */}
              <View style={styles.chartHeaderRow}>
                <View style={styles.weekNavContainer}>
                  <TouchableOpacity
                    style={styles.weekArrowButton}
                    onPress={handlePrevWeek}
                  >
                    <Text style={styles.weekArrowText}>←</Text>
                  </TouchableOpacity>
                  <Text style={styles.weekHintTextRight}>Week {selectedWeek === 1 ? 6 : selectedWeek - 1}</Text>
                </View>

                <View style={styles.chartTitleContainer}>
                  <Text style={styles.chartTitle}>Weight Progress</Text>
                  <Text style={styles.chartWeek}>Week {selectedWeek}</Text>
                </View>

                <View style={styles.weekNavContainer}>
                  <Text style={styles.weekHintTextLeft}>Week {selectedWeek === 6 ? 1 : selectedWeek + 1}</Text>
                  <TouchableOpacity
                    style={styles.weekArrowButton}
                    onPress={handleNextWeek}
                  >
                    <Text style={styles.weekArrowText}>→</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {chartData.length > 0 ? (
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={{
                      labels: chartData.map(d => d.date),
                      datasets: [{
                        data: chartData.map(d => d.weight),
                        strokeWidth: 3,
                      }]
                    }}
                    width={Dimensions.get('window').width - 80}
                    height={240}
                    chartConfig={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      backgroundGradientFrom: 'rgba(45, 219, 219, 0.15)',
                      backgroundGradientTo: 'rgba(45, 219, 219, 0.05)',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(45, 219, 219, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForDots: {
                        r: '5',
                        strokeWidth: '2',
                        stroke: '#0a0e27',
                        fill: '#2ddbdb',
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: '',
                        stroke: 'rgba(255, 255, 255, 0.1)',
                        strokeWidth: 1,
                      },
                      formatYLabel: (value) => {
                        const num = parseFloat(value);
                        return Math.round(num / 10) * 10 + '';
                      },
                    }}
                    yAxisLabel=""
                    yAxisSuffix=" lbs"
                    yAxisInterval={10}
                    bezier
                    style={{
                      borderRadius: 16,
                      marginLeft: -10,
                    }}
                    withInnerLines={true}
                    withOuterLines={false}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                    fromZero={true}
                    segments={5}
                  />
                </View>
              ) : (
                <View style={styles.noDataInChart}>
                  <Text style={styles.noDataText}>No workout history yet</Text>
                  <Text style={styles.noDataSubtext}>Complete a workout to see your progress</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  darkOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2ddbdb',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 24,
  },
  dropdownBackdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  // Combined Container with Arrows and Dropdowns
  combinedContainer: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10000,
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButtonDisabled: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 22,
    color: '#2ddbdb',
    fontWeight: 'bold',
  },
  dayNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayHintText: {
    fontSize: 10,
    color: '#2ddbdb',
    fontWeight: '600',
  },
  dropdownsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    zIndex: 10000,
  },
  dropdownWrapper: {
    flex: 1,
    position: 'relative',
    zIndex: 9999,
  },
  dropdownButton: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
  },
  dropdownContent: {
    flex: 1,
    marginRight: 8,
  },
  dropdownLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 4,
  },
  dropdownValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  dropdownSubtext: {
    fontSize: 11,
    color: '#2ddbdb',
    fontWeight: '600',
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#2ddbdb',
  },
  dropdownArrowActive: {
    color: '#fff',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    marginTop: 4,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 99999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  dropdownBackdrop: {
    backgroundColor: '#000',
    width: '100%',
    height: '100%',
  },
  dropdownMenuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#000',
    opacity: 1,
  },
  dropdownMenuItemActive: {
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
  },
  dropdownMenuItemText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownMenuItemTextActive: {
    color: '#2ddbdb',
  },
  dropdownMenuItemSubtext: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  // Chart Container
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  weekNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekArrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekArrowText: {
    fontSize: 20,
    color: '#2ddbdb',
    fontWeight: 'bold',
  },
  weekHintTextLeft: {
    fontSize: 10,
    color: '#2ddbdb',
    fontWeight: '600',
  },
  weekHintTextRight: {
    fontSize: 10,
    color: '#2ddbdb',
    fontWeight: '600',
  },
  chartTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  chartWeek: {
    fontSize: 13,
    color: '#2ddbdb',
    fontWeight: '600',
  },
  chartWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 16,
  },
  noDataContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  noDataInChart: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
