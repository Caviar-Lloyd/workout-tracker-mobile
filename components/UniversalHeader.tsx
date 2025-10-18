import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import UniversalBreadcrumb from './UniversalBreadcrumb';

interface UniversalHeaderProps {
  title: string;
  showBreadcrumbs?: boolean; // Optional - defaults to true
}

export default function UniversalHeader({ title, showBreadcrumbs = true }: UniversalHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      {showBreadcrumbs && <UniversalBreadcrumb />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f3a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});
