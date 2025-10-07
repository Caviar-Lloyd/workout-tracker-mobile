import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

interface Exercise {
  index: number;
  name: string;
  setCount: number;
  repRange: string;
}

interface ProgramOverviewCardProps {
  title: string;
  weekInfo: string;
  workoutName: string;
  exercises: Exercise[];
  onExercisePress?: (exercise: Exercise) => void;
  onViewFullProgram?: () => void;
}

const ZapIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2ddbdb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
  </Svg>
);

const DumbbellIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14.4 14.4 9.6 9.6" />
    <Path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l2.829-2.828a2 2 0 1 1 2.828 2.828l1.768-1.768a2 2 0 1 1 2.828 2.829z" />
    <Path d="M21.5 21.5l-1.4-1.4" />
    <Path d="M3.9 3.9l-1.4-1.4" />
    <Path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
  </Svg>
);

export default function ProgramOverviewCard({
  title,
  weekInfo,
  workoutName,
  exercises,
  onExercisePress,
  onViewFullProgram
}: ProgramOverviewCardProps) {
  return (
    <View style={styles.outerContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.iconBox}>
          <DumbbellIcon />
        </View>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {/* Workout Info Card */}
      <LinearGradient
        colors={['rgba(45, 219, 219, 0.2)', 'rgba(69, 85, 144, 0.2)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.workoutInfoCard}
      >
        <View style={styles.workoutInfoInner}>
          <View style={styles.programHeader}>
            <LinearGradient
              colors={['#2ddbdb', '#455590']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientTextContainer}
            >
              <Text style={styles.programHeaderText}>Program Overview</Text>
            </LinearGradient>
          </View>

          <Text style={styles.weekInfoText}>{weekInfo}</Text>
          <Text style={styles.workoutNameText}>{workoutName}</Text>
        </View>
      </LinearGradient>

      {/* Exercises Section */}
      <View style={styles.exercisesSection}>
        <View style={styles.exercisesHeader}>
          <ZapIcon size={20} />
          <Text style={styles.exercisesTitle}>Exercises ({exercises.length})</Text>
        </View>

        <ScrollView
          style={styles.exercisesList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {exercises.map((exercise, index) => (
            <TouchableOpacity
              key={exercise.index}
              style={styles.exerciseItem}
              onPress={() => onExercisePress?.(exercise)}
              activeOpacity={0.7}
            >
              <View style={styles.exerciseNumberBadge}>
                <Text style={styles.exerciseNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetails}>
                  {exercise.setCount} sets × {exercise.repRange} reps
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* View Full Program Button */}
      {onViewFullProgram && (
        <TouchableOpacity
          style={styles.viewFullButton}
          onPress={onViewFullProgram}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.viewFullGradient}
          >
            <Text style={styles.viewFullButtonText}>View Full Program</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
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
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  workoutInfoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  workoutInfoInner: {
    padding: 16,
  },
  programHeader: {
    marginBottom: 8,
  },
  gradientTextContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 2,
    borderRadius: 4,
  },
  programHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  weekInfoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  workoutNameText: {
    fontSize: 15,
    color: '#d1d5db',
  },
  exercisesSection: {
    marginBottom: 16,
  },
  exercisesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exercisesList: {
    maxHeight: 300,
  },
  exerciseItem: {
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
  chevron: {
    fontSize: 24,
    color: '#9ca3af',
    marginLeft: 8,
  },
  viewFullButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  viewFullGradient: {
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  viewFullButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
