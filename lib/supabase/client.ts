import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://seybhemcarmdinrvazmn.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNleWJoZW1jYXJtZGlucnZhem1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MDUxMzksImV4cCI6MjA3MjE4MTEzOX0._JYrwr4bfXXz4XsYoZX6yuBfCo1Xvx9rWmMHaPt1lI8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
