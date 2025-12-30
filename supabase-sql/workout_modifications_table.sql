-- Create workout_modifications table for tracking exercise swaps and changes
CREATE TABLE IF NOT EXISTS workout_modifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_email TEXT NOT NULL,
  client_email TEXT,
  original_exercise_name TEXT NOT NULL,
  new_exercise_name TEXT NOT NULL,
  exercise_index INTEGER NOT NULL,
  modification_type TEXT DEFAULT 'swap', -- 'swap', 'add', 'remove', 'reorder'
  workout_session_id UUID,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for coach lookups
CREATE INDEX IF NOT EXISTS idx_workout_modifications_coach
  ON workout_modifications(coach_email, created_at DESC);

-- Create index for client lookups
CREATE INDEX IF NOT EXISTS idx_workout_modifications_client
  ON workout_modifications(client_email, created_at DESC);

-- RLS Policies
ALTER TABLE workout_modifications ENABLE ROW LEVEL SECURITY;

-- Coaches can view their own modifications
CREATE POLICY "Coaches can view their modifications"
  ON workout_modifications FOR SELECT
  USING (coach_email = auth.email());

-- Coaches can insert modifications
CREATE POLICY "Coaches can create modifications"
  ON workout_modifications FOR INSERT
  WITH CHECK (coach_email = auth.email());

-- Function to increment exercise popularity
CREATE OR REPLACE FUNCTION increment_exercise_popularity(exercise_name TEXT)
RETURNS void AS $$
BEGIN
  UPDATE exercises
  SET popularity_score = popularity_score + 1
  WHERE name ILIKE exercise_name;
END;
$$ LANGUAGE plpgsql;
