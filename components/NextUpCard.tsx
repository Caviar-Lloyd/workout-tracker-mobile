import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

interface NextUpCardProps {
  week: number;
  day: number;
  workoutName: string;
  onStartWorkout: () => void;
  onViewProgram: () => void;
  exercises?: Array<{
    index: number;
    name: string;
    setCount: number;
    repRange: string;
  }>;
}

const ZapIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
  </Svg>
);

const PlayIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
  </Svg>
);

const TargetIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z" />
    <Path d="M12 6a6 6 0 1 0 0 12 6 6 0 1 0 0-12z" />
    <Path d="M12 10a2 2 0 1 0 0 4 2 2 0 1 0 0-4z" />
  </Svg>
);

export default function NextUpCard({
  week,
  day,
  workoutName,
  onStartWorkout,
  onViewProgram,
  exercises = []
}: NextUpCardProps) {
  return (
    <View style={styles.outerContainer}>
      {/* Header with Icon */}
      <View style={styles.headerContainer}>
        <View style={styles.iconBox}>
          <ZapIcon />
        </View>
        <Text style={styles.headerTitle}>Next Up</Text>
      </View>

      {/* Main Workout Card */}
      <LinearGradient
        colors={['rgba(45, 219, 219, 0.2)', 'rgba(69, 85, 144, 0.2)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.workoutCard}
      >
        <View style={styles.workoutCardInner}>
          <View style={styles.todayWorkoutHeader}>
            <LinearGradient
              colors={['#2ddbdb', '#455590']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientTextContainer}
            >
              <Text style={styles.todayWorkoutText}>Today's Workout</Text>
            </LinearGradient>
          </View>

          <Text style={styles.weekDayText}>Week {week}, Day {day}</Text>
          <Text style={styles.workoutNameText}>{workoutName}</Text>
        </View>
      </LinearGradient>

      {/* Exercise List (optional) */}
      {exercises.length > 0 && (
        <View style={styles.exercisesContainer}>
          <Text style={styles.exercisesTitle}>Exercises ({exercises.length})</Text>
          {exercises.slice(0, 3).map((exercise, index) => (
            <View key={exercise.index} style={styles.exerciseRow}>
              <View style={styles.exerciseNumberBadge}>
                <Text style={styles.exerciseNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetails}>
                  {exercise.setCount} sets × {exercise.repRange} reps
                </Text>
              </View>
            </View>
          ))}
          {exercises.length > 3 && (
            <Text style={styles.moreExercises}>+{exercises.length - 3} more exercises</Text>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.viewProgramButton}
          onPress={onViewProgram}
        >
          <View style={styles.buttonIcon}>
            <TargetIcon />
          </View>
          <Text style={styles.viewProgramButtonText}>View Program</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.startWorkoutButton}
          onPress={onStartWorkout}
        >
          <LinearGradient
            colors={['#2ddbdb', 'rgba(45, 219, 219, 0.8)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startWorkoutGradient}
          >
            <View style={styles.buttonIcon}>
              <PlayIcon />
            </View>
            <Text style={styles.startWorkoutButtonText}>Start Workout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
  },
  workoutCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  workoutCardInner: {
    padding: 20,
  },
  todayWorkoutHeader: {
    marginBottom: 8,
  },
  gradientTextContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 2,
    borderRadius: 4,
  },
  todayWorkoutText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  weekDayText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  workoutNameText: {
    fontSize: 16,
    color: '#d1d5db',
  },
  exercisesContainer: {
    marginBottom: 20,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ddbdb',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  exerciseDetails: {
    fontSize: 12,
    color: '#9ca3af',
  },
  moreExercises: {
    fontSize: 12,
    color: '#2ddbdb',
    textAlign: 'center',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  viewProgramButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  viewProgramButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  startWorkoutButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  startWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  startWorkoutButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
