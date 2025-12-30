import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ImageBackground,
  View,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';
import { Clock } from 'lucide-react-native';

interface WorkoutCardProps {
  workout: {
    name: string;
    image_url?: string;
    category?: string;
    difficulty?: string;
    duration?: number;
    exercises?: any[];
  };
  badge?: string;
  onPress: () => void;
  compact?: boolean;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800';

export default function WorkoutCard({
  workout,
  badge,
  onPress,
  compact = false,
}: WorkoutCardProps) {
  const imageUrl = workout.image_url || DEFAULT_IMAGE;

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.compactContent}>
          <Text style={styles.compactName} numberOfLines={1}>
            {workout.name}
          </Text>
          {workout.category && (
            <Text style={styles.compactMeta}>
              {workout.category}
              {workout.difficulty && ` • ${workout.difficulty}`}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.imageBackground}
        imageStyle={styles.image}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
          style={styles.gradient}
        >
          {/* Badge */}
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}

          {/* Duration */}
          {workout.duration && (
            <View style={styles.duration}>
              <Clock size={14} color={colors.white} style={styles.durationIcon} />
              <Text style={styles.durationText}>{workout.duration} min</Text>
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.workoutName} numberOfLines={2}>
              {workout.name}
            </Text>
            {(workout.category || workout.difficulty) && (
              <Text style={styles.meta}>
                {workout.category}
                {workout.category && workout.difficulty && ' • '}
                {workout.difficulty}
              </Text>
            )}
            {workout.exercises && (
              <Text style={styles.exerciseCount}>
                {workout.exercises.length} exercises
              </Text>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  imageBackground: {
    width: '100%',
    height: 280,
  },
  image: {
    borderRadius: borderRadius.xl,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.overlayDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    ...typography.overline,
    color: colors.primary,
  },
  duration: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.overlayDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationIcon: {
    marginRight: 4,
  },
  durationText: {
    ...typography.caption,
    color: colors.white,
  },
  content: {
    marginTop: spacing.lg,
  },
  workoutName: {
    ...typography.h3,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.bodySmall,
    color: colors.gray400,
    marginBottom: spacing.xs,
  },
  exerciseCount: {
    ...typography.caption,
    color: colors.gray500,
  },

  // Compact variant
  compactCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactContent: {
    gap: spacing.xs,
  },
  compactName: {
    ...typography.h5,
    color: colors.white,
  },
  compactMeta: {
    ...typography.bodySmall,
    color: colors.gray400,
  },
});
