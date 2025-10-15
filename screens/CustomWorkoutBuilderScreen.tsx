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
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  repType: 'single' | 'range'; // single reps or rep range
  repLow: string; // for range mode
  repHigh: string; // for range mode
  sets: Set[];
  numSets: number;
}

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface CustomWorkoutBuilderScreenProps {
  visible: boolean;
  onClose: () => void;
  clientEmail?: string;
  coachEmail: string;
  clients?: Client[];
  onSave?: () => void;
}

export default function CustomWorkoutBuilderScreen({
  visible,
  onClose,
  clientEmail,
  coachEmail,
  clients = [],
  onSave,
}: CustomWorkoutBuilderScreenProps) {
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [showClientSelector, setShowClientSelector] = useState(false);

  const toggleClientSelection = (clientId: number) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  // Scheduler state
  const [showScheduler, setShowScheduler] = useState(false);
  const [workoutType, setWorkoutType] = useState<'workout' | 'warmup'>('workout'); // workout or warmup

  // Workout-specific state
  const [schedulingMode, setSchedulingMode] = useState<'one-time' | 'duration'>('duration'); // one-time or duration
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [duration, setDuration] = useState('4'); // Number of weeks
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri

  // Warm-up specific state
  const [selectedProgramDays, setSelectedProgramDays] = useState<number[]>([1]); // Program day 1, 2, 3, etc.

  // Common state
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
      repRange: '0',
      repType: 'single',
      repLow: '0',
      repHigh: '0',
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

  const updateRepType = (id: string, repType: 'single' | 'range') => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id === id) {
          // When switching to range, construct repRange from repLow-repHigh
          if (repType === 'range') {
            const low = ex.repLow || '0';
            const high = ex.repHigh || '0';
            return { ...ex, repType, repRange: `${low}-${high}` };
          }
          // When switching to single, use repRange as single value
          return { ...ex, repType, repRange: ex.repRange };
        }
        return ex;
      })
    );
  };

  const updateRepLow = (id: string, repLow: string) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id === id) {
          const newRepRange = `${repLow}-${ex.repHigh}`;
          return { ...ex, repLow, repRange: newRepRange };
        }
        return ex;
      })
    );
  };

  const updateRepHigh = (id: string, repHigh: string) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id === id) {
          const newRepRange = `${ex.repLow}-${repHigh}`;
          return { ...ex, repHigh, repRange: newRepRange };
        }
        return ex;
      })
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

  const toggleProgramDay = (day: number) => {
    if (selectedProgramDays.includes(day)) {
      setSelectedProgramDays(selectedProgramDays.filter((d) => d !== day));
    } else {
      setSelectedProgramDays([...selectedProgramDays, day].sort());
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

    // If assigning to specific client or selected clients, show scheduler
    if (clientEmail || selectedClients.length > 0) {
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
        repRange: ex.repRange || '0',
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
          workout_type: workoutType, // 'workout' or 'warmup'
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // If assigning to client(s), create assignment(s)
      if (assignToClient && workout) {
        // Get list of client emails to assign to
        const clientEmailsToAssign: string[] = [];

        if (clientEmail) {
          // Single client assignment (from client detail view)
          clientEmailsToAssign.push(clientEmail);
        } else if (selectedClients.length > 0) {
          // Multiple client assignment (from clients list view)
          const selectedClientObjects = clients.filter(c => selectedClients.includes(c.id));
          clientEmailsToAssign.push(...selectedClientObjects.map(c => c.email));
        }

        // Create assignments for each client
        for (const email of clientEmailsToAssign) {
          let assignmentData: any = {
            custom_workout_id: workout.id,
            client_email: email,
            coach_email: coachEmail,
            workout_type: workoutType,
            notify_coach_on_completion: !autoResume,
            auto_switch_to_program: autoResume,
          };

          if (workoutType === 'workout') {
            // Additional workout assignment
            if (schedulingMode === 'one-time') {
              // One-time workout on specific date
              assignmentData.start_date = selectedDate.toISOString().split('T')[0];
              assignmentData.end_date = selectedDate.toISOString().split('T')[0];
              assignmentData.scheduling_mode = 'one-time';
              assignmentData.status = 'active';
            } else {
              // Duration-based recurring workout
              const weeks = parseInt(duration) || 4;
              const startDate = new Date();
              const endDate = new Date();
              endDate.setDate(startDate.getDate() + weeks * 7);

              assignmentData.start_date = startDate.toISOString().split('T')[0];
              assignmentData.end_date = endDate.toISOString().split('T')[0];
              assignmentData.duration_weeks = weeks;
              assignmentData.frequency_days = selectedDays;
              assignmentData.scheduling_mode = 'duration';
              assignmentData.status = 'active';
            }
          } else {
            // Warm-up assignment - associate with program days
            assignmentData.program_days = selectedProgramDays;
            assignmentData.scheduling_mode = 'warmup';
            assignmentData.status = 'active';
          }

          const { error: assignmentError } = await supabase
            .from('custom_workout_assignments')
            .insert(assignmentData);

          if (assignmentError) throw assignmentError;

          // Update client program assignment to 'custom' only for full workouts, not warm-ups
          if (workoutType === 'workout') {
            const { error: programError } = await supabase
              .from('client_program_assignments')
              .update({ program_type: 'custom' })
              .eq('client_email', email);

            if (programError) throw programError;
          }
        }
      }

      // Success message
      let successMessage = `${workoutType === 'warmup' ? 'Warm-up' : 'Workout'} saved successfully!`;
      if (assignToClient) {
        const clientCount = clientEmail ? 1 : selectedClients.length;
        if (clientCount > 0) {
          successMessage += ` Assigned to ${clientCount} client${clientCount > 1 ? 's' : ''}.`;
        }
      }
      Alert.alert('Success', successMessage);

      // Reset form
      setWorkoutName('');
      setExercises([]);
      setNotes('');
      setShowScheduler(false);
      setSelectedClients([]);
      setShowClientSelector(false);

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
    if (workoutType === 'workout') {
      // Validate workout assignment
      if (schedulingMode === 'duration') {
        if (selectedDays.length === 0) {
          Alert.alert('Error', 'Please select at least one training day');
          return;
        }
        const weeks = parseInt(duration);
        if (isNaN(weeks) || weeks < 1) {
          Alert.alert('Error', 'Please enter a valid duration (number of weeks)');
          return;
        }
      }
      // One-time mode doesn't need extra validation - date is already set
    } else {
      // Validate warm-up assignment
      if (selectedProgramDays.length === 0) {
        Alert.alert('Error', 'Please select at least one program day');
        return;
      }
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

            {/* Client Selection - only show if no specific clientEmail and clients available */}
            {!clientEmail && clients.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.clientSelectorToggle}
                  onPress={() => setShowClientSelector(!showClientSelector)}
                >
                  <View>
                    <Text style={styles.label}>Assign to Clients (Optional)</Text>
                    <Text style={styles.clientSelectorHint}>
                      {selectedClients.length === 0
                        ? 'Tap to select clients'
                        : `${selectedClients.length} client${selectedClients.length > 1 ? 's' : ''} selected`}
                    </Text>
                  </View>
                  <Text style={styles.clientSelectorArrow}>{showClientSelector ? '▼' : '▶'}</Text>
                </TouchableOpacity>

                {showClientSelector && (
                  <View style={styles.clientList}>
                    {clients.map((client) => (
                      <TouchableOpacity
                        key={client.id}
                        style={styles.clientItem}
                        onPress={() => toggleClientSelection(client.id)}
                      >
                        <View style={[styles.checkbox, selectedClients.includes(client.id) && styles.checkboxChecked]}>
                          {selectedClients.includes(client.id) && <View style={styles.checkboxInner} />}
                        </View>
                        <Text style={styles.clientName}>
                          {client.first_name} {client.last_name}
                        </Text>
                        <Text style={styles.clientEmail}>{client.email}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

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

                  {/* Rep Type Selector */}
                  <View style={styles.repTypeContainer}>
                    <Text style={styles.repRangeLabel}>Rep Type</Text>
                    <View style={styles.repTypeButtons}>
                      <TouchableOpacity
                        style={[
                          styles.repTypeButton,
                          exercise.repType === 'single' && styles.repTypeButtonActive,
                        ]}
                        onPress={() => updateRepType(exercise.id, 'single')}
                      >
                        <Text
                          style={[
                            styles.repTypeButtonText,
                            exercise.repType === 'single' && styles.repTypeButtonTextActive,
                          ]}
                        >
                          Single
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.repTypeButton,
                          exercise.repType === 'range' && styles.repTypeButtonActive,
                        ]}
                        onPress={() => updateRepType(exercise.id, 'range')}
                      >
                        <Text
                          style={[
                            styles.repTypeButtonText,
                            exercise.repType === 'range' && styles.repTypeButtonTextActive,
                          ]}
                        >
                          Range
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Rep Input */}
                  <View style={styles.repRangeContainer}>
                    {exercise.repType === 'single' ? (
                      <>
                        <Text style={styles.repRangeLabel}>Reps</Text>
                        <TextInput
                          style={styles.repRangeInput}
                          placeholder="0"
                          placeholderTextColor="#666"
                          keyboardType="numeric"
                          value={exercise.repRange}
                          onChangeText={(text) => updateRepRange(exercise.id, text)}
                        />
                      </>
                    ) : (
                      <>
                        <Text style={styles.repRangeLabel}>Rep Range</Text>
                        <View style={styles.repRangeRow}>
                          <View style={styles.repRangeInputGroup}>
                            <Text style={styles.repRangeInputLabel}>Low</Text>
                            <TextInput
                              style={styles.repRangeInputSmall}
                              placeholder="0"
                              placeholderTextColor="#666"
                              keyboardType="numeric"
                              value={exercise.repLow}
                              onChangeText={(text) => updateRepLow(exercise.id, text)}
                            />
                          </View>
                          <Text style={styles.repRangeDash}>-</Text>
                          <View style={styles.repRangeInputGroup}>
                            <Text style={styles.repRangeInputLabel}>High</Text>
                            <TextInput
                              style={styles.repRangeInputSmall}
                              placeholder="0"
                              placeholderTextColor="#666"
                              keyboardType="numeric"
                              value={exercise.repHigh}
                              onChangeText={(text) => updateRepHigh(exercise.id, text)}
                            />
                          </View>
                        </View>
                      </>
                    )}
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
                  {clientEmail || selectedClients.length > 0 ? 'Continue to Schedule' : 'Save Template'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Scheduler Modal */}
      <Modal visible={showScheduler} animationType="slide" transparent={true}>
        <View style={styles.schedulerOverlay}>
          <ScrollView style={styles.schedulerScrollView} contentContainerStyle={styles.schedulerScrollContent}>
            <View style={styles.schedulerContent}>
              <Text style={styles.schedulerTitle}>Schedule {workoutType === 'warmup' ? 'Warm-up' : 'Workout'}</Text>

              {/* Workout Type Selection */}
              <View style={styles.schedulerSection}>
                <Text style={styles.schedulerLabel}>Type</Text>
                <View style={styles.typeButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      workoutType === 'workout' && styles.typeButtonActive,
                    ]}
                    onPress={() => setWorkoutType('workout')}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        workoutType === 'workout' && styles.typeButtonTextActive,
                      ]}
                    >
                      Additional Workout
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      workoutType === 'warmup' && styles.typeButtonActive,
                    ]}
                    onPress={() => setWorkoutType('warmup')}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        workoutType === 'warmup' && styles.typeButtonTextActive,
                      ]}
                    >
                      Warm-up
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Conditional UI based on workout type */}
              {workoutType === 'workout' ? (
                <>
                  {/* Scheduling Mode for Workouts */}
                  <View style={styles.schedulerSection}>
                    <Text style={styles.schedulerLabel}>Schedule As</Text>
                    <View style={styles.typeButtonsContainer}>
                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          schedulingMode === 'one-time' && styles.typeButtonActive,
                        ]}
                        onPress={() => setSchedulingMode('one-time')}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            schedulingMode === 'one-time' && styles.typeButtonTextActive,
                          ]}
                        >
                          One-Time
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          schedulingMode === 'duration' && styles.typeButtonActive,
                        ]}
                        onPress={() => setSchedulingMode('duration')}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            schedulingMode === 'duration' && styles.typeButtonTextActive,
                          ]}
                        >
                          Recurring
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {schedulingMode === 'one-time' ? (
                    /* One-time date picker */
                    <View style={styles.schedulerSection}>
                      <Text style={styles.schedulerLabel}>Select Date</Text>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Text style={styles.datePickerText}>
                          {selectedDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </TouchableOpacity>
                      {showDatePicker && (
                        <DateTimePicker
                          value={selectedDate}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(event, date) => {
                            setShowDatePicker(Platform.OS === 'ios');
                            if (date) setSelectedDate(date);
                          }}
                          minimumDate={new Date()}
                        />
                      )}
                    </View>
                  ) : (
                    <>
                      {/* Duration input */}
                      <View style={styles.schedulerSection}>
                        <Text style={styles.schedulerLabel}>Duration (weeks)</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="4"
                          placeholderTextColor="#666"
                          keyboardType="numeric"
                          value={duration}
                          onChangeText={setDuration}
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
                    </>
                  )}
                </>
              ) : (
                /* Warm-up: Select program days */
                <View style={styles.schedulerSection}>
                  <Text style={styles.schedulerLabel}>Program Days</Text>
                  <Text style={styles.schedulerHint}>Select which days of the program this warm-up applies to</Text>
                  <View style={styles.programDaysContainer}>
                    {[1, 2, 3, 4, 5, 6].map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.programDayButton,
                          selectedProgramDays.includes(day) && styles.programDayButtonActive,
                        ]}
                        onPress={() => toggleProgramDay(day)}
                      >
                        <Text
                          style={[
                            styles.programDayButtonText,
                            selectedProgramDays.includes(day) && styles.programDayButtonTextActive,
                          ]}
                        >
                          Day {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

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

              {workoutType === 'workout' && (
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
              )}

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
                    <Text style={styles.confirmButtonText}>
                      Assign {workoutType === 'warmup' ? 'Warm-up' : 'Workout'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  repTypeContainer: {
    marginTop: 12,
  },
  repTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  repTypeButton: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#0a0e27',
    borderWidth: 1,
    borderColor: '#2a2f4a',
  },
  repTypeButtonActive: {
    backgroundColor: '#2ddbdb',
    borderColor: '#2ddbdb',
  },
  repTypeButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  repTypeButtonTextActive: {
    color: '#0a0e27',
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
  },
  repRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  repRangeInputGroup: {
    flex: 1,
  },
  repRangeInputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  repRangeInputSmall: {
    backgroundColor: '#0a0e27',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2f4a',
  },
  repRangeDash: {
    color: '#999',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
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
  },
  schedulerScrollView: {
    width: '100%',
    maxHeight: '90%',
  },
  schedulerScrollContent: {
    flexGrow: 1,
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
  typeButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#0a0e27',
    borderWidth: 2,
    borderColor: '#2a2f4a',
  },
  typeButtonActive: {
    backgroundColor: '#2ddbdb',
    borderColor: '#2ddbdb',
  },
  typeButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#0a0e27',
  },
  datePickerButton: {
    backgroundColor: '#0a0e27',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2f4a',
  },
  datePickerText: {
    color: '#fff',
    fontSize: 16,
  },
  schedulerHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  programDaysContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  programDayButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0a0e27',
    borderWidth: 1,
    borderColor: '#2a2f4a',
  },
  programDayButtonActive: {
    backgroundColor: '#2ddbdb',
    borderColor: '#2ddbdb',
  },
  programDayButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  programDayButtonTextActive: {
    color: '#0a0e27',
  },
  clientSelectorToggle: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2f4a',
  },
  clientSelectorHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  clientSelectorArrow: {
    fontSize: 18,
    color: '#2ddbdb',
  },
  clientList: {
    marginTop: 12,
    backgroundColor: '#0a0e27',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#2a2f4a',
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f3a',
  },
  clientName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  clientEmail: {
    color: '#666',
    fontSize: 12,
    marginLeft: 8,
  },
});
