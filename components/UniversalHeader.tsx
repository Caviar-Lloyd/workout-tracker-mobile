import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UniversalBreadcrumb from './UniversalBreadcrumb';

interface UniversalHeaderProps {
  title: string;
  showBreadcrumbs?: boolean; // Optional - defaults to true
}

export default function UniversalHeader({ title, showBreadcrumbs = true }: UniversalHeaderProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.header, {
      paddingTop: Math.max(insets.top, 10) + 5, // 5-10px from top of device
    }]}>
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f3a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});
