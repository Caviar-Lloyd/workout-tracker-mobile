-- Add workout preference columns to existing clients table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/aqhlshwlwxvutbzzhnpa/sql

-- Add phone column if not exists
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add last_name column if not exists (first_name should already exist)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add schedule pattern column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS schedule_pattern TEXT DEFAULT '6-1'
CHECK (schedule_pattern IN ('6-1', '3-1', '2-1', '1-1', 'custom'));

-- Add starting day of week column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS starting_day_of_week INTEGER DEFAULT 0
CHECK (starting_day_of_week >= 0 AND starting_day_of_week <= 6);

-- Add current week and day tracking
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS current_week INTEGER
CHECK (current_week >= 1 AND current_week <= 12);

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS current_day INTEGER
CHECK (current_day >= 1 AND current_day <= 6);

-- Add workout schedule as JSONB
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS workout_schedule JSONB DEFAULT '{}'::jsonb;

-- Add user_id to link with auth.users
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);

-- Enable Row Level Security if not already enabled
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own client data" ON clients;
DROP POLICY IF EXISTS "Users can update own client data" ON clients;
DROP POLICY IF EXISTS "Users can insert own client data" ON clients;

-- Create RLS policies for clients table
CREATE POLICY "Users can view own client data"
  ON clients FOR SELECT
  USING (auth.uid() = user_id OR email = auth.email());

CREATE POLICY "Users can update own client data"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id OR email = auth.email());

CREATE POLICY "Users can insert own client data"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id OR email = auth.email());

-- Update existing clients to link with auth users by email
UPDATE clients c
SET user_id = au.id
FROM auth.users au
WHERE c.email = au.email
AND c.user_id IS NULL;
