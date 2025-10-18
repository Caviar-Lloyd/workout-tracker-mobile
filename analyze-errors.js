const { createClient } = require('./node_modules/@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function analyzeErrors() {
  // Get total count
  const { count, error: countError } = await supabase
    .from('error_logs')
    .select('*', { count: 'exact', head: true });

  console.log('Total errors:', count);

  // Get sample of recent errors
  const { data, error } = await supabase
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.log('Query error:', error);
  } else if (data && data.length > 0) {
    console.log('\n=== SAMPLE OF RECENT ERRORS ===');
    data.forEach((err, i) => {
      console.log(`\n[${i+1}] Error at ${err.created_at}`);
      console.log(`Screen: ${err.screen_name || 'Unknown'}`);
      console.log(`User: ${err.user_email || 'Unknown'}`);
      console.log(`Message: ${err.error_message}`);
      if (err.error_stack) {
        console.log(`Stack: ${err.error_stack.substring(0, 200)}...`);
      }
    });

    // Group by error message to find patterns
    const { data: allErrors } = await supabase
      .from('error_logs')
      .select('error_message, screen_name')
      .order('created_at', { ascending: false })
      .limit(500);

    const messageCounts = {};
    allErrors.forEach(err => {
      const key = `${err.error_message || 'Unknown'}`;
      if (!messageCounts[key]) {
        messageCounts[key] = { count: 0, screens: new Set() };
      }
      messageCounts[key].count++;
      if (err.screen_name) messageCounts[key].screens.add(err.screen_name);
    });

    console.log('\n=== ERROR SUMMARY (grouped by message) ===');
    Object.entries(messageCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([msg, info]) => {
        console.log(`\n[${info.count}x] ${msg.substring(0, 150)}`);
        console.log(`   Screens: ${Array.from(info.screens).join(', ')}`);
      });
  } else {
    console.log('No errors found in database');
  }
}

analyzeErrors().catch(console.error);
