import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase/client';
import { Search as SearchIcon, X as CloseIcon, ArrowRight } from 'lucide-react-native';

interface Exercise {
  id: number;
  exercise_name: string;
  category?: string;
  equipment?: string;
  primary_muscles?: string[];
  difficulty_level?: string;
  start_image_url?: string;
  keywords?: string[];
}

interface ExerciseSwapModalProps {
  visible: boolean;
  currentExerciseName: string;
  currentExerciseIndex: number;
  onClose: () => void;
  onSwap: (newExerciseName: string, exerciseIndex: number) => void;
}

export default function ExerciseSwapModal({
  visible,
  currentExerciseName,
  currentExerciseIndex,
  onClose,
  onSwap,
}: ExerciseSwapModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Exercise[]>([]);
  const [alternatives, setAlternatives] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'alternatives'>('alternatives');

  // Load alternatives when modal opens
  useEffect(() => {
    if (visible) {
      loadAlternatives();
    }
  }, [visible, currentExerciseName]);

  // Debounced search
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchExercises(searchQuery);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const loadAlternatives = async () => {
    try {
      setLoading(true);

      // Find the current exercise
      const { data: currentEx } = await supabase
        .from('exercise_images')
        .select('*')
        .ilike('exercise_name', currentExerciseName)
        .limit(1)
        .single();

      if (currentEx) {
        // Find similar exercises based on primary muscles and equipment
        let query = supabase
          .from('exercise_images')
          .select('*')
          .neq('exercise_name', currentExerciseName);

        if (currentEx.primary_muscles && currentEx.primary_muscles.length > 0) {
          query = query.overlaps('primary_muscles', currentEx.primary_muscles);
        }

        if (currentEx.equipment) {
          query = query.eq('equipment', currentEx.equipment);
        }

        const { data: similarExercises } = await query.limit(10);

        if (similarExercises && similarExercises.length > 0) {
          setAlternatives(similarExercises);
        } else {
          loadPopularExercises(currentEx.category);
        }
      } else {
        loadPopularExercises();
      }
    } catch (error) {
      console.error('Error loading alternatives:', error);
      loadPopularExercises();
    } finally {
      setLoading(false);
    }
  };

  const loadPopularExercises = async (category?: string) => {
    try {
      let query = supabase
        .from('exercise_images')
        .select('*')
        .neq('exercise_name', currentExerciseName);

      if (category) {
        query = query.eq('category', category);
      }

      const { data } = await query.limit(10);

      if (data) {
        setAlternatives(data);
      }
    } catch (error) {
      console.error('Error loading popular exercises:', error);
    }
  };

  const searchExercises = async (query: string) => {
    try {
      setLoading(true);
      const normalizedQuery = query.toLowerCase().trim();

      const { data } = await supabase
        .from('exercise_images')
        .select('*')
        .or(
          `exercise_name.ilike.%${normalizedQuery}%,` +
          `keywords.cs.{${normalizedQuery}}`
        )
        .limit(15);

      if (data) {
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = (newExerciseName: string) => {
    onSwap(newExerciseName, currentExerciseIndex);
    onClose();
  };

  const renderExerciseCard = (exercise: Exercise) => {
    return (
      <TouchableOpacity
        key={exercise.id}
        style={styles.exerciseCard}
        onPress={() => handleSwap(exercise.exercise_name)}
        activeOpacity={0.7}
      >
        <View style={styles.exerciseCardContent}>
          {exercise.start_image_url && (
            <Image
              source={{ uri: exercise.start_image_url }}
              style={styles.exerciseImage}
              resizeMode="cover"
            />
          )}

          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName} numberOfLines={2}>
              {exercise.exercise_name}
            </Text>
            <View style={styles.exerciseMeta}>
              {exercise.equipment && (
                <Text style={styles.equipmentBadge}>{exercise.equipment}</Text>
              )}
              {exercise.primary_muscles && exercise.primary_muscles.length > 0 && (
                <Text style={styles.muscleText}>
                  {exercise.primary_muscles[0]}
                </Text>
              )}
              {exercise.difficulty_level && (
                <Text style={styles.difficultyText}>
                  {exercise.difficulty_level}
                </Text>
              )}
            </View>
          </View>

          <ArrowRight size={20} color="#2ddbdb" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#0a0e27', '#1a1f3a']}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Swap Exercise</Text>
              <Text style={styles.currentExercise}>
                Current: {currentExerciseName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <CloseIcon size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <SearchIcon size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search 658 exercises..."
              placeholderTextColor="#6b7280"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                }}
                style={styles.clearButton}
              >
                <CloseIcon size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('alternatives')}
            style={[
              styles.tab,
              activeTab === 'alternatives' && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'alternatives' && styles.tabTextActive,
              ]}
            >
              Similar Exercises
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('search')}
            style={[
              styles.tab,
              activeTab === 'search' && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'search' && styles.tabTextActive,
              ]}
            >
              Search Results
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2ddbdb" />
              <Text style={styles.loadingText}>Loading exercises...</Text>
            </View>
          )}

          {activeTab === 'alternatives' && !loading && (
            <View style={styles.section}>
              {alternatives.length > 0 ? (
                alternatives.map((ex) => renderExerciseCard(ex))
              ) : (
                <Text style={styles.emptyText}>
                  No similar exercises found. Try searching.
                </Text>
              )}
            </View>
          )}

          {activeTab === 'search' && !loading && (
            <View style={styles.section}>
              {searchQuery.length > 0 ? (
                <>
                  {suggestions.length > 0 ? (
                    suggestions.map((ex) => renderExerciseCard(ex))
                  ) : (
                    <Text style={styles.emptyText}>
                      No exercises found. Try a different search term.
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.emptyText}>
                  Type at least 2 characters to search
                </Text>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>
            💡 Tap any exercise to swap it in your workout
          </Text>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 219, 219, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  currentExercise: {
    fontSize: 14,
    color: '#9ca3af',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.2)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  clearButton: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabActive: {
    backgroundColor: '#2ddbdb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#0a0e27',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  section: {
    marginBottom: 24,
  },
  exerciseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.2)',
    overflow: 'hidden',
  },
  exerciseCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  exerciseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  equipmentBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2ddbdb',
    backgroundColor: 'rgba(45, 219, 219, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    textTransform: 'capitalize',
  },
  muscleText: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  difficultyText: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 40,
  },
  tipContainer: {
    padding: 16,
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(45, 219, 219, 0.2)',
  },
  tipText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
