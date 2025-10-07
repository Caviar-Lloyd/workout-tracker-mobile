import { supabase } from '../lib/supabase/client';

export const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

export const DEV_ACCOUNT = {
  email: 'dev@eccentriciron.com',
  password: 'devpassword123',
};

export async function autoDevLogin() {
  if (!DEV_MODE) return;

  try {
    console.log('[DEV MODE] Auto-logging in with dev account...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: DEV_ACCOUNT.email,
      password: DEV_ACCOUNT.password,
    });

    if (error) {
      console.log('[DEV MODE] Login failed, creating dev account...');
      // If dev account doesn't exist, create it
      const { error: signUpError } = await supabase.auth.signUp({
        email: DEV_ACCOUNT.email,
        password: DEV_ACCOUNT.password,
      });

      if (signUpError) {
        console.log('[DEV MODE] Account creation failed:', signUpError.message);
      } else {
        console.log('[DEV MODE] Dev account created successfully');
      }
    } else {
      console.log('[DEV MODE] Auto-login successful');
    }
  } catch (error) {
    console.log('[DEV MODE] Error:', error);
  }
}
