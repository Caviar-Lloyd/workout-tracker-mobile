-- Migration: Create avatars storage bucket for profile pictures
-- Date: 2025-10-15
-- Description: Creates public storage bucket for user profile pictures

-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- Public bucket
  5242880,  -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Create storage policy: Allow authenticated users to upload their own profile pictures
CREATE POLICY IF NOT EXISTS "Users can upload their own profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'profile-pictures'
);

-- Create storage policy: Allow authenticated users to update their own profile pictures
CREATE POLICY IF NOT EXISTS "Users can update their own profile pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'profile-pictures'
);

-- Create storage policy: Allow authenticated users to delete their own profile pictures
CREATE POLICY IF NOT EXISTS "Users can delete their own profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'profile-pictures'
);

-- Create storage policy: Allow public read access to all avatars
CREATE POLICY IF NOT EXISTS "Anyone can view profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
