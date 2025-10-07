require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking existing tables in Supabase...\n');
  console.log('URL:', supabaseUrl);

  // Check for clients table
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .limit(1);

  if (!clientsError) {
    console.log('✓ clients table exists');
    if (clients && clients.length > 0) {
      console.log('  Columns:', Object.keys(clients[0]).join(', '));
    }
  } else {
    console.log('✗ clients table does not exist:', clientsError.message);
  }

  // Check for user_profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);

  if (!profilesError) {
    console.log('✓ user_profiles table exists');
    if (profiles && profiles.length > 0) {
      console.log('  Columns:', Object.keys(profiles[0]).join(', '));
    }
  } else {
    console.log('✗ user_profiles table does not exist:', profilesError.message);
  }

  // Check for workout tables
  const { data: week1day1, error: workoutError } = await supabase
    .from('week1_day1_workout_tracking')
    .select('*')
    .limit(1);

  if (!workoutError) {
    console.log('✓ workout tables exist (week1_day1_workout_tracking found)');
    if (week1day1 && week1day1.length > 0) {
      console.log('  Columns:', Object.keys(week1day1[0]).join(', '));
    }
  } else {
    console.log('✗ workout tables do not exist:', workoutError.message);
  }
}

checkTables().catch(console.error);
