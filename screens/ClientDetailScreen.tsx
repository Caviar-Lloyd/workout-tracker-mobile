import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase/client';
import { getNextWorkout, getLastWorkout } from '../lib/supabase/workout-service';
import ParticleBackground from '../components/ParticleBackground';
import Svg, { Path } from 'react-native-svg';
import type { WeekNumber, DayNumber } from '../types/workout';

// =====================================================
// Icon Components
// =====================================================

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke="#2ddbdb"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SaveIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
        stroke="#2ddbdb"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 21v-8H7v8M7 3v5h8"
        stroke="#2ddbdb"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EditIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke="#2ddbdb"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="#2ddbdb"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlayIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 3l14 9-14 9V3z"
        fill="#000"
        stroke="#000"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// =====================================================
// Types
// =====================================================

interface ClientData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  current_week: number;
  current_day: number;
  trainer_name: string;
  subscription_tier: string;
}

interface LastWorkoutInfo {
  week: WeekNumber;
  day: DayNumber;
  date: string;
  workoutName: string;
}

interface NextWorkoutInfo {
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

// =====================================================
// Main Component
// =====================================================

export default function ClientDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  // Get route params
  const { clientEmail, clientId } = route.params as { clientEmail: string; clientId: number };

  // State
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Workout info
  const [lastWorkout, setLastWorkout] = useState<LastWorkoutInfo | null>(null);
  const [nextWorkout, setNextWorkout] = useState<NextWorkoutInfo | null>(null);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);

  // Custom workout selector
  const [selectedWeek, setSelectedWeek] = useState<WeekNumber>(1);
  const [selectedDay, setSelectedDay] = useState<DayNumber>(1);

  // Custom workout name
  const customWorkoutName = WORKOUT_NAMES[selectedDay] || 'Unknown Workout';

  useEffect(() => {
    loadClientData();
  }, [clientEmail, clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);

      // Fetch client data from Supabase
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', clientEmail)
        .single();

      if (clientError) throw clientError;

      setClient(clientData);
      setFirstName(clientData.first_name || '');
      setLastName(clientData.last_name || '');
      setEmail(clientData.email || '');
      setPhone(clientData.phone || '');

      // Fetch workout information
      await loadWorkoutInfo(clientEmail);
    } catch (error: any) {
      console.error('Error loading client data:', error);
      Alert.alert('Error', 'Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkoutInfo = async (email: string) => {
    try {
      setLoadingWorkouts(true);

      // Fetch last workout
      const last = await getLastWorkout(email);
      setLastWorkout(last);

      // Calculate next workout
      if (last) {
        const next = getNextWorkout(last.week, last.day);
        setNextWorkout({
          week: next.week,
          day: next.day,
          workoutName: WORKOUT_NAMES[next.day] || `Day ${next.day}`,
        });
      } else {
        // Default to Week 1, Day 1 if no workouts yet
        setNextWorkout({
          week: 1,
          day: 1,
          workoutName: WORKOUT_NAMES[1],
        });
      }
    } catch (error: any) {
      console.error('Error loading workout info:', error);
    } finally {
      setLoadingWorkouts(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate fields
      if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        Alert.alert('Error', 'First name, last name, and email are required');
        return;
      }

      // Update client in Supabase
      const { error } = await supabase
        .from('clients')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
        })
        .eq('id', client?.id);

      if (error) throw error;

      // Reload client data
      await loadClientData();
      setIsEditing(false);
      Alert.alert('Success', 'Client information updated successfully');
    } catch (error: any) {
      console.error('Error saving client data:', error);
      Alert.alert('Error', 'Failed to save client information');
    } finally {
      setSaving(false);
    }
  };

  const handleStartWorkout = () => {
    if (nextWorkout && client) {
      // @ts-ignore
      navigation.navigate('Workout', {
        week: nextWorkout.week,
        day: nextWorkout.day,
        clientEmail: client.email,
        clientName: `${client.first_name} ${client.last_name}`,
      });
    }
  };

  const handleStartCustomWorkout = () => {
    if (client) {
      // @ts-ignore
      navigation.navigate('Workout', {
        week: selectedWeek,
        day: selectedDay,
        clientEmail: client.email,
        clientName: `${client.first_name} ${client.last_name}`,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a0e27', '#1a1f3a', '#2a1f3a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
        <View style={styles.darkOverlay} />
        <ParticleBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2ddbdb" />
          <Text style={styles.loadingText}>Loading client details...</Text>
        </View>
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a0e27', '#1a1f3a', '#2a1f3a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
        <View style={styles.darkOverlay} />
        <ParticleBackground />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Client not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0e27', '#1a1f3a', '#2a1f3a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <View style={styles.darkOverlay} />
      <ParticleBackground />

      <View style={styles.contentWrapper}>
        <View
          style={[
            styles.content,
            {
              paddingTop: Math.max(insets.top, 20) + 10,
              paddingBottom: Math.max(insets.bottom, 20) + 20,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackIcon />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Client Details</Text>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#2ddbdb" />
            ) : isEditing ? (
              <SaveIcon />
            ) : (
              <EditIcon />
            )}
          </TouchableOpacity>
        </View>

        {/* Breadcrumb Navigation */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>
            <Text style={styles.breadcrumbHome} onPress={() => navigation.navigate('Dashboard')}>Home</Text>
            <Text style={styles.breadcrumbSeparator}> / </Text>
            <Text style={styles.breadcrumbLink} onPress={() => navigation.navigate('Clients')}>My Clients</Text>
            <Text style={styles.breadcrumbSeparator}> / </Text>
            <Text style={styles.breadcrumbCurrent}>{client.first_name} {client.last_name}</Text>
          </Text>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Client Avatar & Name */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {client.first_name.charAt(0).toUpperCase()}
                {client.last_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.clientNameLarge}>
              {client.first_name} {client.last_name}
            </Text>
          </View>

          {/* Profile Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>First Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First Name"
                    placeholderTextColor="#6b7280"
                  />
                ) : (
                  <Text style={styles.infoValue}>{client.first_name}</Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last Name"
                    placeholderTextColor="#6b7280"
                  />
                ) : (
                  <Text style={styles.infoValue}>{client.last_name}</Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor="#6b7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text style={styles.infoValue}>{client.email}</Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Phone Number"
                    placeholderTextColor="#6b7280"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.infoValue}>
                    {client.phone || 'Not provided'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Workout Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Progress</Text>

            {loadingWorkouts ? (
              <View style={styles.workoutLoadingContainer}>
                <ActivityIndicator size="small" color="#2ddbdb" />
                <Text style={styles.workoutLoadingText}>Loading workouts...</Text>
              </View>
            ) : (
              <>
                {/* Last Completed Workout */}
                <View style={styles.workoutCard}>
                  <View style={styles.workoutCardHeader}>
                    <Text style={styles.workoutCardLabel}>Last Completed</Text>
                  </View>
                  {lastWorkout ? (
                    <>
                      <Text style={styles.workoutCardTitle}>
                        {lastWorkout.workoutName}
                      </Text>
                      <Text style={styles.workoutCardMeta}>
                        Week {lastWorkout.week} • Day {lastWorkout.day}
                      </Text>
                      <Text style={styles.workoutCardDate}>
                        {new Date(lastWorkout.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.workoutCardEmpty}>
                      No workouts completed yet
                    </Text>
                  )}
                </View>

                {/* Next Scheduled Workout */}
                <View style={[styles.workoutCard, styles.nextWorkoutCard]}>
                  <View style={styles.workoutCardHeader}>
                    <Text style={styles.workoutCardLabel}>Next Workout</Text>
                  </View>
                  {nextWorkout ? (
                    <>
                      <Text style={styles.workoutCardTitle}>
                        {nextWorkout.workoutName}
                      </Text>
                      <Text style={styles.workoutCardMeta}>
                        Week {nextWorkout.week} • Day {nextWorkout.day}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.workoutCardEmpty}>
                      No workout scheduled
                    </Text>
                  )}
                </View>

                {/* Custom Workout Selector */}
                <View style={styles.customWorkoutSection}>
                  <View style={styles.customWorkoutHeader}>
                    <Text style={styles.customWorkoutTitle}>Choose Custom Workout</Text>
                    <Text style={styles.customWorkoutSubtitle}>Select a different workout to train</Text>
                  </View>

                  {/* Week Selector */}
                  <View style={styles.selectorContainer}>
                    <Text style={styles.selectorLabel}>Week</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.selectorScroll}
                      contentContainerStyle={styles.selectorContent}
                    >
                      {Array.from({ length: 6 }, (_, i) => i + 1).map((week) => (
                        <TouchableOpacity
                          key={week}
                          style={[
                            styles.selectorButton,
                            selectedWeek === week && styles.selectorButtonSelected,
                          ]}
                          onPress={() => setSelectedWeek(week as WeekNumber)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.selectorButtonText,
                              selectedWeek === week && styles.selectorButtonTextSelected,
                            ]}
                          >
                            {week}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Day Selector */}
                  <View style={styles.selectorContainer}>
                    <Text style={styles.selectorLabel}>Day</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.selectorScroll}
                      contentContainerStyle={styles.selectorContent}
                    >
                      {Array.from({ length: 6 }, (_, i) => i + 1).map((day) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.selectorButton,
                            selectedDay === day && styles.selectorButtonSelected,
                          ]}
                          onPress={() => setSelectedDay(day as DayNumber)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.selectorButtonText,
                              selectedDay === day && styles.selectorButtonTextSelected,
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Selected Workout Preview */}
                  <View style={styles.workoutPreview}>
                    <Text style={styles.workoutPreviewLabel}>Selected Workout</Text>
                    <Text style={styles.workoutPreviewName}>{customWorkoutName}</Text>
                    <Text style={styles.workoutPreviewMeta}>
                      Week {selectedWeek} • Day {selectedDay}
                    </Text>
                  </View>

                  {/* Start Custom Workout Button */}
                  <TouchableOpacity
                    style={styles.startCustomWorkoutButton}
                    onPress={handleStartCustomWorkout}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#2ddbdb', '#1fb8b8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.startWorkoutGradient}
                    >
                      <PlayIcon />
                      <Text style={styles.startWorkoutText}>
                        Start Custom Workout
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Start Workout Button */}
                {nextWorkout && (
                  <TouchableOpacity
                    style={styles.startWorkoutButton}
                    onPress={handleStartWorkout}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#2ddbdb', '#1fb8b8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.startWorkoutGradient}
                    >
                      <PlayIcon />
                      <Text style={styles.startWorkoutText}>
                        Start Next Workout
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </ScrollView>
        </View>
      </View>
    </View>
  );
}

// =====================================================
// Styles
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
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
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 768 : undefined,
    alignSelf: 'center',
    zIndex: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    borderWidth: 3,
    borderColor: '#2ddbdb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2ddbdb',
  },
  clientNameLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ddbdb',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoRow: {
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  workoutLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  workoutLoadingText: {
    color: '#9ca3af',
    marginTop: 12,
    fontSize: 14,
  },
  workoutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  nextWorkoutCard: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderColor: 'rgba(45, 219, 219, 0.3)',
  },
  workoutCardHeader: {
    marginBottom: 12,
  },
  workoutCardLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  workoutCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  workoutCardMeta: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  workoutCardDate: {
    fontSize: 13,
    color: '#2ddbdb',
    fontWeight: '500',
  },
  workoutCardEmpty: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  customWorkoutSection: {
    backgroundColor: 'rgba(45, 219, 219, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.2)',
    marginBottom: 24,
  },
  customWorkoutHeader: {
    marginBottom: 20,
  },
  customWorkoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ddbdb',
    marginBottom: 4,
  },
  customWorkoutSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
  },
  selectorContainer: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectorScroll: {
    flexGrow: 0,
  },
  selectorContent: {
    gap: 10,
  },
  selectorButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2ddbdb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorButtonSelected: {
    backgroundColor: '#2ddbdb',
  },
  selectorButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ddbdb',
  },
  selectorButtonTextSelected: {
    color: '#000',
  },
  workoutPreview: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
  },
  workoutPreviewLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  workoutPreviewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  workoutPreviewMeta: {
    fontSize: 13,
    color: '#9ca3af',
  },
  startCustomWorkoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startWorkoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  startWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  startWorkoutText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  // Breadcrumb Navigation - Top Right
  breadcrumb: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingTop: 8,
    paddingRight: 20,
    zIndex: 10,
  },
  breadcrumbText: {
    fontSize: 12,
  },
  breadcrumbHome: {
    color: '#2ddbdb',
    fontWeight: '600',
  },
  breadcrumbLink: {
    color: '#2ddbdb',
    fontWeight: '600',
  },
  breadcrumbSeparator: {
    color: '#6b7280',
  },
  breadcrumbCurrent: {
    color: '#9ca3af',
    fontWeight: '400',
  },
});
