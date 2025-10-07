import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase/client';
import { getTotalWorkoutCount, getLastWorkout, getNextWorkout, getWorkoutTemplate, getAllCompletedWorkouts } from '../lib/supabase/workout-service';
import { getUserProfile, updateWorkoutPreferences } from '../lib/supabase/user-service';
import type { WeekNumber, DayNumber } from '../types/workout';
import ParticleBackground from '../components/ParticleBackground';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UserData {
  firstName: string;
  email: string;
}

interface LastWorkout {
  week: WeekNumber;
  day: DayNumber;
  date: string;
  workoutName: string;
}

interface NextWorkout {
  week: WeekNumber;
  day: DayNumber;
  workoutName: string;
}

const WORKOUT_NAMES: Record<number, string> = {
  1: 'Chest, Triceps, Abs - Multi-Joint',
  2: 'Shoulders, Legs, Calves - Multi-Joint',
  3: 'Back, Traps, Biceps - Multi-Joint',
  4: 'Chest, Triceps, Abs - Isolation',
  5: 'Shoulders, Legs, Calves - Isolation',
  6: 'Back, Traps, Biceps - Isolation',
};

function WorkoutExercisesList({ workoutDay, week, isVideoPreview = false }: { workoutDay: number; week: number; isVideoPreview?: boolean }) {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const template = await getWorkoutTemplate(week as WeekNumber, workoutDay as DayNumber);
        setExercises(template.exercises);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [workoutDay, week]);

  if (loading) {
    return <Text style={styles.loadingExercises}>Loading exercises...</Text>;
  }

  return (
    <View style={isVideoPreview ? styles.exerciseVideoPreview : styles.exercisesSection}>
      {!isVideoPreview && <Text style={styles.exercisesTitle}>Exercises</Text>}
      {exercises.map((exercise, index) => (
        <View
          key={index}
          style={isVideoPreview ? styles.exerciseVideoItem : styles.exerciseItem}
        >
          <Text style={isVideoPreview ? styles.exerciseVideoName : styles.exerciseName}>
            {exercise.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState<UserData>({
    firstName: 'Loading...',
    email: '',
  });
  const [totalWorkouts, setTotalWorkouts] = useState<number>(0);
  const [lastWorkout, setLastWorkout] = useState<LastWorkout | null>(null);
  const [nextWorkout, setNextWorkout] = useState<NextWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [nextWorkoutExercises, setNextWorkoutExercises] = useState<any[]>([]);
  const [schedulePattern, setSchedulePattern] = useState<'6-1' | '3-1' | '2-1' | '1-1' | 'custom'>('6-1');
  const [workoutSchedule, setWorkoutSchedule] = useState<{ [key: string]: { week: number; day: number } }>({});
  const [selectedWorkoutToMove, setSelectedWorkoutToMove] = useState<{ date: string; week: number; day: number } | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [showPatternDropdown, setShowPatternDropdown] = useState(false);
  const [startingDayOfWeek, setStartingDayOfWeek] = useState<number>(0); // 0=Sun, 1=Mon, etc.
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [programStartDate, setProgramStartDate] = useState<Date | null>(null);
  const [isProgramConfirmed, setIsProgramConfirmed] = useState(false);
  const [showInitialSetup, setShowInitialSetup] = useState(false);
  const [setupStep, setSetupStep] = useState<'split' | 'restday' | 'date' | 'confirm'>('split');
  const [restDaysOfWeek, setRestDaysOfWeek] = useState<number[]>([0]); // Array of rest days: 0=Sunday, 1=Monday, etc.
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [showRestDayDropdown, setShowRestDayDropdown] = useState(false);
  const [showWorkoutSplitDropdown, setShowWorkoutSplitDropdown] = useState(false);
  const [isSelectedWorkoutCompleted, setIsSelectedWorkoutCompleted] = useState(false);

  useEffect(() => {
    fetchUserData();
    // Check if this is first time - no program confirmed yet
    // In a real app, you'd check localStorage/AsyncStorage
    // For now, we'll check if there's no schedule
    if (!isProgramConfirmed) {
      setShowInitialSetup(true);
    }
  }, []);

  useEffect(() => {
    // Generate workout schedule only if program is confirmed
    if (isProgramConfirmed && userData.email) {
      generateWorkoutSchedule();
    }
  }, [isProgramConfirmed, userData.email]);

  // Check if selected workout is completed
  useEffect(() => {
    const checkIfWorkoutCompleted = async () => {
      if (!userData.email || !selectedDate) {
        setIsSelectedWorkoutCompleted(false);
        return;
      }

      const workout = getWorkoutForDate(selectedDate);
      if (!workout) {
        setIsSelectedWorkoutCompleted(false);
        return;
      }

      const dateKey = selectedDate.toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      // If the date is in the past or is today, check if it's in workout_starts
      if (dateKey <= today) {
        const completedWorkouts = await getAllCompletedWorkouts(userData.email);
        const isCompleted = completedWorkouts.some(w => w.date === dateKey);
        setIsSelectedWorkoutCompleted(isCompleted);
      } else {
        // Future workout - not completed
        setIsSelectedWorkoutCompleted(false);
      }
    };

    checkIfWorkoutCompleted();
  }, [selectedDate, workoutSchedule, userData.email]);

  // NOTE: We no longer save workout_schedule to the database.
  // The schedule is dynamically generated from workout_starts table on each load.
  // This ensures the schedule is always accurate based on actual completed workouts.

  const generateWorkoutSchedule = async () => {
    if (!userData.email || !programStartDate) {
      return;
    }

    console.log('=== LOADING WORKOUT SCHEDULE ===');
    console.log('Pattern:', schedulePattern, 'Rest days:', restDaysOfWeek);
    console.log('Rest days type:', typeof restDaysOfWeek, 'Is array:', Array.isArray(restDaysOfWeek));
    console.log('Rest days[0]:', restDaysOfWeek[0]);

    // Get all completed workouts from the database
    const completedWorkouts = await getAllCompletedWorkouts(userData.email);
    console.log('Completed workouts:', completedWorkouts);

    // Build schedule from actual completed workouts
    const schedule: { [key: string]: { week: number; day: number } } = {};
    completedWorkouts.forEach(workout => {
      schedule[workout.date] = { week: workout.week, day: workout.day };
    });

    // Find the last completed workout to determine next workout week/day
    let nextWeek = 1;
    let nextDay = 1;
    let lastDate = new Date(programStartDate);

    if (completedWorkouts.length > 0) {
      const sortedWorkouts = [...completedWorkouts].sort((a, b) =>
        new Date(b.date + 'T00:00:00').getTime() - new Date(a.date + 'T00:00:00').getTime()
      );
      const lastWorkout = sortedWorkouts[0];
      lastDate = new Date(lastWorkout.date + 'T00:00:00');

      // Calculate next day/week in sequence
      if (lastWorkout.day === 6) {
        // Completed Day 6, move to next week, Day 1
        nextDay = 1;
        nextWeek = (lastWorkout.week % 6) + 1; // Weeks cycle 1-6
      } else {
        // Continue in same week, next day
        nextDay = lastWorkout.day + 1;
        nextWeek = lastWorkout.week;
      }
      console.log('Last workout:', lastWorkout.date, 'Week', lastWorkout.week, 'Day', lastWorkout.day, '→ Next: Week', nextWeek, 'Day', nextDay);
    }

    // Generate future scheduled workouts - ADAPTIVE SCHEDULING
    // The next uncompleted workout always starts TODAY (or next available non-rest day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start scheduling from TODAY, not from last completed workout date
    let currentDate = new Date(today);
    let currentWeek = nextWeek;
    let currentDay = nextDay;
    let daysAdded = 0;

    while (daysAdded < 90) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();

      // Check if this day of week is a rest day
      const isRestDay = restDaysOfWeek.includes(dayOfWeek);

      // Log first few iterations for debugging
      if (daysAdded < 10) {
        console.log(`Day ${daysAdded}: ${dateKey} (dayOfWeek=${dayOfWeek}) isRestDay=${isRestDay} restDaysOfWeek=${JSON.stringify(restDaysOfWeek)}`);
      }

      if (!isRestDay && !schedule[dateKey]) {
        // Only add if not already a completed workout
        // This ensures next workout always "catches up" to today
        schedule[dateKey] = { week: currentWeek, day: currentDay };

        // Advance to next day/week in the program sequence
        if (currentDay === 6) {
          currentDay = 1;
          currentWeek = (currentWeek % 6) + 1; // Cycle through weeks 1-6
        } else {
          currentDay++;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
      daysAdded++;
    }

    console.log('Schedule with completed + future workouts:', schedule);

    // Log specific dates for debugging
    console.log('2025-10-06 (Sunday):', schedule['2025-10-06']);
    console.log('2025-10-07 (Monday):', schedule['2025-10-07']);
    console.log('2025-10-13 (Sunday):', schedule['2025-10-13']);
    console.log('2025-10-14 (Monday):', schedule['2025-10-14']);

    setWorkoutSchedule(schedule);
  };

  const getNextWorkoutDay = (): number => {
    // Find the last workout day in the schedule
    const dates = Object.keys(workoutSchedule).sort();
    if (dates.length === 0) {
      return 1; // Start with Day 1 if no workouts scheduled
    }

    const lastDate = dates[dates.length - 1];
    const lastWorkout = workoutSchedule[lastDate];
    return (lastWorkout.day % 6) + 1;
  };

  const toggleWorkoutOnDate = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    const updatedSchedule = { ...workoutSchedule };

    if (updatedSchedule[dateKey]) {
      // Remove workout if already scheduled
      const removedWorkout = updatedSchedule[dateKey];
      delete updatedSchedule[dateKey];

      // Regenerate all workouts after this date to maintain sequence
      regenerateScheduleAfterDate(dateKey, removedWorkout, updatedSchedule);
    } else {
      // Add workout with next week/day in sequence
      const dates = Object.keys(updatedSchedule).sort();
      let nextWeek = 1;
      let nextDay = 1;

      if (dates.length > 0) {
        const lastDate = dates[dates.length - 1];
        const lastWorkout = updatedSchedule[lastDate];
        if (lastWorkout.day === 6) {
          nextDay = 1;
          nextWeek = (lastWorkout.week % 6) + 1;
        } else {
          nextDay = lastWorkout.day + 1;
          nextWeek = lastWorkout.week;
        }
      }

      updatedSchedule[dateKey] = { week: nextWeek, day: nextDay };

      // If not in custom mode, regenerate future workouts
      if (!isCustomMode) {
        regenerateScheduleAfterDate(dateKey, { week: nextWeek, day: nextDay }, updatedSchedule);
      }
    }

    setWorkoutSchedule(updatedSchedule);
  };

  const regenerateScheduleAfterDate = (changedDateKey: string, lastWorkout: { week: number; day: number }, schedule: { [key: string]: { week: number; day: number } }) => {
    if (isCustomMode) return; // Don't auto-regenerate in custom mode

    // Get all dates after the changed date
    const allDates = Object.keys(schedule).sort();
    const changedDate = new Date(changedDateKey + 'T00:00:00');

    // Remove all workouts after the changed date
    allDates.forEach(dateKey => {
      const date = new Date(dateKey + 'T00:00:00');
      if (date > changedDate) {
        delete schedule[dateKey];
      }
    });

    // Regenerate based on pattern
    let currentWeek = lastWorkout.week;
    let currentDay = lastWorkout.day;

    // Calculate next workout
    if (currentDay === 6) {
      currentDay = 1;
      currentWeek = (currentWeek % 6) + 1;
    } else {
      currentDay++;
    }

    for (let i = 1; i < 90; i++) {
      const date = new Date(changedDate);
      date.setDate(changedDate.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      // Check if this is a rest day
      const isRestDay = restDaysOfWeek.includes(dayOfWeek);

      if (!isRestDay) {
        schedule[dateKey] = { week: currentWeek, day: currentDay };

        // Advance to next day/week
        if (currentDay === 6) {
          currentDay = 1;
          currentWeek = (currentWeek % 6) + 1;
        } else {
          currentDay++;
        }
      }
    }
  };

  const handlePatternChange = async (pattern: '6-1' | '3-1' | '2-1' | '1-1' | 'custom') => {
    setSchedulePattern(pattern);
    setShowPatternDropdown(false);

    if (pattern === 'custom') {
      setIsCustomMode(true);
      setWorkoutSchedule({}); // Clear schedule for custom mode
    } else {
      setIsCustomMode(false);
    }

    // Save pattern change to user profile
    if (isProgramConfirmed) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateWorkoutPreferences(user.id, pattern, restDaysOfWeek[0]);
      }
    }
  };

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const firstName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'User';
        const email = user.email || '';
        setUserData({ firstName, email });

        // Load user profile and preferences
        const profile = await getUserProfile(user.id);
        console.log('=== PROFILE DATA ===', JSON.stringify(profile, null, 2));
        if (profile) {
          // Pre-fill saved schedule pattern and starting day if they exist
          if (profile.schedule_pattern) {
            console.log('Setting schedule pattern:', profile.schedule_pattern);
            setSchedulePattern(profile.schedule_pattern);
          } else {
            console.log('No schedule_pattern in profile');
          }
          if (profile.starting_day_of_week !== null && profile.starting_day_of_week !== undefined) {
            console.log('Setting starting day of week:', profile.starting_day_of_week);
            setStartingDayOfWeek(profile.starting_day_of_week);
            setRestDaysOfWeek([profile.starting_day_of_week]);
          } else {
            console.log('No starting_day_of_week in profile');
          }

          // Pre-fill program start date from workout history if it exists
          if (profile.program_start_date) {
            const startDate = new Date(profile.program_start_date);
            setProgramStartDate(startDate);
            // Also pre-fill starting day of week from that date if not already set
            if (profile.starting_day_of_week === null) {
              setStartingDayOfWeek(startDate.getDay());
            }
          }

          // Check if user has completed ALL required setup
          const hasCompleteSetup =
            profile.schedule_pattern &&
            profile.starting_day_of_week !== null &&
            profile.program_start_date;

          if (hasCompleteSetup) {
            // User has everything configured - regenerate schedule from completed workouts
            // Don't load old schedule from DB, always regenerate to ensure rest days are correct
            console.log('User has complete setup - will regenerate schedule...');
            setIsProgramConfirmed(true);
            setShowInitialSetup(false);
          } else {
            // User is missing some info - show setup to fill in the gaps
            // Determine which step to start at based on what's missing
            if (!profile.schedule_pattern) {
              setSetupStep('split');
            } else if (profile.schedule_pattern !== 'custom' && profile.starting_day_of_week === null) {
              setSetupStep('restday');
            } else if (!profile.program_start_date) {
              setSetupStep('date');
            } else {
              // Has everything except workout_schedule, ask to confirm
              setSetupStep('confirm');
            }
            setShowInitialSetup(true);
          }
        }

        // Fetch workout stats
        const [count, last] = await Promise.all([
          getTotalWorkoutCount(email),
          getLastWorkout(email)
        ]);

        setTotalWorkouts(count);
        setLastWorkout(last);

        // Calculate next workout
        let nextWorkoutData;
        if (last) {
          const next = getNextWorkout(last.week, last.day);
          nextWorkoutData = {
            week: next.week,
            day: next.day,
            workoutName: WORKOUT_NAMES[next.day] || `Day ${next.day}`,
          };
        } else {
          // Default to Week 1, Day 1 if no workouts yet
          nextWorkoutData = {
            week: 1,
            day: 1,
            workoutName: 'Chest, Triceps, Abs - Multi-Joint',
          };
        }
        setNextWorkout(nextWorkoutData);

        // Fetch exercises for next workout
        try {
          const template = await getWorkoutTemplate(nextWorkoutData.week as WeekNumber, nextWorkoutData.day as DayNumber);
          setNextWorkoutExercises(template.exercises);
        } catch (error) {
          console.error('Error fetching next workout exercises:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartWorkout = () => {
    if (nextWorkout) {
      // @ts-ignore
      navigation.navigate('Workout', { week: nextWorkout.week, day: nextWorkout.day });
    }
  };

  const handleViewProgress = () => {
    // @ts-ignore
    navigation.navigate('Progress');
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days in month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const isSameDay = (date1: Date | null, date2: Date) => {
    if (!date1) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return isSameDay(date, today);
  };

  const getWorkoutForDate = (date: Date | null): { week: number; day: number } | null => {
    if (!date) return null;
    const dateKey = date.toISOString().split('T')[0];
    return workoutSchedule[dateKey] || null;
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);

    // If in setup mode selecting start date, set it and move to confirm step
    if (showInitialSetup && setupStep === 'date') {
      setProgramStartDate(date);
      setSetupStep('confirm');
      return;
    }

    // If in move mode and clicking a different date, move the workout
    if (selectedWorkoutToMove) {
      moveWorkout(selectedWorkoutToMove.date, date.toISOString().split('T')[0]);
      setSelectedWorkoutToMove(null);
      return;
    }

    // Only allow toggling in custom mode
    if (isCustomMode) {
      toggleWorkoutOnDate(date);
    }
  };

  const handleWorkoutLongPress = (date: Date, workout: { week: number; day: number }) => {
    setSelectedWorkoutToMove({ date: date.toISOString().split('T')[0], week: workout.week, day: workout.day });
  };

  const moveWorkout = (fromDateKey: string, toDateKey: string) => {
    const updatedSchedule = { ...workoutSchedule };
    const movedWorkout = updatedSchedule[fromDateKey];

    // Parse dates with explicit timezone handling to avoid UTC conversion
    const fromDate = new Date(fromDateKey + 'T00:00:00');
    const toDate = new Date(toDateKey + 'T00:00:00');

    if (isCustomMode) {
      // In custom mode, just swap the workouts
      delete updatedSchedule[fromDateKey];
      updatedSchedule[toDateKey] = movedWorkout;
      setWorkoutSchedule(updatedSchedule);
      return;
    }

    // For non-custom modes:
    console.log('=== MOVE VALIDATION ===');
    console.log('From date:', fromDateKey, '(day of week:', fromDate.getDay(), ')');
    console.log('To date:', toDateKey, '(day of week:', toDate.getDay(), ')');
    console.log('Rest days of week:', restDaysOfWeek);
    console.log('Moving workout:', movedWorkout);

    // 1. Cannot move to same date
    if (toDate.getTime() === fromDate.getTime()) {
      alert('Workout is already on this date');
      return;
    }

    // 2. Cannot move to any designated rest day
    const targetDayOfWeek = toDate.getDay();
    if (restDaysOfWeek.includes(targetDayOfWeek)) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      alert(`Cannot move workouts to a rest day (${dayNames[targetDayOfWeek]})`);
      return;
    }

    // 3. Check if moving backward - need to validate against previous workouts
    const isMovingBackward = toDate < fromDate;

    if (isMovingBackward) {
      console.log('Moving BACKWARD - checking for conflicts...');

      // Find all workouts between toDate and fromDate
      const allDates = Object.keys(updatedSchedule).sort();
      let hasConflict = false;

      for (const dateKey of allDates) {
        const checkDate = new Date(dateKey + 'T00:00:00');
        // Check workouts between target and source (exclusive)
        if (checkDate >= toDate && checkDate < fromDate) {
          const workoutOnDate = updatedSchedule[dateKey];
          // If there's a workout at or after the one we're moving, we can't move backward
          if (workoutOnDate.day >= movedWorkout.day) {
            hasConflict = true;
            alert(`Cannot move Week ${movedWorkout.week} Day ${movedWorkout.day} before Week ${workoutOnDate.week} Day ${workoutOnDate.day}. Workouts must stay in sequential order.`);
            break;
          }
        }
      }

      if (hasConflict) return;
    }

    // 4. Get all workouts that need to shift
    const allDates = Object.keys(updatedSchedule).sort();
    const workoutsToShift: Array<{ week: number; day: number; originalDate: string }> = [];

    // Collect all workouts from the fromDate onwards
    allDates.forEach(dateKey => {
      const date = new Date(dateKey + 'T00:00:00');
      if (date >= fromDate) {
        workoutsToShift.push({ week: updatedSchedule[dateKey].week, day: updatedSchedule[dateKey].day, originalDate: dateKey });
        delete updatedSchedule[dateKey];
      }
    });

    console.log('=== MOVE WORKOUT DEBUG ===');
    console.log('Rest days of week:', restDaysOfWeek);
    console.log('Moving backward?', isMovingBackward);
    console.log('Workouts to shift:', workoutsToShift);

    // 5. Place these workouts starting from toDate, skipping rest days
    let workoutIndex = 0;
    let currentDate = new Date(toDate);
    const maxDays = 365; // Safety limit
    let daysChecked = 0;

    while (workoutIndex < workoutsToShift.length && daysChecked < maxDays) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();

      // Check if this day of week is in the rest days array
      const isRestDay = restDaysOfWeek.includes(dayOfWeek);

      // If not a rest day, place the workout
      if (!isRestDay) {
        console.log(`  -> Placing Week ${workoutsToShift[workoutIndex].week} Day ${workoutsToShift[workoutIndex].day} on ${dateKey}`);
        updatedSchedule[dateKey] = { week: workoutsToShift[workoutIndex].week, day: workoutsToShift[workoutIndex].day };
        workoutIndex++;
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      daysChecked++;
    }

    console.log('=== END DEBUG ===');

    setWorkoutSchedule(updatedSchedule);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ddbdb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const monthDays = getDaysInMonth(currentMonth);
  const selectedWorkout = getWorkoutForDate(selectedDate);
  const selectedWorkoutData = selectedWorkout ? {
    week: selectedWorkout.week,
    day: selectedWorkout.day,
    workoutName: WORKOUT_NAMES[selectedWorkout.day] || `Day ${selectedWorkout.day}`,
  } : null;

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

      <View style={[styles.content, {
        paddingTop: Math.max(insets.top, 20) + 10,
        paddingBottom: Math.max(insets.bottom, 20) + 60,
      }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>
                Welcome, <Text style={styles.nameGradient}>{userData.firstName}</Text>
              </Text>
              <Text style={styles.subtitle}>Track your progress and crush your goals!</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettingsModal(true)}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                  stroke="#2ddbdb"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                  stroke="#2ddbdb"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Workouts</Text>
            <Text style={styles.statValue}>{totalWorkouts}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Last Workout</Text>
            {lastWorkout ? (
              <>
                <Text style={styles.statValue}>W{lastWorkout.week} D{lastWorkout.day}</Text>
                <Text style={styles.statSubtext}>
                  {new Date(lastWorkout.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </>
            ) : (
              <Text style={styles.statSubtext}>None</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.statCard, styles.viewProgressCard]}
            onPress={handleViewProgress}
          >
            <Text style={styles.statLabel}>View Progress</Text>
            <Text style={styles.statSubtext}>→</Text>
          </TouchableOpacity>
        </View>

        {selectedWorkoutToMove && (
          <View style={styles.moveNotice}>
            <Text style={styles.moveNoticeText}>Tap a date to move workout Day {selectedWorkoutToMove.day}</Text>
            <TouchableOpacity onPress={() => setSelectedWorkoutToMove(null)}>
              <Text style={styles.moveCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Single Container - Vertical Layout */}
        <View style={styles.workoutContainer}>
          {/* Workout Frequency Section */}
          <View style={styles.frequencySection}>
            <Text style={styles.frequencyTitle}>Program Info</Text>

            <View style={styles.frequencyControls}>
              <View style={styles.frequencyControl}>
                <Text style={styles.frequencyLabel}>Workout Split</Text>
                <View style={styles.frequencyValue}>
                  <Text style={styles.frequencyValueText}>
                    {schedulePattern === 'custom' ? 'Custom' : `${schedulePattern.split('-')[0]} on / ${schedulePattern.split('-')[1]} off`}
                  </Text>
                </View>
              </View>

              <View style={styles.frequencyControl}>
                <Text style={styles.frequencyLabel}>Start Date</Text>
                <View style={styles.frequencyValue}>
                  <Text style={styles.frequencyValueText}>
                    {programStartDate ? programStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.frequencyHelpText}>
              You can adjust your workout split in Settings
            </Text>

          </View>

          {/* Custom Mode Reminder */}
          {isCustomMode && (
            <View style={styles.customReminder}>
              <Text style={styles.customReminderText}>
                📅 Tap the dates you want to train on
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.sectionDivider} />

          {/* Calendar and Workout Details - Side by Side */}
          <View style={styles.calendarWorkoutRow}>
            {/* Calendar Section - Left */}
            <View style={styles.calendarColumn}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.monthButton}>
                  <Text style={styles.monthButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.calendarMonth}>
                  {currentMonth.toLocaleDateString('en-US', { month: 'short' })}
                </Text>
                <TouchableOpacity onPress={() => changeMonth('next')} style={styles.monthButton}>
                  <Text style={styles.monthButtonText}>→</Text>
                </TouchableOpacity>
              </View>

              {/* Day Headers */}
              <View style={styles.dayHeaders}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <Text key={index} style={styles.dayHeader}>{day}</Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
              {monthDays.map((date, index) => {
                const workout = date ? getWorkoutForDate(date) : null;
                const isMovingThis = selectedWorkoutToMove && date && selectedWorkoutToMove.date === date.toISOString().split('T')[0];

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      !date && styles.calendarDayEmpty,
                      date && isSameDay(date, selectedDate) && styles.calendarDaySelected,
                      date && isToday(date) && styles.calendarDayToday,
                      workout && styles.calendarDayWorkout,
                      isMovingThis && styles.calendarDayMoving,
                    ]}
                    onPress={() => {
                      if (!date) return;
                      handleDatePress(date);
                    }}
                    onLongPress={() => date && workout && !isCustomMode && handleWorkoutLongPress(date, workout)}
                    disabled={!date}
                  >
                    {date && (
                      <>
                        <Text style={[
                          styles.calendarDayText,
                          isSameDay(date, selectedDate) && styles.calendarDayTextSelected,
                          isToday(date) && styles.calendarDayTextToday,
                        ]}>
                          {date.getDate()}
                        </Text>
                        {workout && (
                          <View style={styles.workoutDayBadge}>
                            <Text style={styles.workoutDayBadgeText}>D{workout.day}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

              {/* Helper Text */}
              <View style={styles.calendarHelperContainer}>
                {isCustomMode ? (
                  <Text style={styles.calendarHelperText}>
                    Tap dates to add/remove workouts
                  </Text>
                ) : (
                  <Text style={styles.calendarHelperText}>
                    Tap date to view workout details
                  </Text>
                )}
              </View>

              {/* Change Date Button - Below Calendar */}
              {selectedWorkoutData && !isCustomMode && (
                <TouchableOpacity
                  style={styles.changeDateButton}
                  onPress={() => {
                    const workoutDay = selectedWorkoutDay;
                    if (workoutDay) {
                      handleWorkoutLongPress(selectedDate, workoutDay);
                    }
                  }}
                >
                  <Text style={styles.changeDateButtonText}>Change Date</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Workout Details - Right */}
            <View style={styles.workoutDetailColumn}>
              {selectedWorkoutData ? (
                <>
                  <View style={styles.workoutInfoCard}>
                    <Text style={styles.workoutInfoDate}>
                      {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={styles.workoutInfoName}>{selectedWorkoutData.workoutName.split(' - ')[0]}</Text>
                    <Text style={styles.workoutInfoMeta}>
                      Week {selectedWorkoutData.week} • Day {selectedWorkoutData.day}
                    </Text>
                  </View>

                  {/* Exercise List */}
                  <View style={styles.exercisePreviewSection}>
                    <Text style={styles.exercisePreviewTitle}>Exercises</Text>
                    <ScrollView style={styles.exerciseListScroll} showsVerticalScrollIndicator={false}>
                      <WorkoutExercisesList
                        workoutDay={selectedWorkoutData.day}
                        week={selectedWorkoutData.week}
                        isVideoPreview={true}
                      />
                    </ScrollView>
                  </View>

                  <TouchableOpacity
                    style={styles.startWorkoutButton}
                    onPress={() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const selectedDateOnly = new Date(selectedDate);
                      selectedDateOnly.setHours(0, 0, 0, 0);
                      const isFutureWorkout = selectedDateOnly > today;

                      if (isSelectedWorkoutCompleted) {
                        // Past completed workout - view progress
                        // @ts-ignore
                        navigation.navigate('Progress');
                      } else if (isFutureWorkout) {
                        // Future workout - go to program screen to preview videos
                        // @ts-ignore
                        navigation.navigate('Program');
                      } else {
                        // Today's workout or missed workout - start it
                        // @ts-ignore
                        navigation.navigate('Workout', { week: selectedWorkoutData.week, day: selectedWorkoutData.day });
                      }
                    }}
                  >
                    <Text style={styles.startWorkoutButtonText}>
                      {isSelectedWorkoutCompleted
                        ? 'View Progress'
                        : (() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const selectedDateOnly = new Date(selectedDate);
                            selectedDateOnly.setHours(0, 0, 0, 0);
                            return selectedDateOnly > today ? 'Preview Workout' : 'Start Workout';
                          })()
                      }
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.workoutInfoCard}>
                  <Text style={styles.workoutInfoDate}>
                    {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.emptyStateText}>Rest Day</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Initial Setup Overlay */}
      {showInitialSetup && setupStep === 'split' && (
        <View style={styles.setupOverlay}>
          <View style={styles.setupCard}>
            <Text style={styles.setupCardTitle}>Choose Your Workout Split</Text>
            <Text style={styles.setupDescription}>
              How many days per week do you want to train?
            </Text>
            <View style={styles.settingOptions}>
              {[
                { value: '6-1', label: '6 on / 1 off', description: '6 training days, 1 rest' },
                { value: '3-1', label: '3 on / 1 off', description: '3 training days, 1 rest' },
                { value: '2-1', label: '2 on / 1 off', description: '2 training days, 1 rest' },
                { value: '1-1', label: '1 on / 1 off', description: 'Alternating days' },
                { value: 'custom', label: 'Custom', description: 'Choose your own schedule' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.setupOptionButton,
                    schedulePattern === option.value && styles.setupOptionButtonActive,
                  ]}
                  onPress={() => setSchedulePattern(option.value as any)}
                >
                  <Text
                    style={[
                      styles.setupOptionText,
                      schedulePattern === option.value && styles.setupOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.setupOptionDescription}>{option.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.saveSettingsButton}
              onPress={() => {
                // Skip rest day selection only for custom mode
                if (schedulePattern === 'custom') {
                  setSetupStep('date');
                } else {
                  setSetupStep('restday');
                }
              }}
            >
              <Text style={styles.saveSettingsButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Rest Day Selection Step - For all non-custom patterns */}
      {showInitialSetup && setupStep === 'restday' && (
        <View style={styles.setupOverlay}>
          <View style={styles.setupCard}>
            <Text style={styles.setupCardTitle}>Choose Your Rest Day</Text>
            <Text style={styles.setupDescription}>
              Which day of the week would you like as your rest day?
            </Text>
            <View style={styles.settingOptions}>
              {[
                { value: 0, label: 'Sunday' },
                { value: 1, label: 'Monday' },
                { value: 2, label: 'Tuesday' },
                { value: 3, label: 'Wednesday' },
                { value: 4, label: 'Thursday' },
                { value: 5, label: 'Friday' },
                { value: 6, label: 'Saturday' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.setupOptionButton,
                    restDaysOfWeek.includes(option.value) && styles.setupOptionButtonActive,
                  ]}
                  onPress={() => setRestDaysOfWeek([option.value])}
                >
                  <Text
                    style={[
                      styles.setupOptionText,
                      restDaysOfWeek.includes(option.value) && styles.setupOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setSetupStep('split')}
              >
                <Text style={styles.cancelButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveSettingsButton}
                onPress={() => setSetupStep('date')}
              >
                <Text style={styles.saveSettingsButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Date Selection Banner - shows at top when in date step */}
      {showInitialSetup && setupStep === 'date' && (
        <View style={styles.dateSelectionBanner}>
          <Text style={styles.dateSelectionTitle}>📅 Select Start Date</Text>
          <Text style={styles.dateSelectionText}>
            Click on the calendar below to choose the day you plan to do your first workout (Day 1)
          </Text>
          {programStartDate && (
            <Text style={styles.dateSelectionSelected}>
              Selected: {programStartDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          )}
          <TouchableOpacity
            style={styles.backToSplitButton}
            onPress={() => {
              // Go back to rest day selection for all non-custom patterns
              if (schedulePattern !== 'custom') {
                setSetupStep('restday');
              } else {
                setSetupStep('split');
              }
            }}
          >
            <Text style={styles.backToSplitButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Confirmation Modal */}
      {showInitialSetup && setupStep === 'confirm' && (
        <View style={styles.setupOverlay}>
          <View style={styles.setupCard}>
            <Text style={styles.setupCardTitle}>Confirm Setup</Text>
            <Text style={styles.setupDescription}>
              Please confirm your program setup:
            </Text>
            <View style={styles.confirmItem}>
              <Text style={styles.confirmLabel}>Workout Split:</Text>
              <Text style={styles.confirmValue}>
                {schedulePattern === 'custom' ? 'Custom' : `${schedulePattern.split('-')[0]} on / ${schedulePattern.split('-')[1]} off`}
              </Text>
            </View>
            {schedulePattern !== 'custom' && (
              <View style={styles.confirmItem}>
                <Text style={styles.confirmLabel}>Rest Day:</Text>
                <Text style={styles.confirmValue}>
                  {restDaysOfWeek.map(day =>
                    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]
                  ).join(', ')}
                </Text>
              </View>
            )}
            <View style={styles.confirmItem}>
              <Text style={styles.confirmLabel}>Start Date:</Text>
              <Text style={styles.confirmValue}>
                {programStartDate ? programStartDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }) : 'Not selected'}
              </Text>
            </View>
            <View style={styles.notificationBox}>
              <Text style={styles.notificationBoxText}>
                ℹ️ Your start date will be locked after confirmation. You can change your workout split anytime in Settings.
              </Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setSetupStep('date')}
              >
                <Text style={styles.cancelButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={async () => {
                  setIsProgramConfirmed(true);
                  setShowInitialSetup(false);
                  setSetupStep('split');

                  // Save user preferences to Supabase
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    await updateWorkoutPreferences(
                      user.id,
                      schedulePattern,
                      restDaysOfWeek[0]
                    );
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>Confirm & Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Program Settings</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Program Start Date - Read Only */}
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Program Start Date (Locked)</Text>
                <View style={styles.lockedDateDisplay}>
                  <Text style={styles.lockedDateText}>
                    {programStartDate ? programStartDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    }) : 'Not set'}
                  </Text>
                </View>
                <Text style={styles.settingHelperText}>
                  Start date cannot be changed once set
                </Text>
              </View>

              {/* Workout Split - Dropdown */}
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Workout Split</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowWorkoutSplitDropdown(!showWorkoutSplitDropdown)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {schedulePattern === '6-1' ? '6 on / 1 off' :
                     schedulePattern === '3-1' ? '3 on / 1 off' :
                     schedulePattern === '2-1' ? '2 on / 1 off' :
                     schedulePattern === '1-1' ? '1 on / 1 off' :
                     'Custom'}
                  </Text>
                  <Text style={styles.dropdownArrow}>{showWorkoutSplitDropdown ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {showWorkoutSplitDropdown && (
                  <View style={styles.dropdownMenu}>
                    {[
                      { value: '6-1', label: '6 on / 1 off' },
                      { value: '3-1', label: '3 on / 1 off' },
                      { value: '2-1', label: '2 on / 1 off' },
                      { value: '1-1', label: '1 on / 1 off' },
                      { value: 'custom', label: 'Custom' },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.dropdownItem}
                        onPress={() => {
                          handlePatternChange(option.value as any);
                          setShowWorkoutSplitDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Rest Days - Dropdown */}
              {schedulePattern !== 'custom' && (
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Rest Day</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowRestDayDropdown(!showRestDayDropdown)}
                  >
                    <Text style={styles.dropdownButtonText}>
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][restDaysOfWeek[0]]}
                    </Text>
                    <Text style={styles.dropdownArrow}>{showRestDayDropdown ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {showRestDayDropdown && (
                    <View style={styles.dropdownMenu}>
                      {[
                        { value: 0, label: 'Sunday' },
                        { value: 1, label: 'Monday' },
                        { value: 2, label: 'Tuesday' },
                        { value: 3, label: 'Wednesday' },
                        { value: 4, label: 'Thursday' },
                        { value: 5, label: 'Friday' },
                        { value: 6, label: 'Saturday' },
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setRestDaysOfWeek([option.value]);
                            setShowRestDayDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{option.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <Text style={styles.settingHelperText}>
                    Choose which day of the week is your rest day
                  </Text>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveSettingsButton}
                onPress={() => {
                  setShowSettingsModal(false);
                }}
              >
                <Text style={styles.saveSettingsButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
    zIndex: 2,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0e27',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  settingsButton: {
    padding: 8,
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  nameGradient: {
    color: '#2ddbdb',
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  viewProgressCard: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderColor: 'rgba(45, 219, 219, 0.3)',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  workoutContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  frequencySection: {
    marginBottom: 0,
  },
  frequencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  frequencyControls: {
    flexDirection: 'row',
    gap: 12,
  },
  frequencyControl: {
    flex: 1,
  },
  frequencyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  frequencyDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  frequencyDropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2ddbdb',
  },
  frequencyDropdownArrow: {
    fontSize: 10,
    color: '#2ddbdb',
  },
  frequencyValue: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  frequencyValueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  frequencyHelpText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  calendarWorkoutRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  calendarColumn: {
    flex: 0.55,
  },
  workoutDetailColumn: {
    flex: 0.45,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthButton: {
    padding: 4,
  },
  monthButtonText: {
    color: '#2ddbdb',
    fontSize: 16,
    fontWeight: 'bold',
  },
  calendarMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 9,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  calendarDayEmpty: {
    opacity: 0,
  },
  calendarDaySelected: {
    backgroundColor: '#2ddbdb',
    borderRadius: 8,
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: '#2ddbdb',
    borderRadius: 8,
  },
  calendarDayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  calendarDayTextSelected: {
    color: '#000',
    fontWeight: 'bold',
  },
  calendarDayTextToday: {
    color: '#2ddbdb',
    fontWeight: 'bold',
  },
  workoutDetailsSection: {
    flex: 1,
  },
  workoutHeader: {
    marginBottom: 16,
  },
  workoutDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ddbdb',
  },
  workoutDetails: {
    flex: 1,
  },
  workoutCard: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
  },
  workoutTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  workoutMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  exercisesSection: {
    marginBottom: 16,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  exerciseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    color: '#2ddbdb',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  exerciseDetails: {
    fontSize: 11,
    color: '#9ca3af',
  },
  startButton: {
    backgroundColor: '#2ddbdb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  patternDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: 'rgba(10, 14, 39, 0.98)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    zIndex: 1001,
  },
  patternDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  patternDropdownItemLast: {
    borderBottomWidth: 0,
  },
  patternDropdownItemText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  moveNotice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  moveNoticeText: {
    fontSize: 13,
    color: '#ffa500',
    fontWeight: '600',
  },
  moveCancelText: {
    fontSize: 13,
    color: '#2ddbdb',
    fontWeight: '600',
  },
  calendarDayWorkout: {
    backgroundColor: 'rgba(45, 219, 219, 0.15)',
  },
  calendarDayMoving: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderColor: '#ffa500',
    borderWidth: 2,
  },
  workoutDayBadge: {
    backgroundColor: '#2ddbdb',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 2,
  },
  workoutDayBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
  },
  loadingExercises: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
  calendarHelperContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  calendarHelperText: {
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  workoutInfoCard: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
  },
  workoutInfoDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 6,
  },
  workoutInfoName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  workoutInfoMeta: {
    fontSize: 11,
    color: '#9ca3af',
  },
  changeDateButton: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    alignItems: 'center',
  },
  changeDateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2ddbdb',
  },
  exercisesListSection: {
    flex: 1,
  },
  exercisesScroll: {
    flex: 1,
  },
  customReminder: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
  },
  customReminderText: {
    fontSize: 13,
    color: '#2ddbdb',
    fontWeight: '600',
    textAlign: 'center',
  },
  dayDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: 'rgba(10, 14, 39, 0.98)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    zIndex: 1002,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0a0e27',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(45, 219, 219, 0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2ddbdb',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#9ca3af',
    fontWeight: '300',
  },
  modalBody: {
    padding: 20,
  },
  settingItem: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  settingHelperText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    fontStyle: 'italic',
  },
  dateDisplay: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateDisplayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ddbdb',
  },
  dateButtonsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  dateButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  settingOptions: {
    gap: 10,
  },
  settingOptionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  settingOptionButtonActive: {
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    borderColor: '#2ddbdb',
  },
  settingOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  settingOptionTextActive: {
    color: '#2ddbdb',
  },
  saveSettingsButton: {
    backgroundColor: '#2ddbdb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveSettingsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  setupDescription: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  setupOptionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  setupOptionButtonActive: {
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    borderColor: '#2ddbdb',
  },
  setupOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 4,
  },
  setupOptionTextActive: {
    color: '#2ddbdb',
  },
  setupOptionDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  setupPrompt: {
    fontSize: 14,
    color: '#2ddbdb',
    textAlign: 'center',
    marginVertical: 12,
    fontWeight: '600',
  },
  splitOptionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  splitOptionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  splitOptionButtonActive: {
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    borderColor: '#2ddbdb',
  },
  splitOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  splitOptionTextActive: {
    color: '#2ddbdb',
  },
  confirmItem: {
    marginBottom: 20,
  },
  confirmLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 6,
  },
  confirmValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#2ddbdb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  notificationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  notificationCard: {
    backgroundColor: '#0a0e27',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#2ddbdb',
    width: '100%',
    maxWidth: 400,
  },
  notificationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2ddbdb',
    textAlign: 'center',
    marginBottom: 16,
  },
  notificationText: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  notificationButton: {
    backgroundColor: '#2ddbdb',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  notificationButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  lockedDateDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  lockedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  notificationBox: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    marginTop: 8,
  },
  notificationBoxText: {
    fontSize: 13,
    color: '#2ddbdb',
    lineHeight: 20,
  },
  setupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  setupCard: {
    backgroundColor: '#0a0e27',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#2ddbdb',
    width: '100%',
    maxWidth: 500,
  },
  setupPromptCard: {
    backgroundColor: '#0a0e27',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#2ddbdb',
    maxWidth: 500,
    alignSelf: 'center',
  },
  setupCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2ddbdb',
    textAlign: 'center',
    marginBottom: 12,
  },
  dateSelectionBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0a0e27',
    borderBottomWidth: 2,
    borderBottomColor: '#2ddbdb',
    padding: 20,
    paddingTop: 60,
    zIndex: 999,
  },
  dateSelectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2ddbdb',
    textAlign: 'center',
    marginBottom: 8,
  },
  dateSelectionText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  dateSelectionSelected: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ddbdb',
    textAlign: 'center',
    marginBottom: 12,
  },
  backToSplitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  backToSplitButtonText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  exercisePreviewSection: {
    marginTop: 16,
    flex: 1,
  },
  exercisePreviewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2ddbdb',
    marginBottom: 10,
  },
  exerciseListScroll: {
    maxHeight: 160,
  },
  exerciseVideoPreview: {
    gap: 6,
  },
  exerciseVideoItem: {
    backgroundColor: 'rgba(45, 219, 219, 0.05)',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.15)',
    marginBottom: 6,
  },
  exerciseVideoName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  videoPlayerSection: {
    marginTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.2)',
  },
  videoPlayerContainer: {
    marginBottom: 16,
  },
  videoPlayerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ddbdb',
    marginBottom: 12,
  },
  videoPlaceholder: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    borderWidth: 2,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    borderStyle: 'dashed',
  },
  videoPlaceholderText: {
    fontSize: 24,
    color: '#2ddbdb',
    marginBottom: 8,
  },
  videoPlaceholderSubtext: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  videoPlayerPlaceholder: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    marginBottom: 16,
  },
  videoPlaceholderHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  videoActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  startWorkoutButton: {
    backgroundColor: '#2ddbdb',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  startWorkoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  viewFullLibraryButton: {
    flex: 1,
    backgroundColor: 'rgba(45, 219, 219, 0.15)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
  },
  viewFullLibraryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2ddbdb',
  },
  dropdownButton: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    marginTop: 8,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#2ddbdb',
  },
  dropdownMenu: {
    backgroundColor: 'rgba(10, 14, 39, 0.98)',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 219, 219, 0.1)',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});
