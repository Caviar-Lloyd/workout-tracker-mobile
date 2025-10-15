-- Migration: Add profile picture URL to clients table
-- Date: 2025-10-14
-- Description: Adds support for profile pictures stored in Supabase Storage

-- Add profile_picture_url column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comment to document the new field
COMMENT ON COLUMN clients.profile_picture_url IS 'URL to profile picture stored in Supabase Storage (avatars bucket)';

-- Create index for faster queries on profile_picture_url
CREATE INDEX IF NOT EXISTS idx_clients_profile_picture_url ON clients(profile_picture_url);
