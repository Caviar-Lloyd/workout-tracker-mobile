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
  const [selectedWeek, setSelectedWeek] = useState<WeekNumber>(1);
  const [selectedDay, setSelectedDay] = useState<DayNumber>(1);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    if (selectedDay > 1) {
      setSelectedDay((selectedDay - 1) as DayNumber);
    }
  };

  const handleNextDay = () => {
    if (selectedDay < 6) {
      setSelectedDay((selectedDay + 1) as DayNumber);
    }
  };

  const handlePrevWeek = () => {
    if (selectedWeek > 1) {
      setSelectedWeek((selectedWeek - 1) as WeekNumber);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeek < 6) {
      setSelectedWeek((selectedWeek + 1) as WeekNumber);
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
  const workoutInfo = WORKOUT_DAYS.find(w => w.day === selectedDay);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Progress Tracker</Text>
        <Text style={styles.subtitle}>Track your performance</Text>

        {/* Workout Day Navigation */}
        <View style={styles.workoutNavContainer}>
          <TouchableOpacity
            style={[styles.arrowButton, selectedDay === 1 && styles.arrowButtonDisabled]}
            onPress={handlePrevDay}
            disabled={selectedDay === 1}
          >
            <Text style={styles.arrowText}>←</Text>
          </TouchableOpacity>

          <View style={styles.workoutTitleContainer}>
            {workoutInfo && (
              <>
                <Text style={styles.workoutName}>{workoutInfo.name}</Text>
                <Text style={styles.workoutDay}>Day {selectedDay}</Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.arrowButton, selectedDay === 6 && styles.arrowButtonDisabled]}
            onPress={handleNextDay}
            disabled={selectedDay === 6}
          >
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2ddbdb" />
          </View>
        ) : (
          <>
            {chartData.length > 0 ? (
              <View style={styles.chartContainer}>
                {/* Week Navigation in Chart Header */}
                <View style={styles.chartHeaderRow}>
                  <TouchableOpacity
                    style={[styles.weekArrowButton, selectedWeek === 1 && styles.weekArrowButtonDisabled]}
                    onPress={handlePrevWeek}
                    disabled={selectedWeek === 1}
                  >
                    <Text style={styles.weekArrowText}>←</Text>
                  </TouchableOpacity>

                  <View style={styles.chartTitleContainer}>
                    <Text style={styles.chartTitle}>Weight Progress</Text>
                    <Text style={styles.chartWeek}>Week {selectedWeek}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.weekArrowButton, selectedWeek === 6 && styles.weekArrowButtonDisabled]}
                    onPress={handleNextWeek}
                    disabled={selectedWeek === 6}
                  >
                    <Text style={styles.weekArrowText}>→</Text>
                  </TouchableOpacity>
                </View>

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
                    }}
                    yAxisLabel=""
                    yAxisSuffix=" lbs"
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
          </>
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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  // Workout Day Navigation
  workoutNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
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
    fontSize: 24,
    color: '#2ddbdb',
    fontWeight: 'bold',
  },
  workoutTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  workoutName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  workoutDay: {
    fontSize: 13,
    color: '#2ddbdb',
    fontWeight: '600',
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
  weekArrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekArrowButtonDisabled: {
    opacity: 0.3,
  },
  weekArrowText: {
    fontSize: 20,
    color: '#2ddbdb',
    fontWeight: 'bold',
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
