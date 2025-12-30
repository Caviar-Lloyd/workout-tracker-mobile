import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  trendPositive?: boolean; // Whether the trend is good (e.g., up is good for streak, down is good for weight loss)
}

export default function StatCard({
  value,
  label,
  icon,
  trend,
  trendDirection,
  trendPositive = true,
}: StatCardProps) {
  const getTrendColor = () => {
    if (!trend || trendDirection === 'neutral') return colors.gray400;

    const isGoodTrend =
      (trendDirection === 'up' && trendPositive) ||
      (trendDirection === 'down' && !trendPositive);

    return isGoodTrend ? colors.success : colors.error;
  };

  const TrendIcon = trendDirection === 'up' ? TrendingUp : TrendingDown;

  return (
    <View style={styles.card}>
      {icon && <Text style={styles.icon}>{icon}</Text>}

      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
        {trend && trendDirection && trendDirection !== 'neutral' && (
          <TrendIcon
            size={16}
            color={getTrendColor()}
            style={styles.trendIcon}
          />
        )}
      </View>

      <Text style={styles.label}>{label}</Text>

      {trend && (
        <Text style={[styles.trend, { color: getTrendColor() }]}>
          {trend}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 110,
  },
  icon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    ...typography.h2,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  trendIcon: {
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  trend: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
