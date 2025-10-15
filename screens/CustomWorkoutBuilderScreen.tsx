import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase/client';
import { X as XIcon, Plus as PlusIcon, Trash as TrashIcon } from 'lucide-react-native';

interface Set {
  reps: string;
  weight: string;
}

interface Exercise {
  id: string;
  name: string;
  repRange: string; // e.g., "8-10" or "12-15"
  sets: Set[];
  numSets: number;
}

interface CustomWorkoutBuilderScreenProps {
  visible: boolean;
  onClose: () => void;
  clientEmail?: string;
  coachEmail: string;
  onSave?: () => void;
}

export default function CustomWorkoutBuilderScreen({
  visible,
  onClose,
  clientEmail,
  coachEmail,
  onSave,
}: CustomWorkoutBuilderScreenProps) {
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Scheduler state
  const [showScheduler, setShowScheduler] = useState(false);
  const [totalSessions, setTotalSessions] = useState('6');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri
  const [saveAsTemplate, setSaveAsTemplate] = useState(true);
  const [autoResume, setAutoResume] = useState(true);

  const daysOfWeek = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
  ];

  const addExercise = () => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: '',
      repRange: '8-12', // Default rep range
      sets: [{ reps: '', weight: '' }],
      numSets: 1,
    };
    setExercises([...exercises, newExercise]);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const updateExerciseName = (id: string, name: string) => {
    setExercises(
      exercises.map((ex) => (ex.id === id ? { ...ex, name } : ex))
    );
  };

  const updateRepRange = (id: string, repRange: string) => {
    setExercises(
      exercises.map((ex) => (ex.id === id ? { ...ex, repRange } : ex))
    );
  };

  const updateNumSets = (id: string, numSets: number) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id === id) {
          const newSets = Array(numSets)
            .fill(null)
            .map((_, i) => ex.sets[i] || { reps: '', weight: '' });
          return { ...ex, numSets, sets: newSets };
        }
        return ex;
      })
    );
  };

  const updateSet = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: string) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id === exerciseId) {
          const newSets = [...ex.sets];
          newSets[setIndex] = { ...newSets[setIndex], [field]: value };
          return { ...ex, sets: newSets };
        }
        return ex;
      })
    );
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleSaveWorkout = async () => {
    // Validate inputs
    if (!workoutName.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    if (exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    for (const ex of exercises) {
      if (!ex.name.trim()) {
        Alert.alert('Error', 'All exercises must have a name');
        return;
      }
    }

    // If assigning to client, show scheduler
    if (clientEmail) {
      setShowScheduler(true);
    } else {
      // Just save as template
      await saveWorkout(true, false);
    }
  };

  const saveWorkout = async (isTemplate: boolean, assignToClient: boolean) => {
    try {
      setSaving(true);

      // Format exercises for JSONB storage
      const formattedExercises = exercises.map((ex) => ({
        name: ex.name,
        repRange: ex.repRange || '8-12',
        sets: ex.sets.map((set) => ({
          reps: set.reps || '0',
          weight: set.weight || '0',
        })),
      }));

      // Insert custom workout
      const { data: workout, error: workoutError } = await supabase
        .from('custom_workouts')
        .insert({
          coach_email: coachEmail,
          workout_name: workoutName,
          exercises: formattedExercises,
          notes: notes || null,
          is_template: isTemplate,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // If assigning to client, create assignment
      if (assignToClient && clientEmail && workout) {
        const sessions = parseInt(totalSessions) || 6;

        const { error: assignmentError } = await supabase
          .from('custom_workout_assignments')
          .insert({
            custom_workout_id: workout.id,
            client_email: clientEmail,
            coach_email: coachEmail,
            start_date: new Date().toISOString().split('T')[0],
            total_sessions: sessions,
            completed_sessions: 0,
            frequency_days: selectedDays,
            status: 'active',
            notify_coach_on_completion: !autoResume,
            auto_switch_to_program: autoResume,
          });

        if (assignmentError) throw assignmentError;

        // Update client program assignment to 'custom'
        const { error: programError } = await supabase
          .from('client_program_assignments')
          .update({ program_type: 'custom' })
          .eq('client_email', clientEmail);

        if (programError) throw programError;
      }

      Alert.alert('Success', 'Workout saved successfully!');

      // Reset form
      setWorkoutName('');
      setExercises([]);
      setNotes('');
      setShowScheduler(false);

      if (onSave) onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSchedulerSave = () => {
    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one training day');
      return;
    }

    const sessions = parseInt(totalSessions);
    if (isNaN(sessions) || sessions < 1) {
      Alert.alert('Error', 'Please enter a valid number of sessions');
      return;
    }

    saveWorkout(saveAsTemplate, true);
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent={false}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Custom Workout</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <XIcon size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Workout Name */}
            <View style={styles.section}>
              <Text style={styles.label}>Workout Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Full Body Workout A"
                placeholderTextColor="#666"
                value={workoutName}
                onChangeText={setWorkoutName}
              />
            </View>

            {/* Exercises */}
            <View style={styles.section}>
              <Text style={styles.label}>Exercises</Text>

              {exercises.map((exercise, exerciseIndex) => (
                <View key={exercise.id} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseNumber}>Exercise {exerciseIndex + 1}</Text>
                    <TouchableOpacity
                      onPress={() => removeExercise(exercise.id)}
                      style={styles.deleteButton}
                    >
                      <TrashIcon size={18} color="#ff6b6b" />
                    </TouchableOpacity>
                  </View>

                  {/* Exercise Name */}
                  <TextInput
                    style={styles.input}
                    placeholder="Exercise name (e.g., Leg Press)"
                    placeholderTextColor="#666"
                    value={exercise.name}
                    onChangeText={(text) => updateExerciseName(exercise.id, text)}
                  />

                  {/* Rep Range */}
                  <View style={styles.repRangeContainer}>
                    <Text style={styles.repRangeLabel}>Rep Range</Text>
                    <TextInput
                      style={styles.repRangeInput}
                      placeholder="8-12"
                      placeholderTextColor="#666"
                      value={exercise.repRange}
                      onChangeText={(text) => updateRepRange(exercise.id, text)}
                    />
                    <Text style={styles.repRangeHint}>e.g., "8-10" or "12-15"</Text>
                  </View>

                  {/* Number of Sets */}
                  <View style={styles.setsSelector}>
                    <Text style={styles.setsLabel}>Number of Sets:</Text>
                    <View style={styles.setButtons}>
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <TouchableOpacity
                          key={num}
                          style={[
                            styles.setButton,
                            exercise.numSets === num && styles.setButtonActive,
                          ]}
                          onPress={() => updateNumSets(exercise.id, num)}
                        >
                          <Text
                            style={[
                              styles.setButtonText,
                              exercise.numSets === num && styles.setButtonTextActive,
                            ]}
                          >
                            {num}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Set Inputs */}
                  {exercise.sets.map((set, setIndex) => (
                    <View key={setIndex} style={styles.setRow}>
                      <Text style={styles.setLabel}>Set {setIndex + 1}</Text>
                      <View style={styles.setInputs}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Reps</Text>
                          <TextInput
                            style={styles.setInput}
                            placeholder="0"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={set.reps}
                            onChangeText={(text) =>
                              updateSet(exercise.id, setIndex, 'reps', text)
                            }
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Weight (lbs)</Text>
                          <TextInput
                            style={styles.setInput}
                            placeholder="0"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={set.weight}
                            onChangeText={(text) =>
                              updateSet(exercise.id, setIndex, 'weight', text)
                            }
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))}

              {exercises.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No exercises added yet</Text>
                  <Text style={styles.emptySubtext}>Tap "Add Exercise" to get started</Text>
                </View>
              )}

              {/* Add Exercise Button - positioned after all exercises */}
              <TouchableOpacity onPress={addExercise} style={styles.addExerciseButton}>
                <PlusIcon size={20} color="#2ddbdb" />
                <Text style={styles.addButtonText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Add any notes about this workout..."
                placeholderTextColor="#666"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveWorkout}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#0a0e27" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {clientEmail ? 'Continue to Schedule' : 'Save Template'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Scheduler Modal */}
      <Modal visible={showScheduler} animationType="slide" transparent={true}>
        <View style={styles.schedulerOverlay}>
          <View style={styles.schedulerContent}>
            <Text style={styles.schedulerTitle}>Schedule Workout</Text>

            {/* Total Sessions */}
            <View style={styles.schedulerSection}>
              <Text style={styles.schedulerLabel}>Total Sessions</Text>
              <TextInput
                style={styles.input}
                placeholder="6"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={totalSessions}
                onChangeText={setTotalSessions}
              />
            </View>

            {/* Training Days */}
            <View style={styles.schedulerSection}>
              <Text style={styles.schedulerLabel}>Training Days</Text>
              <View style={styles.daysContainer}>
                {daysOfWeek.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.dayButton,
                      selectedDays.includes(day.value) && styles.dayButtonActive,
                    ]}
                    onPress={() => toggleDay(day.value)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        selectedDays.includes(day.value) && styles.dayButtonTextActive,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Options */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setSaveAsTemplate(!saveAsTemplate)}
            >
              <View style={[styles.checkbox, saveAsTemplate && styles.checkboxChecked]}>
                {saveAsTemplate && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.checkboxLabel}>Save as template for reuse</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAutoResume(!autoResume)}
            >
              <View style={[styles.checkbox, autoResume && styles.checkboxChecked]}>
                {autoResume && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.checkboxLabel}>
                Auto-resume standard program after completion
              </Text>
            </TouchableOpacity>

            {/* Buttons */}
            <View style={styles.schedulerButtons}>
              <TouchableOpacity
                style={[styles.schedulerButton, styles.cancelButton]}
                onPress={() => setShowScheduler(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.schedulerButton, styles.confirmButton]}
                onPress={handleSchedulerSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#0a0e27" />
                ) : (
                  <Text style={styles.confirmButtonText}>Assign Workout</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f3a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#2ddbdb',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#2ddbdb',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseCard: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2ddbdb',
  },
  deleteButton: {
    padding: 4,
  },
  repRangeContainer: {
    marginTop: 12,
  },
  repRangeLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 6,
  },
  repRangeInput: {
    backgroundColor: '#0a0e27',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2f4a',
    marginBottom: 4,
  },
  repRangeHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  setsSelector: {
    marginTop: 12,
  },
  setsLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  setButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  setButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0a0e27',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2f4a',
  },
  setButtonActive: {
    backgroundColor: '#2ddbdb',
    borderColor: '#2ddbdb',
  },
  setButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  setButtonTextActive: {
    color: '#0a0e27',
  },
  setRow: {
    marginTop: 12,
  },
  setLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  setInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  setInput: {
    backgroundColor: '#0a0e27',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2f4a',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#444',
    fontSize: 14,
    marginTop: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1a1f3a',
  },
  saveButton: {
    backgroundColor: '#2ddbdb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#0a0e27',
    fontSize: 16,
    fontWeight: '700',
  },
  schedulerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  schedulerContent: {
    backgroundColor: '#1a1f3a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  schedulerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  schedulerSection: {
    marginBottom: 20,
  },
  schedulerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dayButton: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: '#0a0e27',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2f4a',
  },
  dayButtonActive: {
    backgroundColor: '#2ddbdb',
    borderColor: '#2ddbdb',
  },
  dayButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: '#0a0e27',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2a2f4a',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#2ddbdb',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#2ddbdb',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  schedulerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  schedulerButton: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#0a0e27',
    borderWidth: 1,
    borderColor: '#2a2f4a',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#2ddbdb',
  },
  confirmButtonText: {
    color: '#0a0e27',
    fontSize: 14,
    fontWeight: '700',
  },
});
