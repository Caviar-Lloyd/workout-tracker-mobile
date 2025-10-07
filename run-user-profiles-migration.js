require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running user_profiles migration...');

  const sqlPath = path.join(__dirname, 'supabase-user-profiles-migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Note: This won't work with the anon key - you need to run this in Supabase SQL Editor
  console.log('\n===========================================');
  console.log('IMPORTANT: Copy the SQL below and run it in your Supabase SQL Editor');
  console.log('Dashboard: https://supabase.com/dashboard/project/aqhlshwlwxvutbzzhnpa/sql');
  console.log('===========================================\n');
  console.log(sql);
  console.log('\n===========================================');
  console.log('After running the SQL, the user_profiles table will be created.');
  console.log('===========================================\n');
}

runMigration().catch(console.error);
