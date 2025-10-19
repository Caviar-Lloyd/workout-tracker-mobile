import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Text } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { DashboardIcon, CustomWorkoutIcon, ChevronRightIcon } from './Icons';
import Svg, { Path } from 'react-native-svg';

// Icon components for each screen
const ProgramIcon = ({ size = 18, color = '#2ddbdb' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill={color} />
  </Svg>
);

const WorkoutIcon = ({ size = 18, color = '#2ddbdb' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z" fill={color} />
  </Svg>
);

const ProgressIcon = ({ size = 18, color = '#2ddbdb' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" fill={color} />
  </Svg>
);

const ClientsIcon = ({ size = 18, color = '#2ddbdb' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill={color} />
  </Svg>
);

const ProfileIcon = ({ size = 18, color = '#2ddbdb' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill={color} />
  </Svg>
);

// Screen-to-icon mapping
const SCREEN_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Dashboard: DashboardIcon,
  Program: ProgramIcon,
  Workout: WorkoutIcon,
  Progress: ProgressIcon,
  Clients: ClientsIcon,
  ClientDetail: ProfileIcon,
  CustomWorkoutBuilder: CustomWorkoutIcon,
  Profile: ProfileIcon,
};

// Screen display names
const SCREEN_NAMES: Record<string, string> = {
  Dashboard: 'Dashboard',
  Program: 'Program',
  Workout: 'Workout',
  Progress: 'Progress',
  Clients: 'My Clients',
  ClientDetail: 'Client Profile',
  CustomWorkoutBuilder: 'Workout Builder',
  Profile: 'Profile',
};

interface UniversalBreadcrumbProps {
  currentScreenTitle?: string; // Optional override for current screen title
}

export default function UniversalBreadcrumb({ currentScreenTitle }: UniversalBreadcrumbProps) {
  const navigation = useNavigation();

  // Get navigation history from navigation state
  const routes = useNavigationState(state => state?.routes || []);

  // Build breadcrumb trail from navigation history
  let breadcrumbTrail = routes.map(route => ({
    name: route.name,
    params: route.params,
  }));

  // ALWAYS ensure Dashboard is in the trail if not already present
  const hasDashboard = breadcrumbTrail.some(r => r.name === 'Dashboard');
  if (!hasDashboard && breadcrumbTrail.length > 0) {
    breadcrumbTrail = [{ name: 'Dashboard', params: undefined }, ...breadcrumbTrail];
  }

  // Get current route (last in array)
  const currentRoute = breadcrumbTrail[breadcrumbTrail.length - 1];

  const handleBreadcrumbPress = (index: number) => {
    if (index === breadcrumbTrail.length - 1) {
      // Current page - do nothing
      return;
    }

    // Navigate back to the selected screen
    const targetRoute = breadcrumbTrail[index];

    // Go back the correct number of times
    const stepsBack = breadcrumbTrail.length - 1 - index;
    for (let i = 0; i < stepsBack; i++) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.breadcrumb}>
      {breadcrumbTrail.map((route, index) => {
        const IconComponent = SCREEN_ICONS[route.name] || DashboardIcon;
        const isLast = index === breadcrumbTrail.length - 1;
        const isCurrent = isLast;

        // Special handling for ClientDetail - show profile picture if available
        const isClientDetail = route.name === 'ClientDetail';
        const clientPhotoUrl = isClientDetail ? (route.params as any)?.clientPhotoUrl : null;
        const clientName = isClientDetail ? (route.params as any)?.clientName : null;

        return (
          <React.Fragment key={index}>
            <TouchableOpacity
              onPress={() => handleBreadcrumbPress(index)}
              style={styles.breadcrumbItem}
              disabled={isCurrent}
            >
              {isClientDetail && clientPhotoUrl ? (
                <Image source={{ uri: clientPhotoUrl }} style={styles.breadcrumbProfilePic} />
              ) : isClientDetail && clientName ? (
                <View style={styles.breadcrumbInitials}>
                  <Text style={styles.breadcrumbInitialsText}>
                    {clientName.split(' ').map((n: string) => n[0]).join('')}
                  </Text>
                </View>
              ) : (
                <IconComponent size={18} color={isCurrent ? '#9ca3af' : '#2ddbdb'} />
              )}
            </TouchableOpacity>

            {!isLast && <ChevronRightIcon size={14} color="#6b7280" />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbItem: {
    padding: 4,
  },
  breadcrumbProfilePic: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2a2f4a',
  },
  breadcrumbInitials: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2a2f4a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breadcrumbInitialsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2ddbdb',
  },
});
