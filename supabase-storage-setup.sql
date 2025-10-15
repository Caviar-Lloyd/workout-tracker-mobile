-- Supabase Storage Bucket Setup for Profile Pictures
-- Date: 2025-10-14
-- Description: Creates 'avatars' bucket with proper RLS policies for profile picture uploads

-- Note: Run this in the Supabase SQL Editor

-- Create the avatars storage bucket (if not exists)
-- This should be done via the Supabase Dashboard UI:
-- 1. Go to Storage → Create Bucket
-- 2. Name: avatars
-- 3. Public: Yes (to allow public viewing of profile pictures)
-- 4. File size limit: 5MB
-- 5. Allowed MIME types: image/jpeg, image/png, image/webp

-- RLS Policies for the avatars bucket
-- These policies control who can upload, update, and delete profile pictures

-- Policy 1: Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-pictures'
);

-- Policy 2: Allow authenticated users to update their own profile pictures
CREATE POLICY "Users can update own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-pictures'
);

-- Policy 3: Allow authenticated users to delete their own profile pictures
CREATE POLICY "Users can delete own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-pictures'
);

-- Policy 4: Allow public access to view all profile pictures (for avatar display)
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
