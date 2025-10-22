import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, Modal, Image } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase/client';
import { getNextWorkout, getLastWorkout } from '../lib/supabase/workout-service';
import * as NavigationBar from 'expo-navigation-bar';

import Svg, { Path, Circle } from 'react-native-svg';
import UniversalHeader from '../components/UniversalHeader';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import type { WeekNumber, DayNumber } from '../types/workout';
import CustomWorkoutBuilderScreen from './CustomWorkoutBuilderScreen';
import DNALoader from '../components/DNALoader';

// =====================================================
// Icon Components
// =====================================================



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

function CameraIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
        fill="#2ddbdb"
        stroke="#2ddbdb"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 17a4 4 0 100-8 4 4 0 000 8z"
        fill="#0a0e27"
        stroke="#0a0e27"
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
  profile_picture_url?: string | null;
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

  // Profile picture
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Workout info
  const [lastWorkout, setLastWorkout] = useState<LastWorkoutInfo | null>(null);
  const [nextWorkout, setNextWorkout] = useState<NextWorkoutInfo | null>(null);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);

  // Custom workout selector
  const [selectedWeek, setSelectedWeek] = useState<WeekNumber>(1);
  const [selectedDay, setSelectedDay] = useState<DayNumber>(1);

  // Dropdown modals
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);
  const [showDayDropdown, setShowDayDropdown] = useState(false);

  // Custom workout name
  const customWorkoutName = WORKOUT_NAMES[selectedDay] || 'Unknown Workout';

  // Custom workout builder state
  const [coachEmail, setCoachEmail] = useState('');

  useEffect(() => {
    loadClientData();
    loadCoachEmail();
  }, [clientEmail, clientId]);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadClientData();
    }, [clientEmail])
  );

  // Hide navigation bar when screen is focused (Android)
  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === 'android') {
        NavigationBar.setVisibilityAsync('hidden');
        NavigationBar.setBehaviorAsync('overlay-swipe');
      }

      return () => {
        // Cleanup if needed when screen loses focus
      };
    }, [])
  );

  const loadCoachEmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCoachEmail(user.email);
      }
    } catch (error) {
      console.error('Error loading coach email:', error);
    }
  };

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
      setProfilePictureUrl(clientData.profile_picture_url || null);

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

  const showImageOptions = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePicture },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const photoUri = result.assets[0].uri;

      // Save to camera roll
      try {
        const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
        if (mediaStatus === 'granted') {
          await MediaLibrary.saveToLibraryAsync(photoUri);
          console.log('Photo saved to camera roll');
        }
      } catch (error) {
        console.error('Error saving to camera roll:', error);
        // Don't block upload if save fails
      }

      await uploadImage(photoUri);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!client) return;

    try {
      setUploadingImage(true);

      // Read file using fetch (works in React Native)
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Generate unique filename based on client ID
      const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const fileName = `${client.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, bytes, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update client profile in database
      const { error: updateError } = await supabase
        .from('clients')
        .update({ profile_picture_url: publicUrl })
        .eq('id', client.id);

      if (updateError) throw updateError;

      setProfilePictureUrl(publicUrl);
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error: any) {
      console.error('Full error details:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      Alert.alert(
        'Upload Failed',
        `${errorMessage}\n\nMake sure the "avatars" bucket exists in Supabase Storage and is set to public with proper RLS policies.`
      );
    } finally {
      setUploadingImage(false);
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
        <View style={styles.loadingContainer}>
          <DNALoader />
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
        pointerEvents="none"
      />
      <View style={styles.darkOverlay} pointerEvents="none" />

      {/* Solid Footer Background - Prevents content overlap with menu */}
      <View
        style={[
          styles.footerBackground,
          {
            height: Math.max(insets.bottom, 20) + 60,
            bottom: 0
          }
        ]}
        pointerEvents="box-none"
      />

      <View style={styles.contentWrapper}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={{
            paddingTop: 100,
            paddingBottom: Math.max(insets.bottom, 20) + 120,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          {/* Client Avatar & Name */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={showImageOptions}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <DNALoader />
              ) : profilePictureUrl ? (
                <Image source={{ uri: profilePictureUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {client.first_name.charAt(0).toUpperCase()}
                    {client.last_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.cameraIconContainer}>
                <CameraIcon />
              </View>
            </TouchableOpacity>
            <Text style={styles.clientNameLarge}>
              {client.first_name} {client.last_name}
            </Text>
          </View>

          {/* Profile Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>

            <View style={styles.infoCard}>
              {/* Row 1: First Name & Last Name */}
              <View style={styles.twoColumnRow}>
                <View style={styles.columnItem}>
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

                <View style={styles.columnItem}>
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
              </View>

              <View style={styles.divider} />

              {/* Row 2: Phone & Email */}
              <View style={styles.twoColumnRow}>
                <View style={styles.columnItem}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Phone"
                      placeholderTextColor="#6b7280"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text style={styles.infoValue}>
                      {client.phone || 'Not provided'}
                    </Text>
                  )}
                </View>

                <View style={styles.columnItem}>
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
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {client.email}
                    </Text>
                  )}
                </View>
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
                {/* Workout Progress Cards - 2 Column Layout */}
                <View style={styles.workoutCardsRow}>
                  {/* Last Completed Workout */}
                  <View style={styles.workoutCardSmall}>
                    <Text style={styles.workoutCardLabelSmall}>COMPLETED</Text>
                    {lastWorkout ? (
                      <>
                        <Text style={styles.workoutCardTitleSmall} numberOfLines={2}>
                          {lastWorkout.workoutName}
                        </Text>
                        <Text style={styles.workoutCardMetaSmall}>
                          Week {lastWorkout.week} • Day {lastWorkout.day}
                        </Text>
                        <Text style={styles.workoutCardDateSmall}>
                          {new Date(lastWorkout.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.workoutCardEmptySmall}>
                        No workouts yet
                      </Text>
                    )}
                  </View>

                  {/* Next Scheduled Workout */}
                  <View style={[styles.workoutCardSmall, styles.nextWorkoutCardSmall]}>
                    <Text style={styles.workoutCardLabelSmall}>NEXT WORKOUT</Text>
                    {nextWorkout ? (
                      <>
                        <Text style={styles.workoutCardTitleSmall} numberOfLines={2}>
                          {nextWorkout.workoutName}
                        </Text>
                        <Text style={styles.workoutCardMetaSmall}>
                          Week {nextWorkout.week} • Day {nextWorkout.day}
                        </Text>
                        {/* Start Workout Button */}
                        <TouchableOpacity
                          style={styles.startWorkoutButtonSmall}
                          onPress={handleStartWorkout}
                          activeOpacity={0.8}
                        >
                          <PlayIcon />
                          <Text style={styles.startWorkoutButtonTextSmall}>Start</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <Text style={styles.workoutCardEmptySmall}>
                        No workout scheduled
                      </Text>
                    )}
                  </View>
                </View>

                {/* Custom Workout Selector */}
                <View style={styles.customWorkoutSection}>
                  <Text style={styles.customWorkoutTitle}>Choose Custom Workout</Text>

                  {/* Dropdowns Row */}
                  <View style={styles.dropdownsRow}>
                    {/* Week Dropdown */}
                    <View style={styles.dropdownContainer}>
                      <Text style={styles.dropdownLabel}>Week</Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setShowWeekDropdown(true)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownButtonText}>Week {selectedWeek}</Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Day Dropdown */}
                    <View style={styles.dropdownContainer}>
                      <Text style={styles.dropdownLabel}>Day</Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setShowDayDropdown(true)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownButtonText}>Day {selectedDay}</Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Workout Preview */}
                  <Text style={styles.workoutPreviewNameCompact} numberOfLines={2}>
                    {customWorkoutName}
                  </Text>

                  {/* Action Buttons Row */}
                  <View style={styles.actionButtonsRow}>
                    {/* Start Workout Button */}
                    <TouchableOpacity
                      style={styles.startWorkoutButtonCompact}
                      onPress={handleStartCustomWorkout}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#2ddbdb', '#1fb8b8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.compactButtonGradient}
                      >
                        <PlayIcon />
                        <Text style={styles.compactButtonText}>Start Workout</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Create Custom Workout Button */}
                    <TouchableOpacity
                      style={styles.createCustomButtonCompact}
                      onPress={() => navigation.navigate('CustomWorkoutBuilder', {
                        clientEmail: client?.email,
                        coachEmail: coachEmail,
                        clientName: `${client?.first_name} ${client?.last_name}`,
                        clientPhotoUrl: client?.profile_photo_url,
                      })}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#9333ea', '#7e22ce']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.compactButtonGradient}
                      >
                        <Text style={styles.compactButtonText}>+ Create</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>

        {/* Fixed Header */}
        <View style={styles.fixedHeader} pointerEvents="box-none">
          <UniversalHeader title="Client Profile" />
        </View>
      </View>

      <Modal
        visible={showWeekDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWeekDropdown(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowWeekDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownModalTitle}>Select Week</Text>
            {Array.from({ length: 6 }, (_, i) => i + 1).map((week) => (
              <TouchableOpacity
                key={week}
                style={[
                  styles.dropdownOption,
                  selectedWeek === week && styles.dropdownOptionSelected,
                ]}
                onPress={() => {
                  setSelectedWeek(week as WeekNumber);
                  setShowWeekDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    selectedWeek === week && styles.dropdownOptionTextSelected,
                  ]}
                >
                  Week {week}
                </Text>
                {selectedWeek === week && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Day Dropdown Modal */}
      <Modal
        visible={showDayDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDayDropdown(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowDayDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownModalTitle}>Select Day</Text>
            {Array.from({ length: 6 }, (_, i) => i + 1).map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dropdownOption,
                  selectedDay === day && styles.dropdownOptionSelected,
                ]}
                onPress={() => {
                  setSelectedDay(day as DayNumber);
                  setShowDayDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    selectedDay === day && styles.dropdownOptionTextSelected,
                  ]}
                >
                  Day {day} - {WORKOUT_NAMES[day]}
                </Text>
                {selectedDay === day && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  footerBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0e27',
    zIndex: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(45, 219, 219, 0.2)',
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
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
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
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#2ddbdb',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2ddbdb',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0a0e27',
    borderWidth: 2,
    borderColor: '#2ddbdb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2ddbdb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
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
  createCustomWorkoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  createCustomWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  createCustomWorkoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Two-column layout styles
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  columnItem: {
    flex: 1,
  },
  // Compact workout cards
  workoutCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  workoutCardSmall: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 140,
  },
  nextWorkoutCardSmall: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderColor: 'rgba(45, 219, 219, 0.3)',
  },
  workoutCardLabelSmall: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  workoutCardTitleSmall: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 16,
  },
  workoutCardMetaSmall: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 6,
  },
  workoutCardDateSmall: {
    fontSize: 10,
    color: '#2ddbdb',
    fontWeight: '500',
  },
  workoutCardEmptySmall: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  startWorkoutButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2ddbdb',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  startWorkoutButtonTextSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  // Dropdown styles
  dropdownsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dropdownContainer: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    borderRadius: 10,
    padding: 12,
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#2ddbdb',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModal: {
    backgroundColor: '#1a1f3a',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ddbdb',
    marginBottom: 16,
    textAlign: 'center',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.5)',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  dropdownOptionTextSelected: {
    fontWeight: 'bold',
    color: '#2ddbdb',
  },
  checkmark: {
    fontSize: 16,
    color: '#2ddbdb',
    fontWeight: 'bold',
  },
  // Compact workout preview
  workoutPreviewNameCompact: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    lineHeight: 18,
  },
  // Action buttons row
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  startWorkoutButtonCompact: {
    flex: 1.2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  createCustomButtonCompact: {
    flex: 0.8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  compactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 6,
  },
  compactButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#0a0e27',
  },
});
