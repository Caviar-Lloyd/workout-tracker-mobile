import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase/client';
import { getWorkoutTemplate, getAllExerciseHistory } from '../lib/supabase/workout-service';
import type { WeekNumber, DayNumber } from '../types/workout';

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
  const [userData, setUserData] = useState<{ email: string } | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<1 | 2>(1);
  const [selectedWeek, setSelectedWeek] = useState<WeekNumber>(1);
  const [selectedDay, setSelectedDay] = useState<DayNumber>(1);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPhaseOpen, setIsPhaseOpen] = useState(false);
  const [isWeekOpen, setIsWeekOpen] = useState(false);
  const [isDayOpen, setIsDayOpen] = useState(false);

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

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const currentExercise = exercises[currentExerciseIndex];
  const chartData = currentExercise?.history.length > 0
    ? currentExercise.history.slice(0, 10).reverse().map((h: any) => ({
        date: new Date(h.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: h.sets.reduce((sum: number, set: any) => sum + (set.weight || 0), 0) / h.sets.length,
      }))
    : [];
  const maxWeight = chartData.length > 0 ? Math.max(...chartData.map(d => d.weight)) : 0;
  const weeks = selectedPhase === 1 ? [1, 2, 3] : [4, 5, 6];
  const workoutInfo = WORKOUT_DAYS.find(w => w.day === selectedDay);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Progress Tracker</Text>
        <Text style={styles.subtitle}>Track your performance</Text>

        <View style={styles.dropdownsContainer}>
          <View style={styles.dropdown}>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setIsPhaseOpen(!isPhaseOpen)}>
              <Text style={styles.dropdownLabel}>Phase</Text>
              <Text style={styles.dropdownValue}>{selectedPhase}</Text>
            </TouchableOpacity>
            {isPhaseOpen && (
              <View style={styles.dropdownMenu}>
                {[1, 2].map((phase) => (
                  <TouchableOpacity
                    key={phase}
                    style={[styles.dropdownItem, selectedPhase === phase && styles.dropdownItemActive]}
                    onPress={() => {
                      setSelectedPhase(phase as 1 | 2);
                      setSelectedWeek(phase === 1 ? 1 : 4);
                      setIsPhaseOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, selectedPhase === phase && styles.dropdownItemTextActive]}>
                      Phase {phase}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.dropdown}>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setIsWeekOpen(!isWeekOpen)}>
              <Text style={styles.dropdownLabel}>Week</Text>
              <Text style={styles.dropdownValue}>{selectedWeek}</Text>
            </TouchableOpacity>
            {isWeekOpen && (
              <View style={styles.dropdownMenu}>
                {weeks.map((week) => (
                  <TouchableOpacity
                    key={week}
                    style={[styles.dropdownItem, selectedWeek === week && styles.dropdownItemActive]}
                    onPress={() => {
                      setSelectedWeek(week as WeekNumber);
                      setIsWeekOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, selectedWeek === week && styles.dropdownItemTextActive]}>
                      Week {week}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.dropdown}>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setIsDayOpen(!isDayOpen)}>
              <Text style={styles.dropdownLabel}>Day</Text>
              <Text style={styles.dropdownValue}>{selectedDay}</Text>
            </TouchableOpacity>
            {isDayOpen && (
              <View style={styles.dropdownMenu}>
                {WORKOUT_DAYS.map((workout) => (
                  <TouchableOpacity
                    key={workout.day}
                    style={[styles.dropdownItem, selectedDay === workout.day && styles.dropdownItemActive]}
                    onPress={() => {
                      setSelectedDay(workout.day as DayNumber);
                      setIsDayOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, selectedDay === workout.day && styles.dropdownItemTextActive]}>
                      Day {workout.day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {workoutInfo && (
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutName}>{workoutInfo.name}</Text>
            <Text style={styles.workoutType}>{workoutInfo.type}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2ddbdb" />
          </View>
        ) : currentExercise ? (
          <>
            <View style={styles.exerciseNav}>
              <TouchableOpacity
                style={[styles.navButton, currentExerciseIndex === 0 && styles.navButtonDisabled]}
                onPress={handlePrevExercise}
                disabled={currentExerciseIndex === 0}
              >
                <Text style={styles.navButtonText}>← Prev</Text>
              </TouchableOpacity>
              <View style={styles.exerciseCounter}>
                <Text style={styles.exerciseName}>{currentExercise.name}</Text>
                <Text style={styles.exerciseCount}>{currentExerciseIndex + 1} of {exercises.length}</Text>
              </View>
              <TouchableOpacity
                style={[styles.navButton, currentExerciseIndex === exercises.length - 1 && styles.navButtonDisabled]}
                onPress={handleNextExercise}
                disabled={currentExerciseIndex === exercises.length - 1}
              >
                <Text style={styles.navButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>

            {chartData.length > 0 ? (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Weight Progress</Text>
                <Text style={styles.chartSubtitle}>Average weight lifted over time</Text>
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={{
                      labels: chartData.map(d => d.date),
                      datasets: [{
                        data: chartData.map(d => d.weight),
                        strokeWidth: 3,
                      }]
                    }}
                    width={Dimensions.get('window').width - 64}
                    height={280}
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
                        r: '6',
                        strokeWidth: '2',
                        stroke: '#0a0e27',
                        fill: '#2ddbdb',
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: '',
                        stroke: 'rgba(255, 255, 255, 0.1)',
                        strokeWidth: 1,
                      },
                    }}
                    bezier
                    style={{
                      borderRadius: 16,
                      paddingRight: 0,
                    }}
                    withInnerLines={true}
                    withOuterLines={false}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                    fromZero={false}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No workout history yet</Text>
                <Text style={styles.noDataSubtext}>Complete a workout to see your progress</Text>
              </View>
            )}

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sets:</Text>
                <Text style={styles.detailValue}>{currentExercise.setCount}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rep Range:</Text>
                <Text style={styles.detailValue}>{currentExercise.repRange}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Workouts:</Text>
                <Text style={styles.detailValue}>{currentExercise.history.length}</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No exercises found</Text>
          </View>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  dropdownsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dropdown: {
    flex: 1,
    marginHorizontal: 4,
  },
  dropdownButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    alignItems: 'center',
  },
  dropdownLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 4,
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  dropdownMenu: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItem: {
    padding: 12,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
  },
  dropdownItemText: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 12,
  },
  dropdownItemTextActive: {
    color: '#fff',
  },
  workoutInfo: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  workoutType: {
    fontSize: 12,
    color: '#2ddbdb',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  exerciseNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  navButton: {
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.5,
  },
  navButtonText: {
    color: '#2ddbdb',
    fontWeight: '600',
  },
  exerciseCounter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 16,
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
  detailsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
