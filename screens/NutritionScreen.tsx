import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UniversalHeader from '../components/UniversalHeader';

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <UniversalHeader title="Nutrition" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Platform.OS === 'web' ? 100 : Math.max(insets.bottom, 20) + 80,
            paddingTop: 100, // Space for fixed header
          }
        ]}
      >
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonIcon}>🍎</Text>
          <Text style={styles.comingSoonTitle}>Nutrition Tracking</Text>
          <Text style={styles.comingSoonSubtitle}>Coming Soon</Text>
          <Text style={styles.comingSoonDescription}>
            We're building a comprehensive nutrition tracking system that will help you:
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Track daily macros and calories</Text>
            <Text style={styles.featureItem}>• Log meals and snacks</Text>
            <Text style={styles.featureItem}>• View nutrition trends over time</Text>
            <Text style={styles.featureItem}>• Sync with your workout plan</Text>
            <Text style={styles.featureItem}>• Get personalized meal recommendations</Text>
          </View>
          <Text style={styles.stayTuned}>Stay tuned for updates!</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  comingSoonIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: 20,
    color: '#2ddbdb',
    marginBottom: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featureList: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(45, 219, 219, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.2)',
  },
  featureItem: {
    fontSize: 15,
    color: '#d1d5db',
    marginBottom: 12,
    lineHeight: 22,
  },
  stayTuned: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
