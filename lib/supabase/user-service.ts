import { supabase } from './client';

export interface UserProfile {
  id?: number;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name?: string | null;
  subscription_tier?: string;
  rest_days?: number[];
  program_start_date?: string | null;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  console.log('getUserProfile called with userId:', userId);

  // Get user email from auth
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Auth user email:', user?.email);

  if (!user?.email) {
    console.error('No user email found');
    return null;
  }

  // Query by email (since clients table doesn't have user_id column)
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('email', user.email)
    .single();

  console.log('Query result:', { data, error });

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  console.log('Returning profile data:', data);
  return data;
}

export async function createUserProfile(
  userId: string,
  email: string,
  firstName: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('clients')
    .insert([
      {
        user_id: userId,
        email,
        first_name: firstName,
        subscription_tier: 'client',
        rest_days: [],
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    return null;
  }

  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'email' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  // Get user email from auth (since clients table doesn't have user_id column)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    console.error('No user email found');
    return false;
  }

  const { error } = await supabase
    .from('clients')
    .update(updates)
    .eq('email', user.email);

  if (error) {
    console.error('Error updating user profile:', error);
    return false;
  }

  return true;
}

// Deprecated functions removed - use direct supabase updates for rest_days and program_start_date instead
