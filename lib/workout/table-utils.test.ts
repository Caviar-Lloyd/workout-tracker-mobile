/**
 * Tests for table-utils.ts
 * Target: 100% coverage (CRITICAL utility)
 */

import {
  validateWeekDay,
  generateTableName,
  parseTableName,
  getPhaseFromWeek,
  getWorkoutType,
  getRepRange,
  getRestPeriod,
  getAllTableNames,
} from './table-utils';

describe('validateWeekDay', () => {
  it('returns true for valid week and day', () => {
    expect(validateWeekDay(1, 1)).toBe(true);
    expect(validateWeekDay(3, 4)).toBe(true);
    expect(validateWeekDay(6, 6)).toBe(true);
  });

  it('returns false for invalid week (below range)', () => {
    expect(validateWeekDay(0, 1)).toBe(false);
    expect(validateWeekDay(-1, 1)).toBe(false);
  });

  it('returns false for invalid week (above range)', () => {
    expect(validateWeekDay(7, 1)).toBe(false);
    expect(validateWeekDay(10, 1)).toBe(false);
  });

  it('returns false for invalid day (below range)', () => {
    expect(validateWeekDay(1, 0)).toBe(false);
    expect(validateWeekDay(1, -1)).toBe(false);
  });

  it('returns false for invalid day (above range)', () => {
    expect(validateWeekDay(1, 7)).toBe(false);
    expect(validateWeekDay(1, 10)).toBe(false);
  });

  it('returns false for non-integer week', () => {
    expect(validateWeekDay(1.5, 1)).toBe(false);
    expect(validateWeekDay(NaN, 1)).toBe(false);
  });

  it('returns false for non-integer day', () => {
    expect(validateWeekDay(1, 1.5)).toBe(false);
    expect(validateWeekDay(1, NaN)).toBe(false);
  });
});

describe('generateTableName', () => {
  it('generates correct table name for week 1 day 1', () => {
    expect(generateTableName(1, 1)).toBe('week1_day1_workout_tracking');
  });

  it('generates correct table name for week 6 day 6', () => {
    expect(generateTableName(6, 6)).toBe('week6_day6_workout_tracking');
  });

  it('generates correct table name for week 3 day 4', () => {
    expect(generateTableName(3, 4)).toBe('week3_day4_workout_tracking');
  });

  it('throws error for invalid week (below range)', () => {
    expect(() => generateTableName(0, 1)).toThrow('Invalid week (0) or day (1)');
  });

  it('throws error for invalid week (above range)', () => {
    expect(() => generateTableName(7, 1)).toThrow('Invalid week (7) or day (1)');
  });

  it('throws error for invalid day (below range)', () => {
    expect(() => generateTableName(1, 0)).toThrow('Invalid week (1) or day (0)');
  });

  it('throws error for invalid day (above range)', () => {
    expect(() => generateTableName(1, 7)).toThrow('Invalid week (1) or day (7)');
  });

  it('throws error for non-integer week', () => {
    expect(() => generateTableName(1.5, 1)).toThrow();
  });

  it('throws error for non-integer day', () => {
    expect(() => generateTableName(1, 1.5)).toThrow();
  });
});

describe('parseTableName', () => {
  it('parses valid table name correctly', () => {
    expect(parseTableName('week1_day1_workout_tracking')).toEqual({ week: 1, day: 1 });
  });

  it('parses week 3 day 4 correctly', () => {
    expect(parseTableName('week3_day4_workout_tracking')).toEqual({ week: 3, day: 4 });
  });

  it('parses week 6 day 6 correctly', () => {
    expect(parseTableName('week6_day6_workout_tracking')).toEqual({ week: 6, day: 6 });
  });

  it('throws error for invalid table name format', () => {
    expect(() => parseTableName('invalid_table')).toThrow('Invalid table name format');
  });

  it('throws error for missing workout_tracking suffix', () => {
    expect(() => parseTableName('week1_day1')).toThrow('Invalid table name format');
  });

  it('throws error for invalid week number in table name', () => {
    expect(() => parseTableName('week7_day1_workout_tracking')).toThrow('Invalid week');
  });

  it('throws error for invalid day number in table name', () => {
    expect(() => parseTableName('week1_day7_workout_tracking')).toThrow('Invalid day');
  });
});

describe('getPhaseFromWeek', () => {
  it('returns phase 1 for week 1', () => {
    expect(getPhaseFromWeek(1)).toBe(1);
  });

  it('returns phase 1 for week 2', () => {
    expect(getPhaseFromWeek(2)).toBe(1);
  });

  it('returns phase 1 for week 3', () => {
    expect(getPhaseFromWeek(3)).toBe(1);
  });

  it('returns phase 2 for week 4', () => {
    expect(getPhaseFromWeek(4)).toBe(2);
  });

  it('returns phase 2 for week 5', () => {
    expect(getPhaseFromWeek(5)).toBe(2);
  });

  it('returns phase 2 for week 6', () => {
    expect(getPhaseFromWeek(6)).toBe(2);
  });

  it('throws error for invalid week (below range)', () => {
    expect(() => getPhaseFromWeek(0)).toThrow('Invalid week number');
  });

  it('throws error for invalid week (above range)', () => {
    expect(() => getPhaseFromWeek(7)).toThrow('Invalid week number');
  });

  it('throws error for non-integer week', () => {
    expect(() => getPhaseFromWeek(1.5)).toThrow('Invalid week number');
  });
});

describe('getWorkoutType', () => {
  it('returns Multi-Joint for day 1', () => {
    expect(getWorkoutType(1)).toBe('Multi-Joint');
  });

  it('returns Multi-Joint for day 2', () => {
    expect(getWorkoutType(2)).toBe('Multi-Joint');
  });

  it('returns Multi-Joint for day 3', () => {
    expect(getWorkoutType(3)).toBe('Multi-Joint');
  });

  it('returns Isolation for day 4', () => {
    expect(getWorkoutType(4)).toBe('Isolation');
  });

  it('returns Isolation for day 5', () => {
    expect(getWorkoutType(5)).toBe('Isolation');
  });

  it('returns Isolation for day 6', () => {
    expect(getWorkoutType(6)).toBe('Isolation');
  });

  it('throws error for invalid day (below range)', () => {
    expect(() => getWorkoutType(0)).toThrow('Invalid day number');
  });

  it('throws error for invalid day (above range)', () => {
    expect(() => getWorkoutType(7)).toThrow('Invalid day number');
  });
});

describe('getRepRange', () => {
  describe('Multi-Joint workouts (days 1-3)', () => {
    it('returns 9-11 for week 1 day 1', () => {
      expect(getRepRange(1, 1)).toBe('9-11');
    });

    it('returns 7-9 for week 2 day 1', () => {
      expect(getRepRange(2, 1)).toBe('6-8');
    });

    it('returns 5-7 for week 3 day 1', () => {
      expect(getRepRange(3, 1)).toBe('2-5');
    });

    it('returns 9-11 for week 4 day 1 (phase 2 reset)', () => {
      expect(getRepRange(4, 1)).toBe('9-11');
    });

    it('returns 7-9 for week 5 day 1', () => {
      expect(getRepRange(5, 1)).toBe('6-8');
    });

    it('returns 5-7 for week 6 day 1', () => {
      expect(getRepRange(6, 1)).toBe('2-5');
    });
  });

  describe('Isolation workouts (days 4-6)', () => {
    it('returns 12-15 for week 1 day 4', () => {
      expect(getRepRange(1, 4)).toBe('12-15');
    });

    it('returns 10-12 for week 2 day 4', () => {
      expect(getRepRange(2, 4)).toBe('16-20');
    });

    it('returns 21-30 for week 3 day 4 (high rep week)', () => {
      expect(getRepRange(3, 4)).toBe('21-30');
    });

    it('returns 12-15 for week 4 day 4 (phase 2 reset)', () => {
      expect(getRepRange(4, 4)).toBe('12-15');
    });

    it('returns 10-12 for week 5 day 4', () => {
      expect(getRepRange(5, 4)).toBe('16-20');
    });

    it('returns 21-30 for week 6 day 4 (high rep week)', () => {
      expect(getRepRange(6, 4)).toBe('21-30');
    });
  });

  it('throws error for invalid week/day', () => {
    expect(() => getRepRange(0, 1)).toThrow('Invalid week');
    expect(() => getRepRange(1, 0)).toThrow('Invalid day');
  });
});

describe('getRestPeriod', () => {
  describe('Multi-Joint workouts (days 1-3)', () => {
    it('returns 90 seconds for week 1', () => {
      expect(getRestPeriod(1, 1)).toBe(90);
    });

    it('returns 120 seconds for week 2', () => {
      expect(getRestPeriod(2, 1)).toBe(120);
    });

    it('returns 180 seconds for week 3', () => {
      expect(getRestPeriod(3, 1)).toBe(180);
    });

    it('returns 90 seconds for week 4 (phase 2 reset)', () => {
      expect(getRestPeriod(4, 1)).toBe(90);
    });

    it('returns 120 seconds for week 5', () => {
      expect(getRestPeriod(5, 1)).toBe(120);
    });

    it('returns 180 seconds for week 6', () => {
      expect(getRestPeriod(6, 1)).toBe(180);
    });
  });

  describe('Isolation workouts (days 4-6)', () => {
    it('returns 60 seconds for week 1', () => {
      expect(getRestPeriod(1, 4)).toBe(60);
    });

    it('returns 75 seconds for week 2', () => {
      expect(getRestPeriod(2, 4)).toBe(75);
    });

    it('returns 90 seconds for week 3', () => {
      expect(getRestPeriod(3, 4)).toBe(90);
    });

    it('returns 60 seconds for week 4 (phase 2 reset)', () => {
      expect(getRestPeriod(4, 4)).toBe(60);
    });

    it('returns 75 seconds for week 5', () => {
      expect(getRestPeriod(5, 4)).toBe(75);
    });

    it('returns 90 seconds for week 6', () => {
      expect(getRestPeriod(6, 4)).toBe(90);
    });
  });

  it('throws error for invalid week/day', () => {
    expect(() => getRestPeriod(0, 1)).toThrow('Invalid week');
    expect(() => getRestPeriod(1, 0)).toThrow('Invalid day');
  });
});

describe('getAllTableNames', () => {
  it('returns all 36 table names', () => {
    const tables = getAllTableNames();
    expect(tables).toHaveLength(36);
  });

  it('includes week1_day1_workout_tracking', () => {
    const tables = getAllTableNames();
    expect(tables).toContain('week1_day1_workout_tracking');
  });

  it('includes week6_day6_workout_tracking', () => {
    const tables = getAllTableNames();
    expect(tables).toContain('week6_day6_workout_tracking');
  });

  it('includes all weeks and days', () => {
    const tables = getAllTableNames();
    for (let week = 1; week <= 6; week++) {
      for (let day = 1; day <= 6; day++) {
        expect(tables).toContain(`week${week}_day${day}_workout_tracking`);
      }
    }
  });

  it('returns tables in correct order', () => {
    const tables = getAllTableNames();
    expect(tables[0]).toBe('week1_day1_workout_tracking');
    expect(tables[5]).toBe('week1_day6_workout_tracking');
    expect(tables[6]).toBe('week2_day1_workout_tracking');
    expect(tables[35]).toBe('week6_day6_workout_tracking');
  });
});