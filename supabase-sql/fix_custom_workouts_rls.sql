-- Fix Row-Level Security policy for custom_workouts table
-- This allows authenticated users to INSERT their own custom workouts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own custom workouts" ON custom_workouts;
DROP POLICY IF EXISTS "Users can view their own custom workouts" ON custom_workouts;
DROP POLICY IF EXISTS "Users can update their own custom workouts" ON custom_workouts;
DROP POLICY IF EXISTS "Users can delete their own custom workouts" ON custom_workouts;

-- Enable RLS on custom_workouts table
ALTER TABLE custom_workouts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can INSERT their own custom workouts
-- Allows trainers to create workouts for clients (using client_email)
CREATE POLICY "Users can insert their own custom workouts"
ON custom_workouts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email = client_email
  )
  OR
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email = coach_email
  )
);

-- Policy: Users can SELECT their own custom workouts
-- Allows clients to view their workouts and trainers to view workouts they created
CREATE POLICY "Users can view their own custom workouts"
ON custom_workouts
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email = client_email
  )
  OR
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email = coach_email
  )
);

-- Policy: Users can UPDATE their own custom workouts
CREATE POLICY "Users can update their own custom workouts"
ON custom_workouts
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email = client_email
  )
  OR
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email = coach_email
  )
);

-- Policy: Users can DELETE their own custom workouts
CREATE POLICY "Users can delete their own custom workouts"
ON custom_workouts
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email = coach_email
  )
);
