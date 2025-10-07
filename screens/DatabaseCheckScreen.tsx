import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase/client';

export default function DatabaseCheckScreen() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    const logs: string[] = [];

    logs.push('=== CHECKING DATABASE STRUCTURE ===\n');

    // Test columns
    const testColumns = [
      'id', 'email', 'first_name', 'last_name', 'subscription_tier',
      'schedule_pattern', 'starting_day_of_week', 'current_week',
      'current_day', 'workout_schedule', 'user_id', 'created_at', 'updated_at'
    ];

    logs.push('CLIENTS TABLE COLUMNS:\n');

    for (const column of testColumns) {
      const { data, error } = await supabase
        .from('clients')
        .select(column)
        .limit(1);

      if (error) {
        if (error.message.includes('column') || error.code === '42703') {
          logs.push(`✗ ${column} - NOT EXISTS`);
        } else {
          logs.push(`? ${column} - Error: ${error.message}`);
        }
      } else {
        logs.push(`✓ ${column} - EXISTS`);
      }
    }

    // Try to read full data
    logs.push('\n\nREADING CLIENTS TABLE:\n');
    const { data: clients, error: readError } = await supabase
      .from('clients')
      .select('*')
      .limit(3);

    if (readError) {
      logs.push(`Error: ${readError.message}`);
    } else if (clients && clients.length > 0) {
      logs.push(`Found ${clients.length} clients`);
      logs.push(`Columns: ${Object.keys(clients[0]).join(', ')}`);
      logs.push('\nSample data:');
      clients.forEach(c => logs.push(`  - ${c.email || 'No email'}`));
    } else {
      logs.push('No clients found');
    }

    // Check RLS policies (can't query directly, but we can test access)
    logs.push('\n\nTESTING RLS POLICIES:\n');
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      logs.push(`Authenticated as: ${user.email}`);

      const { data: ownData, error: rlsError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email);

      if (rlsError) {
        logs.push(`RLS Error: ${rlsError.message}`);
      } else {
        logs.push(`✓ Can access own data (${ownData?.length || 0} rows)`);
      }
    } else {
      logs.push('Not authenticated - cannot test RLS');
    }

    setResults(logs);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Database Structure Check</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => { setLoading(true); checkDatabase(); }}
      >
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView}>
        {loading ? (
          <Text style={styles.text}>Loading...</Text>
        ) : (
          results.map((line, i) => (
            <Text key={i} style={styles.text}>{line}</Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2ddbdb',
    marginBottom: 20,
    marginTop: 40,
  },
  button: {
    backgroundColor: '#2ddbdb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#0a0e27',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  text: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
});
