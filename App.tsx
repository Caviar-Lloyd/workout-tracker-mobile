import { NavigationContainer, DefaultTheme, useNavigation, useNavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Text, Animated, Dimensions, ActivityIndicator, Platform, StatusBar as RNStatusBar, Pressable } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from './lib/supabase/client';
import { Session } from '@supabase/supabase-js';
import DashboardScreen from './screens/DashboardScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import ProgramScreen from './screens/ProgramScreen';
import ProgressScreen from './screens/ProgressScreen';
import ClientsScreen from './screens/ClientsScreen';
import ClientDetailScreen from './screens/ClientDetailScreen';
import CustomWorkoutBuilderScreen from './screens/CustomWorkoutBuilderScreen';
import AuthScreen from './screens/AuthScreen';
import ProfileCompletionScreen from './screens/ProfileCompletionScreen';
import NutritionScreen from './screens/NutritionScreen';
import DatabaseCheckScreen from './screens/DatabaseCheckScreen';
import DNALoader from './components/DNALoader';
import ParticleBackground from './components/ParticleBackground';
import Svg, { Path } from 'react-native-svg';
import { SpeedInsights } from '@vercel/speed-insights/react';
import * as NavigationBar from 'expo-navigation-bar';
import { LoadingProvider, useLoading } from './contexts/LoadingContext';

const Stack = createNativeStackNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2ddbdb',
    background: '#0a0e27',
    card: '#0a0e27',
    text: '#ffffff',
    border: 'rgba(255,255,255,0.1)',
    notification: '#2ddbdb',
  },
};

// Premium SVG Icons
const DashboardIcon = ({ size = 24, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill={color} />
  </Svg>
);

const ProgramIcon = ({ size = 24, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill={color} />
  </Svg>
);

const WorkoutIcon = ({ size = 24, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z" fill={color} />
  </Svg>
);

const LogoutIcon = ({ size = 24, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill={color} />
  </Svg>
);

const ClientsIcon = ({ size = 24, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill={color} />
  </Svg>
);

const CustomWorkoutIcon = ({ size = 24, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z" fill={color} />
  </Svg>
);

const ArrowUpIcon = ({ size = 24, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" fill={color} />
  </Svg>
);

const ProgressIcon = ({ size = 24, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" fill={color} />
  </Svg>
);

const SettingsIcon = ({ size = 24, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15a3 3 0 100-6 3 3 0 000 6z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const NutritionIcon = ({ size = 24, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill={color} />
  </Svg>
);

function BottomTabBar() {
  const navigation = useNavigation();
  const { isDashboardLoading } = useLoading();
  const insets = useSafeAreaInsets();
  const [isCoach, setIsCoach] = useState(false);
  const currentRoute = useNavigationState(state => state?.routes[state.index]?.name || 'Dashboard');

  // Check if user is a coach
  useEffect(() => {
    const checkCoachStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: profile } = await supabase
            .from('clients')
            .select('is_coach')
            .eq('email', user.email)
            .single();

          if (profile) {
            setIsCoach(profile.is_coach === true);
          }
        }
      } catch (error) {
        console.error('Error checking coach status:', error);
      }
    };

    checkCoachStatus();
  }, []);

  if (isDashboardLoading) {
    return null;
  }

  const navigateTo = (screen: string) => {
    // @ts-ignore
    navigation.reset({
      index: 0,
      routes: [{ name: screen }],
    });
  };

  const tabs = [
    { name: 'Dashboard', label: 'Home', icon: DashboardIcon, screen: 'Dashboard' },
    { name: 'Program', label: 'Program', icon: ProgramIcon, screen: 'Program' },
    { name: 'Progress', label: 'Progress', icon: ProgressIcon, screen: 'Progress' },
    ...(isCoach ? [{ name: 'Clients', label: 'Clients', icon: ClientsIcon, screen: 'Clients' }] : []),
  ];

  return (
    <View
      style={[
        styles.tabBar,
        {
          paddingBottom: Math.max(insets.bottom, 12),
        }
      ]}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentRoute === tab.name;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => navigateTo(tab.screen)}
            activeOpacity={0.7}
          >
            <Icon size={24} color={isActive ? '#2ddbdb' : '#6b7280'} />
            <Text style={[
              styles.tabLabel,
              isActive && styles.tabLabelActive
            ]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AppNavigator() {
  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0e27' }
        }}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Program" component={ProgramScreen} />
        <Stack.Screen name="Workout" component={WorkoutScreen} />
        <Stack.Screen name="Progress" component={ProgressScreen} />
        <Stack.Screen name="Nutrition" component={NutritionScreen} />
        <Stack.Screen name="Clients" component={ClientsScreen} />
        <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
        <Stack.Screen name="CustomWorkoutBuilder" component={CustomWorkoutBuilderScreen} />
      </Stack.Navigator>
      <BottomTabBar />
    </>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [navBarVisible, setNavBarVisible] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Toggle navigation bar visibility
  const toggleNavBar = async () => {
    const newVisibility = !navBarVisible;
    setNavBarVisible(newVisibility);

    if (Platform.OS === 'android') {
      await NavigationBar.setVisibilityAsync(newVisibility ? "visible" : "hidden");

      // Auto-hide after 3 seconds if shown
      if (newVisibility) {
        setTimeout(async () => {
          setNavBarVisible(false);
          await NavigationBar.setVisibilityAsync("hidden");
        }, 3000);
      }
    }
  };

  // Handle double-tap detection
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      toggleNavBar();
    }

    lastTapRef.current = now;
  };

  useEffect(() => {
    // Configure Android system UI
    if (Platform.OS === 'android') {
      // Keep status bar hidden for full-screen experience
      RNStatusBar.setHidden(true);

      // Hide navigation bar by default
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBackgroundColorAsync("#00000000"); // Transparent
      NavigationBar.setBehaviorAsync("overlay-swipe");
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkProfileCompletion(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkProfileCompletion(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfileCompletion = async (session: Session | null) => {
    if (!session) {
      setLoading(false);
      setNeedsProfileCompletion(false);
      return;
    }

    try {
      console.log('🔍 Checking profile for:', session.user.email);

      // Simplified: Just check if profile exists, don't auto-create
      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', session.user.email)
        .maybeSingle();

      console.log('Profile check result:', { client, error });

      // Always let them into dashboard - they'll complete profile there via modal if needed
      setNeedsProfileCompletion(false);
    } catch (error) {
      console.error('Profile check error:', error);
      // On error, still let them into dashboard
      setNeedsProfileCompletion(false);
    } finally {
      // ALWAYS set loading to false
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <DNALoader />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  const linking = {
    prefixes: ['workouttracker://'],
    config: {
      screens: {
        Dashboard: 'dashboard',
        Program: 'program',
        Workout: 'workout',
        Clients: 'clients',
      },
    },
  };

  return (
    <LoadingProvider>
    <SafeAreaProvider>
      <Pressable onPress={handleDoubleTap} style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.contentWrapper}>
            <NavigationContainer theme={DarkTheme} linking={linking}>
              {!session ? (
                <AuthScreen />
              ) : (
                <AppNavigator />
              )}
            </NavigationContainer>
          </View>
          <StatusBar style="light" />
          {Platform.OS === "web" && <SpeedInsights />}
        </View>
      </Pressable>
    </SafeAreaProvider>
    </LoadingProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 768 : undefined,
    alignSelf: 'center',
    ...(Platform.OS === 'web' && {
      minHeight: '100vh',
    }),
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchTriggerArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 99,
  },
  touchBreadcrumbHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(10, 14, 39, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 219, 219, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  breadcrumbList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbItem: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  breadcrumbSeparator: {
    marginHorizontal: 8,
  },
  breadcrumbLink: {
    fontSize: 14,
    color: '#2ddbdb',
    fontWeight: '500',
  },
  breadcrumbCurrent: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '400',
  },
  // Bottom Tab Bar - Equinox Style
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 8,
    paddingHorizontal: 8,
    zIndex: 1000,
    ...(Platform.OS === 'web' && {
      maxWidth: 768,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#2ddbdb',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: '#2ddbdb',
    borderRadius: 1,
  },
});
