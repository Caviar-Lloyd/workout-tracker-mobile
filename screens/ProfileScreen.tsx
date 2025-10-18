import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase/client';
import { getNextWorkout, getLastWorkout } from '../lib/supabase/workout-service';
import ParticleBackground from '../components/ParticleBackground';
import Svg, { Path } from 'react-native-svg';
import UniversalHeader from '../components/UniversalHeader';
import type { WeekNumber, DayNumber } from '../types/workout';

// =====================================================
// Icon Components
// =====================================================

function CameraIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 17a4 4 0 100-8 4 4 0 000 8z"
        stroke="#fff"
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
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
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

const WORKOUT_NAMES: Record<number, string> = {
  1: 'Chest, Triceps, Abs - Multi-Joint',
  2: 'Shoulders, Legs, Calves - Multi-Joint',
  3: 'Back, Traps, Biceps - Multi-Joint',
  4: 'Chest, Triceps, Abs - Isolation',
  5: 'Shoulders, Legs, Calves - Isolation',
  6: 'Back, Traps, Biceps - Isolation',
};

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

interface ProfileData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  profile_picture_url: string | null;
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // State
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Workout info
  const [lastWorkout, setLastWorkout] = useState<LastWorkoutInfo | null>(null);
  const [nextWorkout, setNextWorkout] = useState<NextWorkoutInfo | null>(null);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Fetch profile data from Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);
      setFirstName(profileData.first_name || '');
      setLastName(profileData.last_name || '');
      setEmail(profileData.email || '');
      setPhone(profileData.phone || '');
      setProfilePictureUrl(profileData.profile_picture_url || null);

      // Fetch workout information
      await loadWorkoutInfo(user.email!);
    } catch (error: any) {
      console.error('Error loading profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
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

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload a profile picture.');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePicture = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera permissions to take a profile picture.');
        return;
      }

      // Take picture
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploadingImage(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Read file using fetch (works in React Native)
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Generate unique filename
      const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
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

      // Update profile in database
      const { error: updateError } = await supabase
        .from('clients')
        .update({ profile_picture_url: publicUrl })
        .eq('email', user.email);

      if (updateError) throw updateError;

      setProfilePictureUrl(publicUrl);
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePicture,
        },
        {
          text: 'Choose from Library',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate fields
      if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        Alert.alert('Error', 'First name, last name, and email are required');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update profile in Supabase
      const { error } = await supabase
        .from('clients')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
        })
        .eq('id', profile?.id);

      if (error) throw error;

      // Reload profile data
      await loadProfileData();
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleStartWorkout = () => {
    if (nextWorkout && profile) {
      // @ts-ignore
      navigation.navigate('Workout', {
        week: nextWorkout.week,
        day: nextWorkout.day,
        clientEmail: profile.email,
        clientName: `${profile.first_name} ${profile.last_name}`,
      });
    }
  };

  const handleReviewLastWorkout = () => {
    if (lastWorkout && profile) {
      // @ts-ignore
      navigation.navigate('Progress', {
        selectedWorkout: {
          week: lastWorkout.week,
          day: lastWorkout.day,
          date: lastWorkout.date,
        },
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
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!profile) {
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
          <Text style={styles.errorText}>Profile not found</Text>
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
          <View style={styles.header}>
            <UniversalHeader title="My Profile" />
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

          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Picture Section */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={showImageOptions}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <View style={styles.avatar}>
                    <ActivityIndicator size="large" color="#2ddbdb" />
                  </View>
                ) : profilePictureUrl ? (
                  <Image
                    source={{ uri: profilePictureUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {profile.first_name.charAt(0).toUpperCase()}
                      {profile.last_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraIconContainer}>
                  <CameraIcon />
                </View>
              </TouchableOpacity>
              <Text style={styles.clientNameLarge}>
                {profile.first_name} {profile.last_name}
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
                      <Text style={styles.infoValue}>{profile.first_name}</Text>
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
                      <Text style={styles.infoValue}>{profile.last_name}</Text>
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
                        {profile.phone || 'Not provided'}
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
                        {profile.email}
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
                        {/* Review Button */}
                        <TouchableOpacity
                          style={styles.reviewButtonSmall}
                          onPress={handleReviewLastWorkout}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.reviewButtonTextSmall}>Review</Text>
                        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 28,
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    borderWidth: 3,
    borderColor: '#2ddbdb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#2ddbdb',
  },
  avatarText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2ddbdb',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2ddbdb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0a0e27',
  },
  clientNameLarge: {
    fontSize: 24,
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
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  columnItem: {
    flex: 1,
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
    marginVertical: 16,
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
  workoutCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  workoutCardSmall: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 160,
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
    marginBottom: 8,
  },
  workoutCardEmptySmall: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  reviewButtonSmall: {
    backgroundColor: 'rgba(147, 51, 234, 0.8)',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  reviewButtonTextSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
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
});
