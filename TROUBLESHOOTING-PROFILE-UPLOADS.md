# Profile Picture Upload Fix - Troubleshooting Guide

**Date:** October 15, 2025
**Status:** ✅ RESOLVED
**Build Version:** 1.1.9+

---

## 🔴 The Problem

Profile pictures stopped working after implementing the camera feature:
- Users couldn't upload new images
- Previously uploaded images disappeared from the database
- Error messages varied: "BLOB doesn't exist", "multipart undefined", "RLS policy violation"

---

## 🎯 Root Cause Analysis

There were **THREE separate issues** compounding each other:

### Issue #1: Supabase Storage RLS Policies Missing ❌ (PRIMARY BLOCKER)

**What happened:**
- Created Supabase Storage bucket but never configured Row Level Security (RLS) policies
- Supabase was blocking ALL upload attempts with: `new row violates row-level security policy`
- Code worked in Expo Go (dev) but failed in production builds

**Why it was confusing:**
- Development environment (Expo Go) has looser security
- Error messages weren't clear about RLS being the issue
- Seemed like a code problem when it was infrastructure

**The Fix:**
Run this SQL in Supabase SQL Editor:

```sql
-- Allow authenticated users to upload profile pictures
CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'profile-pictures'
);

-- Allow authenticated users to update profile pictures
CREATE POLICY "Authenticated users can update profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'profile-pictures'
);

-- Allow authenticated users to delete old profile pictures
CREATE POLICY "Authenticated users can delete profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'profile-pictures'
);

-- Allow public read access
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

**What this enables:**
- ✅ Coaches can upload client profile pictures
- ✅ Clients can upload their own profile pictures
- ✅ Coaches can upload their own profile pictures
- ✅ Anyone can view profile pictures (public bucket)

---

### Issue #2: Blob API Doesn't Work in React Native Production ❌

**What happened:**
Original code used JavaScript `Blob` objects:

```typescript
// ❌ THIS DOESN'T WORK IN REACT NATIVE PRODUCTION
const blob = await new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.onload = () => resolve(xhr.response);
  xhr.open('GET', uri);
  xhr.send();
});
```

**Why it seemed to work:**
- ✅ Works in Expo Go (development)
- ✅ Works in web browsers
- ❌ **FAILS** in React Native production builds (Android/iOS APK)

**Error:** `BLOB doesn't exist`

**Why it failed:**
React Native production builds don't have full Blob API support - this is a fundamental React Native limitation.

---

### Issue #3: Deprecated FileSystem API in Expo SDK 54 ❌

**What happened:**
Tried using `FileSystem.readAsStringAsync()`:

```typescript
// ❌ THIS IS DEPRECATED IN EXPO SDK 54
import * as FileSystem from 'expo-file-system';

const base64 = await FileSystem.readAsStringAsync(uri, {
  encoding: 'base64',
});
```

**Error:** `Method readAsStringAsync imported from 'expo-file-system' is deprecated`

**Why it failed:**
Expo SDK 54 deprecated this API in favor of new `File` and `Directory` classes.

---

## ✅ The Final Solution

Replace the entire approach with **native JavaScript `fetch()` + `ArrayBuffer`**:

```typescript
const uploadImage = async (uri: string) => {
  try {
    setUploadingImage(true);

    // Step 1: Read file using native fetch (works in React Native)
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Step 2: Generate unique filename
    const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;

    // Step 3: Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, bytes, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Step 4: Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Step 5: Update profile in database
    const { error: updateError } = await supabase
      .from('clients')
      .update({ profile_picture_url: publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    setProfilePictureUrl(publicUrl);
    Alert.alert('Success', 'Profile picture updated successfully');
  } catch (error: any) {
    console.error('Error uploading image:', error);
    Alert.alert('Error', 'Failed to upload profile picture');
  } finally {
    setUploadingImage(false);
  }
};
```

### Why This Works ✅

1. **Native JavaScript** - No external libraries, no dependencies
2. **ArrayBuffer is supported** - Works in React Native production builds
3. **No deprecated APIs** - Uses modern fetch() standard
4. **Uint8Array format** - Supabase accepts this directly
5. **Recommended approach** - Supabase official documentation suggests this

---

## 📋 Checklist: Adding File Uploads in Future

When implementing file uploads in this project:

### 1️⃣ Supabase Storage Setup
- [ ] Create storage bucket in Supabase dashboard
- [ ] Set bucket to **public** if files should be publicly accessible
- [ ] **IMMEDIATELY** set up RLS policies (don't skip this!)
- [ ] Test upload with a dummy file in Supabase dashboard

### 2️⃣ Code Implementation
- [ ] Use `fetch(uri).arrayBuffer()` for React Native compatibility
- [ ] Convert to `Uint8Array` before uploading
- [ ] Use `upsert: true` to allow overwriting files
- [ ] Get public URL after upload
- [ ] Update database record with public URL

### 3️⃣ Testing
- [ ] Test in Expo Go (development)
- [ ] **CRITICAL:** Test in production build (not just Expo Go!)
- [ ] Test all user roles (coach uploading for client, client uploading for self, etc.)
- [ ] Verify images persist after app restart
- [ ] Verify images load from public URL

### 4️⃣ Deployment
- [ ] For JavaScript-only changes: Use `npx eas-cli update --branch preview`
- [ ] For native code changes: Use `npx eas-cli build`
- [ ] Commit working code to GitHub immediately
- [ ] Document any RLS policies in `database-migration-*.sql` files

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't use Blob API in React Native
```typescript
// DON'T DO THIS - doesn't work in production
const blob = new Blob([data]);
```

### ❌ Don't use deprecated FileSystem methods
```typescript
// DON'T DO THIS - deprecated in Expo SDK 54
await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
```

### ❌ Don't skip RLS policies
Always set up storage RLS policies immediately after creating a bucket.

### ❌ Don't only test in Expo Go
Expo Go has different capabilities than production builds. Always test critical features in actual builds.

---

## 📁 Files Modified (Reference)

**Build:** 1.1.9
**Commit:** `45919c8` - "Fix profile picture upload - use native fetch + ArrayBuffer"

### Changed Files:
1. **screens/ProfileScreen.tsx** - Client profile upload (line ~150-200)
2. **screens/ClientDetailScreen.tsx** - Coach uploading client profile (line ~200-250)
3. **database-migration-storage-bucket.sql** - RLS policies for Supabase Storage

### Key Dependencies:
- **React Native:** Built-in `fetch()` API
- **Supabase:** `@supabase/supabase-js`
- **No external libraries needed** for file upload

---

## 🔧 How to Verify It's Working

### Quick Test:
1. Open app on production build (not Expo Go)
2. Navigate to client details screen (as coach)
3. Tap profile picture → "Take Photo" or "Choose from Library"
4. Select/capture image
5. Should see "Success" alert
6. Image should persist after closing and reopening app

### Database Check:
```sql
-- Check recent profile picture uploads
SELECT id, email, profile_picture_url, updated_at
FROM clients
WHERE profile_picture_url IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;
```

### Storage Check:
```sql
-- Check uploaded files in storage
SELECT name, created_at, metadata
FROM storage.objects
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🆘 Troubleshooting New Issues

### If uploads fail with RLS error:
```bash
# Check RLS policies exist
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

### If images don't load:
1. Check bucket is set to **public** in Supabase dashboard
2. Verify `publicUrl` is being saved to database correctly
3. Test URL directly in browser - should show image

### If upload works in dev but not production:
1. Ensure you're using `fetch().arrayBuffer()` (not Blob)
2. Check environment variables are set in `eas.json`
3. Verify RLS policies allow the authenticated user

---

## 📚 References

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Storage RLS Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [React Native Fetch API](https://reactnative.dev/docs/network)
- [Expo FileSystem Migration Guide](https://docs.expo.dev/versions/latest/sdk/filesystem/)

---

## 💡 Key Takeaways

1. **Always check infrastructure first** - RLS policies, API keys, bucket settings
2. **React Native ≠ Web Browser** - Don't assume web APIs work the same
3. **Test in production builds** - Expo Go has different capabilities
4. **Use native APIs when possible** - Less dependencies, better compatibility
5. **Commit working code immediately** - Don't wait to preserve working state

---

**Last Updated:** October 15, 2025
**Author:** Carver Lloyd (with Claude Code assistance)
**Build Reference:** 1.1.9 (commit `45919c8`)
