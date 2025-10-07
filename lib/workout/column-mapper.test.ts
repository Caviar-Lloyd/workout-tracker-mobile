/**
 * Tests for column-mapper.ts
 * Target: 100% coverage (CRITICAL utility)
 */

import {
  validateExerciseIndex,
  validateSetNumber,
  getColumnName,
  getExerciseNameColumn,
  getExerciseNotesColumn,
  mapSetToColumns,
  mapColumnsToSet,
  mapExerciseSets,
  mapExerciseToColumns,
  extractAllExercises,
  createPartialUpdate,
  type SetData,
  type ExerciseData,
} from './column-mapper';

describe('validateExerciseIndex', () => {
  it('returns true for valid exercise indices', () => {
    expect(validateExerciseIndex(1)).toBe(true);
    expect(validateExerciseIndex(4)).toBe(true);
    expect(validateExerciseIndex(7)).toBe(true);
  });

  it('returns false for invalid exercise index (below range)', () => {
    expect(validateExerciseIndex(0)).toBe(false);
    expect(validateExerciseIndex(-1)).toBe(false);
  });

  it('returns false for invalid exercise index (above range)', () => {
    expect(validateExerciseIndex(8)).toBe(false);
    expect(validateExerciseIndex(10)).toBe(false);
  });

  it('returns false for non-integer', () => {
    expect(validateExerciseIndex(1.5)).toBe(false);
    expect(validateExerciseIndex(NaN)).toBe(false);
  });
});

describe('validateSetNumber', () => {
  it('returns true for valid set numbers', () => {
    expect(validateSetNumber(1)).toBe(true);
    expect(validateSetNumber(2)).toBe(true);
    expect(validateSetNumber(4)).toBe(true);
  });

  it('returns false for invalid set number (below range)', () => {
    expect(validateSetNumber(0)).toBe(false);
    expect(validateSetNumber(-1)).toBe(false);
  });

  it('returns false for invalid set number (above range)', () => {
    expect(validateSetNumber(5)).toBe(false);
    expect(validateSetNumber(10)).toBe(false);
  });

  it('returns false for non-integer', () => {
    expect(validateSetNumber(1.5)).toBe(false);
    expect(validateSetNumber(NaN)).toBe(false);
  });
});

describe('getColumnName', () => {
  it('generates correct reps column name', () => {
    expect(getColumnName(1, 1, 'reps')).toBe('exercise_1_set1_reps');
  });

  it('generates correct weight column name', () => {
    expect(getColumnName(1, 1, 'weight')).toBe('exercise_1_set1_weight');
  });

  it('generates correct notes column name', () => {
    expect(getColumnName(1, 1, 'notes')).toBe('exercise_1_set1_notes');
  });

  it('generates correct column for exercise 2 set 3', () => {
    expect(getColumnName(2, 3, 'reps')).toBe('exercise_2_set3_reps');
    expect(getColumnName(2, 3, 'weight')).toBe('exercise_2_set3_weight');
  });

  it('generates correct column for exercise 7 set 4', () => {
    expect(getColumnName(7, 4, 'reps')).toBe('exercise_7_set4_reps');
  });

  it('throws error for invalid exercise index', () => {
    expect(() => getColumnName(0, 1, 'reps')).toThrow('Invalid exercise index');
    expect(() => getColumnName(8, 1, 'reps')).toThrow('Invalid exercise index');
  });

  it('throws error for invalid set number', () => {
    expect(() => getColumnName(1, 0, 'reps')).toThrow('Invalid set number');
    expect(() => getColumnName(1, 5, 'reps')).toThrow('Invalid set number');
  });
});

describe('getExerciseNameColumn', () => {
  it('generates correct name column for exercise 1', () => {
    expect(getExerciseNameColumn(1)).toBe('exercise_1_name');
  });

  it('generates correct name column for exercise 7', () => {
    expect(getExerciseNameColumn(7)).toBe('exercise_7_name');
  });

  it('throws error for invalid exercise index', () => {
    expect(() => getExerciseNameColumn(0)).toThrow('Invalid exercise index');
    expect(() => getExerciseNameColumn(8)).toThrow('Invalid exercise index');
  });
});

describe('getExerciseNotesColumn', () => {
  it('generates correct notes column for exercise 1', () => {
    expect(getExerciseNotesColumn(1)).toBe('exercise_1_notes');
  });

  it('generates correct notes column for exercise 7', () => {
    expect(getExerciseNotesColumn(7)).toBe('exercise_7_notes');
  });

  it('throws error for invalid exercise index', () => {
    expect(() => getExerciseNotesColumn(0)).toThrow('Invalid exercise index');
    expect(() => getExerciseNotesColumn(8)).toThrow('Invalid exercise index');
  });
});

describe('mapSetToColumns', () => {
  it('maps set data to columns correctly', () => {
    const setData: SetData = { reps: 10, weight: 185 };
    const result = mapSetToColumns(1, 1, setData);

    expect(result).toEqual({
      exercise_1_set1_reps: 10,
      exercise_1_set1_weight: 185,
    });
  });

  it('maps set data for exercise 2 set 3', () => {
    const setData: SetData = { reps: 8, weight: 200 };
    const result = mapSetToColumns(2, 3, setData);

    expect(result).toEqual({
      exercise_2_set3_reps: 8,
      exercise_2_set3_weight: 200,
    });
  });

  it('handles null values', () => {
    const setData: SetData = { reps: null, weight: null };
    const result = mapSetToColumns(1, 1, setData);

    expect(result).toEqual({
      exercise_1_set1_reps: null,
      exercise_1_set1_weight: null,
    });
  });

  it('handles partial null values', () => {
    const setData: SetData = { reps: 10, weight: null };
    const result = mapSetToColumns(1, 1, setData);

    expect(result).toEqual({
      exercise_1_set1_reps: 10,
      exercise_1_set1_weight: null,
    });
  });

  it('throws error for invalid exercise index', () => {
    const setData: SetData = { reps: 10, weight: 185 };
    expect(() => mapSetToColumns(0, 1, setData)).toThrow();
  });

  it('throws error for invalid set number', () => {
    const setData: SetData = { reps: 10, weight: 185 };
    expect(() => mapSetToColumns(1, 0, setData)).toThrow();
  });
});

describe('mapColumnsToSet', () => {
  it('maps columns to set data correctly', () => {
    const columns = {
      exercise_1_set1_reps: 10,
      exercise_1_set1_weight: 185,
    };
    const result = mapColumnsToSet(columns, 1, 1);

    expect(result).toEqual({ reps: 10, weight: 185 });
  });

  it('maps columns for exercise 2 set 3', () => {
    const columns = {
      exercise_2_set3_reps: 8,
      exercise_2_set3_weight: 200,
    };
    const result = mapColumnsToSet(columns, 2, 3);

    expect(result).toEqual({ reps: 8, weight: 200 });
  });

  it('handles missing columns with null', () => {
    const columns = {};
    const result = mapColumnsToSet(columns, 1, 1);

    expect(result).toEqual({ reps: null, weight: null });
  });

  it('handles partial columns', () => {
    const columns = {
      exercise_1_set1_reps: 10,
    };
    const result = mapColumnsToSet(columns, 1, 1);

    expect(result).toEqual({ reps: 10, weight: null });
  });

  it('throws error for invalid exercise index', () => {
    expect(() => mapColumnsToSet({}, 0, 1)).toThrow();
  });

  it('throws error for invalid set number', () => {
    expect(() => mapColumnsToSet({}, 1, 0)).toThrow();
  });
});

describe('mapExerciseSets', () => {
  it('extracts all sets for an exercise', () => {
    const columns = {
      exercise_1_set1_reps: 10,
      exercise_1_set1_weight: 185,
      exercise_1_set2_reps: 9,
      exercise_1_set2_weight: 185,
      exercise_1_set3_reps: 8,
      exercise_1_set3_weight: 185,
    };
    const result = mapExerciseSets(columns, 1);

    expect(result).toEqual([
      { reps: 10, weight: 185 },
      { reps: 9, weight: 185 },
      { reps: 8, weight: 185 },
    ]);
  });

  it('excludes empty sets', () => {
    const columns = {
      exercise_1_set1_reps: 10,
      exercise_1_set1_weight: 185,
      // set2 is empty
      exercise_1_set3_reps: 8,
      exercise_1_set3_weight: 185,
    };
    const result = mapExerciseSets(columns, 1);

    expect(result).toEqual([
      { reps: 10, weight: 185 },
      { reps: 8, weight: 185 },
    ]);
  });

  it('returns empty array when no sets have data', () => {
    const columns = {};
    const result = mapExerciseSets(columns, 1);

    expect(result).toEqual([]);
  });

  it('respects maxSets parameter', () => {
    const columns = {
      exercise_1_set1_reps: 10,
      exercise_1_set1_weight: 185,
      exercise_1_set2_reps: 9,
      exercise_1_set2_weight: 185,
    };
    const result = mapExerciseSets(columns, 1, 2);

    expect(result).toHaveLength(2);
  });
});

describe('mapExerciseToColumns', () => {
  it('maps exercise data with multiple sets', () => {
    const exerciseData: ExerciseData = {
      exerciseIndex: 1,
      name: 'Bench Press',
      sets: [
        { reps: 10, weight: 185 },
        { reps: 9, weight: 185 },
      ],
      notes: 'Good form',
    };
    const result = mapExerciseToColumns(exerciseData);

    expect(result).toEqual({
      exercise_1_set1_reps: 10,
      exercise_1_set1_weight: 185,
      exercise_1_set2_reps: 9,
      exercise_1_set2_weight: 185,
      exercise_1_notes: 'Good form',
    });
  });

  it('handles exercise without notes', () => {
    const exerciseData: ExerciseData = {
      exerciseIndex: 1,
      name: 'Bench Press',
      sets: [{ reps: 10, weight: 185 }],
      notes: null,
    };
    const result = mapExerciseToColumns(exerciseData);

    expect(result).not.toHaveProperty('exercise_1_notes');
  });

  it('handles empty sets array', () => {
    const exerciseData: ExerciseData = {
      exerciseIndex: 1,
      name: 'Bench Press',
      sets: [],
      notes: null,
    };
    const result = mapExerciseToColumns(exerciseData);

    expect(result).toEqual({});
  });
});

describe('extractAllExercises', () => {
  it('extracts all 7 exercises from row', () => {
    const row = {
      exercise_1_name: 'Bench Press',
      exercise_1_set1_reps: 10,
      exercise_1_set1_weight: 185,
      exercise_2_name: 'Incline Press',
      exercise_2_set1_reps: 8,
      exercise_2_set1_weight: 165,
      exercise_3_name: 'Exercise 3',
      exercise_4_name: 'Exercise 4',
      exercise_5_name: 'Exercise 5',
      exercise_6_name: 'Exercise 6',
      exercise_7_name: 'Exercise 7',
    };
    const result = extractAllExercises(row);

    expect(result).toHaveLength(7);
    expect(result[0].name).toBe('Bench Press');
    expect(result[0].sets).toEqual([{ reps: 10, weight: 185 }]);
    expect(result[1].name).toBe('Incline Press');
    expect(result[1].sets).toEqual([{ reps: 8, weight: 165 }]);
  });

  it('uses default name when exercise name missing', () => {
    const row = {};
    const result = extractAllExercises(row, 2);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Exercise 1');
    expect(result[1].name).toBe('Exercise 2');
  });

  it('includes exercise notes when present', () => {
    const row = {
      exercise_1_name: 'Bench Press',
      exercise_1_notes: 'Good form',
    };
    const result = extractAllExercises(row, 1);

    expect(result[0].notes).toBe('Good form');
  });

  it('respects exerciseCount parameter', () => {
    const row = {
      exercise_1_name: 'Exercise 1',
      exercise_2_name: 'Exercise 2',
      exercise_3_name: 'Exercise 3',
    };
    const result = extractAllExercises(row, 2);

    expect(result).toHaveLength(2);
  });
});

describe('createPartialUpdate', () => {
  it('creates update object for single exercise', () => {
    const updates: ExerciseData[] = [
      {
        exerciseIndex: 1,
        name: 'Bench Press',
        sets: [{ reps: 10, weight: 185 }],
        notes: null,
      },
    ];
    const result = createPartialUpdate(updates);

    expect(result).toHaveProperty('exercise_1_set1_reps', 10);
    expect(result).toHaveProperty('exercise_1_set1_weight', 185);
    expect(result).toHaveProperty('updated_at');
  });

  it('creates update object for multiple exercises', () => {
    const updates: ExerciseData[] = [
      {
        exerciseIndex: 1,
        name: 'Exercise 1',
        sets: [{ reps: 10, weight: 185 }],
        notes: null,
      },
      {
        exerciseIndex: 2,
        name: 'Exercise 2',
        sets: [{ reps: 8, weight: 165 }],
        notes: 'Good',
      },
    ];
    const result = createPartialUpdate(updates);

    expect(result).toHaveProperty('exercise_1_set1_reps', 10);
    expect(result).toHaveProperty('exercise_2_set1_reps', 8);
    expect(result).toHaveProperty('exercise_2_notes', 'Good');
    expect(result).toHaveProperty('updated_at');
  });

  it('always includes updated_at timestamp', () => {
    const updates: ExerciseData[] = [];
    const result = createPartialUpdate(updates);

    expect(result).toHaveProperty('updated_at');
    expect(typeof result.updated_at).toBe('string');
  });

  it('updated_at is ISO string', () => {
    const updates: ExerciseData[] = [];
    const result = createPartialUpdate(updates);

    const date = new Date(result.updated_at);
    expect(date.toISOString()).toBe(result.updated_at);
  });
});