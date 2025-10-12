import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform, Modal, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase/client';
import { getNextWorkout } from '../lib/supabase/workout-service';
import ParticleBackground from '../components/ParticleBackground';
import Svg, { Path } from 'react-native-svg';
import type { WeekNumber, DayNumber } from '../types/workout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  current_week: number;
  current_day: number;
  trainer_name: string;
  subscription_tier: string;
}

interface ClientWithWorkout extends Client {
  nextWorkout?: {
    week: WeekNumber;
    day: DayNumber;
    workoutName: string;
  };
}

const WORKOUT_NAMES: Record<number, string> = {
  1: 'Chest, Triceps, Abs - Multi-Joint',
  2: 'Shoulders, Legs, Calves - Multi-Joint',
  3: 'Back, Traps, Biceps - Multi-Joint',
  4: 'Chest, Triceps, Abs - Isolation',
  5: 'Shoulders, Legs, Calves - Isolation',
  6: 'Back, Traps, Biceps - Isolation',
};

// Plus Icon Component
const PlusIcon = ({ size = 24, color = '#2ddbdb' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function ClientsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [clients, setClients] = useState<ClientWithWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);

      // Get current user to filter by trainer
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get trainer's profile
      const { data: trainerProfile } = await supabase
        .from('clients')
        .select('first_name, last_name')
        .eq('email', user.email)
        .single();

      const trainerName = trainerProfile
        ? `${trainerProfile.first_name} ${trainerProfile.last_name}`.toLowerCase()
        : '';

      // Get all clients for this trainer
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('trainer_name', trainerName)
        .order('first_name', { ascending: true });

      if (error) throw error;

      // Get next workout for each client
      const clientsWithWorkouts = await Promise.all(
        (data || []).map(async (client) => {
          try {
            const nextWorkout = await getNextWorkout(client.email);
            return {
              ...client,
              nextWorkout,
            };
          } catch (error) {
            return client;
          }
        })
      );

      setClients(clientsWithWorkouts);
    } catch (error: any) {
      console.error('Error loading clients:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClientPress = async (client: ClientWithWorkout) => {
    // Navigate to client detail screen to view/edit profile and start workouts
    // @ts-ignore
    navigation.navigate("ClientDetail", {
      clientEmail: client.email,
      clientId: client.id,
    });
  };

  const handleAddClient = async () => {
    // Validate inputs
    if (!newClient.first_name.trim() || !newClient.last_name.trim() || !newClient.email.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newClient.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      // Get current user to set as trainer
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to add clients');
        return;
      }

      // Get trainer profile
      const { data: trainerProfile } = await supabase
        .from('clients')
        .select('first_name, last_name')
        .eq('email', user.email)
        .single();

      const trainerName = trainerProfile
        ? `${trainerProfile.first_name} ${trainerProfile.last_name}`
        : 'Unknown Trainer';

      // Insert new client
      const { data, error } = await supabase
        .from('clients')
        .insert([
          {
            first_name: newClient.first_name.trim(),
            last_name: newClient.last_name.trim(),
            email: newClient.email.trim().toLowerCase(),
            trainer_name: trainerName,
            current_week: 1,
            current_day: 1,
            subscription_tier: 'client',
          },
        ])
        .select();

      if (error) {
        console.error('Error adding client:', error);
        Alert.alert('Error', error.message || 'Failed to add client');
        return;
      }

      // Success!
      Alert.alert('Success', 'Client added successfully!');
      setShowAddModal(false);
      setNewClient({ first_name: '', last_name: '', email: '' });
      loadClients(); // Reload the client list
    } catch (error: any) {
      console.error('Error adding client:', error);
      Alert.alert('Error', 'An unexpected error occurred');
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
          <Text style={styles.loadingText}>Loading clients...</Text>
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
        <View style={[styles.content, {
          paddingTop: Math.max(insets.top, 20) + 10,
          paddingBottom: Math.max(insets.bottom, 20) + 80,
        }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>My Clients</Text>
              <Text style={styles.subtitle}>{clients.length} active clients</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <PlusIcon size={24} color="#2ddbdb" />
            </TouchableOpacity>
          </View>

          {/* Breadcrumb Navigation */}
          <View style={styles.breadcrumb}>
            <Text style={styles.breadcrumbText}>
              <Text style={styles.breadcrumbHome} onPress={() => navigation.navigate('Dashboard')}>Home</Text>
              <Text style={styles.breadcrumbSeparator}> / </Text>
              <Text style={styles.breadcrumbCurrent}>My Clients</Text>
            </Text>
          </View>

        {/* Clients Scroll List */}
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {clients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No clients yet</Text>
              <Text style={styles.emptySubtext}>
                Clients will appear here once they are assigned to you
              </Text>
            </View>
          ) : (
            clients.map((client) => (
              <TouchableOpacity
                key={client.id}
                style={styles.clientCard}
                onPress={() => handleClientPress(client)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(45, 219, 219, 0.15)', 'rgba(45, 219, 219, 0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  <View style={styles.clientHeader}>
                    <View style={styles.clientInitial}>
                      <Text style={styles.initialText}>
                        {client.first_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>
                        {client.first_name} {client.last_name}
                      </Text>
                      <Text style={styles.clientEmail}>{client.email}</Text>
                    </View>
                  </View>

                  {client.nextWorkout && (
                    <View style={styles.workoutInfo}>
                      <View style={styles.workoutBadge}>
                        <Text style={styles.workoutBadgeText}>NEXT WORKOUT</Text>
                      </View>
                      <Text style={styles.workoutName}>
                        {client.nextWorkout.workoutName}
                      </Text>
                      <Text style={styles.workoutDetails}>
                        Week {client.nextWorkout.week} • Day {client.nextWorkout.day}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.tapText}>Tap to start workout →</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        </View>
      </View>

      {/* Add Client Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Client</Text>

            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#666"
              value={newClient.first_name}
              onChangeText={(text) => setNewClient({ ...newClient, first_name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="#666"
              value={newClient.last_name}
              onChangeText={(text) => setNewClient({ ...newClient, last_name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={newClient.email}
              onChangeText={(text) => setNewClient({ ...newClient, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewClient({ first_name: '', last_name: '', email: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addButtonModal]}
                onPress={handleAddClient}
              >
                <Text style={styles.addButtonText}>Add Client</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(45, 219, 219, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  clientCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    borderRadius: 20,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientInitial: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#2ddbdb',
  },
  initialText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2ddbdb',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 14,
    color: '#9ca3af',
  },
  workoutInfo: {
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(45, 219, 219, 0.2)',
  },
  workoutBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  workoutBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2ddbdb',
    letterSpacing: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  workoutDetails: {
    fontSize: 14,
    color: '#9ca3af',
  },
  cardFooter: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  tapText: {
    fontSize: 12,
    color: '#2ddbdb',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1a1f3a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(45, 219, 219, 0.3)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonModal: {
    backgroundColor: '#2ddbdb',
  },
  addButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
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
  breadcrumbSeparator: {
    color: '#6b7280',
  },
  breadcrumbCurrent: {
    color: '#9ca3af',
    fontWeight: '400',
  },
});
