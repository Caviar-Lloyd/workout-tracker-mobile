require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('Checking database structure...\n');

  // Method 1: Try to query clients table with various columns
  const testColumns = [
    'id', 'email', 'first_name', 'last_name', 'subscription_tier',
    'schedule_pattern', 'starting_day_of_week', 'current_week',
    'current_day', 'workout_schedule', 'user_id', 'created_at', 'updated_at'
  ];

  console.log('Testing which columns exist in clients table:\n');

  for (const column of testColumns) {
    const { data, error } = await supabase
      .from('clients')
      .select(column)
      .limit(1);

    if (error) {
      if (error.message.includes('column') || error.code === '42703') {
        console.log(`✗ ${column} - does NOT exist`);
      } else {
        console.log(`? ${column} - error: ${error.message}`);
      }
    } else {
      console.log(`✓ ${column} - exists`);
    }
  }

  // Check if we can read any data from clients
  console.log('\n\nAttempting to read from clients table:');
  const { data: clients, error: readError } = await supabase
    .from('clients')
    .select('*')
    .limit(3);

  if (readError) {
    console.log('Error reading clients:', readError.message);
  } else if (clients && clients.length > 0) {
    console.log('\nExisting columns in clients table:');
    console.log(Object.keys(clients[0]).join(', '));
    console.log(`\nSample data (${clients.length} rows):`);
    clients.forEach(c => console.log(`  - ${c.email}`));
  } else {
    console.log('No data in clients table');
  }
}

checkDatabaseStructure().catch(console.error);
