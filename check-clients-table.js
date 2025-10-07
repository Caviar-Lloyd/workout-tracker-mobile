require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClientsTable() {
  console.log('Checking clients table structure...\n');

  // Try to get all clients
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error fetching clients:', error);
    return;
  }

  if (clients && clients.length > 0) {
    console.log('✓ Clients table exists!');
    console.log('\nColumns in clients table:');
    console.log('------------------------');
    Object.keys(clients[0]).forEach(col => {
      const sampleValue = clients[0][col];
      const type = typeof sampleValue;
      console.log(`  ${col}: ${type} = ${JSON.stringify(sampleValue)}`);
    });

    console.log('\n\nAll clients:');
    console.log('------------------------');
    clients.forEach(client => {
      console.log(`  ${client.email} - ${client.first_name || 'N/A'} ${client.last_name || ''}`);
    });
  } else {
    console.log('No clients found in table');
  }
}

checkClientsTable().catch(console.error);
