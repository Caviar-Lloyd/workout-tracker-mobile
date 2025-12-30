import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase/client';
import { useLoading } from '../contexts/LoadingContext';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Button, WorkoutCard, StatCard, ProgressBar } from '../components/ui';
import DNALoader from '../components/DNALoader';
import { Calendar, TrendingUp, Award, Flame } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Placeholder hero image - replace with your own
const HERO_IMAGE = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200';

interface UserProfile {
  first_name: string;
  email: string;
}

interface WeeklyGoal {
  current: number;
  target: number;
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { setIsDashboardLoading } = useLoading();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal>({ current: 0, target: 4 });
  const [streak, setStreak] = useState(0);
  const [prsThisWeek, setPrsThisWeek] = useState(0);
  const [weightChange, setWeightChange] = useState('+0.0');
  const [todayWorkout, setTodayWorkout] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsDashboardLoading(true);
      setLoading(true);

      // Get user profile
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from('clients')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (profile) {
        setUser({
          first_name: profile.first_name || 'There',
          email: profile.email,
        });
      }

      // Load weekly workout progress
      await loadWeeklyProgress(authUser.email!);

      // Load stats
      await loadStats(authUser.email!);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setIsDashboardLoading(false);
    }
  };

  const loadWeeklyProgress = async (email: string) => {
    try {
      // Get current week's workout starts
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startDate = startOfWeek.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('workout_starts')
        .select('*')
        .eq('client_email', email)
        .gte('workout_date', startDate);

      if (data) {
        setWeeklyGoal({
          current: data.length,
          target: 4,
        });
      }
    } catch (error) {
      console.error('Error loading weekly progress:', error);
    }
  };

  const loadStats = async (email: string) => {
    // TODO: Implement real stats from database
    // For now, using placeholder values
    setStreak(12);
    setPrsThisWeek(8);
    setWeightChange('-5.2');
  };

  const handleStartWorkout = () => {
    // @ts-ignore
    navigation.navigate('Workout');
  };

  const handleViewProgram = () => {
    // @ts-ignore
    navigation.navigate('Program');
  };

  const handleViewProgress = () => {
    // @ts-ignore
    navigation.navigate('Progress');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <DNALoader />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 80 },
        ]}
      >
        {/* Hero Section */}
        <ImageBackground
          source={{ uri: HERO_IMAGE }}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
            style={styles.heroGradient}
          >
            <View style={[styles.heroContent, { paddingTop: insets.top + 20 }]}>
              <Text style={styles.greeting}>Welcome {user?.first_name}!</Text>
              <Text style={styles.heroTitle}>
                REALIZE YOUR{'\n'}POTENTIAL
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* Content Container */}
        <View style={styles.content}>
          {/* Weekly Check-in Goal */}
          <View style={styles.goalCard}>
            <Text style={styles.goalLabel}>WEEKLY CHECK-IN GOAL</Text>
            <ProgressBar
              current={weeklyGoal.current}
              total={weeklyGoal.target}
              showFraction
              height={12}
            />
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              value={streak}
              label="Day Streak"
              icon="🔥"
              trend="+3"
              trendDirection="up"
            />
            <StatCard
              value={prsThisWeek}
              label="PRs This Week"
              icon="🏆"
              trend="+5"
              trendDirection="up"
            />
            <StatCard
              value={weightChange}
              label="lbs"
              icon="⚖️"
              trend={weightChange}
              trendDirection="down"
              trendPositive={false}
            />
          </View>

          {/* Section Title */}
          <Text style={styles.sectionTitle}>What will you accomplish today?</Text>

          {/* Today's Workout Card */}
          <WorkoutCard
            workout={{
              name: 'Chest & Triceps Power',
              category: 'Strength',
              difficulty: 'Intermediate',
              duration: 45,
              image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
            }}
            badge="SCHEDULED"
            onPress={handleStartWorkout}
          />

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleViewProgram}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <Calendar size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionLabel}>View Program</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleViewProgress}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <TrendingUp size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Track Progress</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Activity */}
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Award size={20} color={colors.success} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Bench Press PR!</Text>
                <Text style={styles.activityDetails}>225 lbs × 3 reps</Text>
              </View>
              <Text style={styles.activityTime}>Today</Text>
            </View>

            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Flame size={20} color={colors.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Workout Completed</Text>
                <Text style={styles.activityDetails}>Back & Biceps</Text>
              </View>
              <Text style={styles.activityTime}>Yesterday</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero Section
  hero: {
    height: 320,
    width: '100%',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: spacing.lg,
  },
  greeting: {
    ...typography.bodySmall,
    color: colors.gray300,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    ...typography.display,
    color: colors.white,
  },

  // Content
  content: {
    padding: spacing.lg,
  },

  // Weekly Goal Card
  goalCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalLabel: {
    ...typography.overline,
    color: colors.gray400,
    marginBottom: spacing.md,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  // Section Title
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: spacing.md,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionLabel: {
    ...typography.label,
    color: colors.white,
    textAlign: 'center',
  },

  // Activity List
  activityList: {
    gap: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...typography.h5,
    color: colors.white,
    marginBottom: 2,
  },
  activityDetails: {
    ...typography.bodySmall,
    color: colors.gray400,
  },
  activityTime: {
    ...typography.caption,
    color: colors.gray500,
  },
});
