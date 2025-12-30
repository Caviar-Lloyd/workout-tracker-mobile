import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  showFraction?: boolean;
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export default function ProgressBar({
  current,
  total,
  label,
  showPercentage = false,
  showFraction = true,
  height = 8,
  color = colors.primary,
  backgroundColor = colors.gray800,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.barContainer, { height, backgroundColor }]}>
        <View
          style={[
            styles.bar,
            {
              width: `${percentage}%`,
              height,
              backgroundColor: color,
            },
          ]}
        />
      </View>

      <View style={styles.textContainer}>
        {showFraction && (
          <Text style={styles.text}>
            {current} / {total}
          </Text>
        )}
        {showPercentage && (
          <Text style={styles.text}>{Math.round(percentage)}%</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    ...typography.overline,
    color: colors.gray400,
    marginBottom: spacing.sm,
  },
  barContainer: {
    width: '100%',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  bar: {
    borderRadius: borderRadius.full,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    ...typography.caption,
    color: colors.gray500,
  },
});
