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
  subscription_tier: string;
  coach_email?: string;
  coach_name?: string;
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

// Search Icon Component
const SearchIcon = ({ size = 24, color = '#2ddbdb' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Remove Icon Component
const RemoveIcon = ({ size = 24, color = '#ef4444' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 18L18 6M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function ClientsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [clients, setClients] = useState<ClientWithWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('🔍 Current user email:', user.email);
      setCurrentUserEmail(user.email || '');

      // Get coach's profile
      const { data: coachProfile } = await supabase
        .from('clients')
        .select('first_name, last_name')
        .eq('email', user.email)
        .single();

      const coachName = coachProfile
        ? `${coachProfile.first_name} ${coachProfile.last_name}`
        : '';

      console.log('👤 Coach name:', coachName);
      setCurrentUserName(coachName);

      // Get all clients assigned to this coach
      console.log('🔍 Searching for clients with coach_email =', user.email?.toLowerCase());
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('coach_email', user.email?.toLowerCase())
        .eq('subscription_tier', 'client')
        .order('first_name', { ascending: true });

      console.log('📊 Query results:', { data, error, count: data?.length });

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

  const searchUnassignedClients = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const searchTerm = query.toLowerCase().trim();

      // Search for clients with no coach assignment
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('subscription_tier', 'client')
        .is('coach_email', null)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('first_name', { ascending: true })
        .limit(20);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error: any) {
      console.error('Error searching clients:', error.message);
      Alert.alert('Error', 'Failed to search clients');
    } finally {
      setSearching(false);
    }
  };

  const handleAddClient = async (client: Client) => {
    try {
      // Assign coach to client
      const { error } = await supabase
        .from('clients')
        .update({
          coach_email: currentUserEmail,
          coach_name: currentUserName,
        })
        .eq('email', client.email);

      if (error) throw error;

      Alert.alert('Success', `${client.first_name} ${client.last_name} has been added to your clients`);
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults([]);
      loadClients(); // Reload the client list
    } catch (error: any) {
      console.error('Error adding client:', error);
      Alert.alert('Error', 'Failed to add client');
    }
  };

  const handleRemoveClient = async (client: ClientWithWorkout) => {
    Alert.alert(
      'Remove Client',
      `Are you sure you want to remove ${client.first_name} ${client.last_name} from your clients?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Unassign coach from client
              const { error } = await supabase
                .from('clients')
                .update({
                  coach_email: null,
                  coach_name: null,
                })
                .eq('email', client.email);

              if (error) throw error;

              Alert.alert('Success', `${client.first_name} ${client.last_name} has been removed from your clients`);
              loadClients(); // Reload the client list
            } catch (error: any) {
              console.error('Error removing client:', error);
              Alert.alert('Error', 'Failed to remove client');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery) {
        searchUnassignedClients(searchQuery);
      }
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

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
              onPress={() => setShowSearchModal(true)}
            >
              <SearchIcon size={24} color="#2ddbdb" />
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
              <Text style={styles.emptyText}>No clients assigned yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the search icon above to find and add clients
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
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveClient(client);
                      }}
                    >
                      <RemoveIcon size={20} color="#ef4444" />
                    </TouchableOpacity>
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

      {/* Search & Add Client Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowSearchModal(false);
          setSearchQuery('');
          setSearchResults([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Search Unassigned Clients</Text>

            <TextInput
              style={styles.input}
              placeholder="Search by name or email..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoFocus
            />

            {searching && (
              <View style={styles.searchingContainer}>
                <ActivityIndicator size="small" color="#2ddbdb" />
                <Text style={styles.searchingText}>Searching...</Text>
              </View>
            )}

            <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
              {searchQuery && !searching && searchResults.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No unassigned clients found</Text>
                </View>
              )}

              {searchResults.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={styles.searchResultCard}
                  onPress={() => handleAddClient(client)}
                >
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>
                      {client.first_name} {client.last_name}
                    </Text>
                    <Text style={styles.searchResultEmail}>{client.email}</Text>
                  </View>
                  <View style={styles.addIcon}>
                    <PlusIcon size={20} color="#2ddbdb" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowSearchModal(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
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
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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
    maxWidth: 500,
    maxHeight: '80%',
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
    marginBottom: 20,
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
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  searchingText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  searchResults: {
    flex: 1,
    marginBottom: 16,
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(45, 219, 219, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.2)',
    borderRadius: 12,
    marginBottom: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  searchResultEmail: {
    fontSize: 14,
    color: '#9ca3af',
  },
  addIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(45, 219, 219, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
