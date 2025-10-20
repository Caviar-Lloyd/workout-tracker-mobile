import { NavigationContainer, DefaultTheme, useNavigation, useNavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Text, Animated, Dimensions, ActivityIndicator, Platform, StatusBar as RNStatusBar } from 'react-native';
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
import DatabaseCheckScreen from './screens/DatabaseCheckScreen';
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

function ExpandableMenu() {
  const navigation = useNavigation();
  const { isDashboardLoading } = useLoading();
  const [menuOpen, setMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(700)).current; // Start completely off-screen (7 items × 48px + padding + borders = ~336-400px, use 700 to be safe)
  const bounceAnim = useRef(new Animated.Value(0)).current; // For arrow bounce
  const fadeAnim = useRef(new Animated.Value(1)).current; // For tooltip fade
  const [showTooltip, setShowTooltip] = useState(true);
  const insets = useSafeAreaInsets();
  const isNavigatingRef = useRef(false);
  const [isCoach, setIsCoach] = useState(false);

  // Check if user is a coach
  useEffect(() => {
    const checkCoachStatus = async () => {
      try {
        console.log('🔍 Checking coach status...');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('User email:', user?.email);

        if (user?.email) {
          const { data: profile, error } = await supabase
            .from('clients')
            .select('is_coach')
            .eq('email', user.email)
            .single();

          console.log('Coach status query result:', { profile, error });

          if (profile) {
            console.log('Setting isCoach to:', profile.is_coach === true);
            setIsCoach(profile.is_coach === true);
          } else {
            console.log('No profile found, defaulting to false');
            setIsCoach(false);
          }
        }
      } catch (error) {
        console.error('Error checking coach status:', error);
        setIsCoach(false);
      }
    };

    checkCoachStatus();
  }, []);

  // Animated arrow bounce effect - only run when menu is visible
  useEffect(() => {
    if (showTooltip && !isDashboardLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -10,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Auto-hide tooltip after 5 seconds
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setShowTooltip(false));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showTooltip, isDashboardLoading]);

  const toggleMenu = () => {
    // Don't toggle if currently navigating
    if (isNavigatingRef.current) return;

    // Hide tooltip when user interacts
    if (showTooltip) {
      setShowTooltip(false);
    }

    const toValue = menuOpen ? 700 : 0; // 700 = hidden off-screen, 0 = visible
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
    setMenuOpen(!menuOpen);
  };

  const navigateTo = (screen: string) => {
    // Prevent multiple rapid navigations
    if (isNavigatingRef.current) return;

    isNavigatingRef.current = true;

    // @ts-ignore
    navigation.reset({
      index: 0,
      routes: [{ name: screen }],
    });

    // Reset navigation flag after a short delay
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 300);
  };

  const handleLogout = async () => {
    slideAnim.stopAnimation(() => {
      slideAnim.setValue(700);
      setMenuOpen(false);
    });
    await supabase.auth.signOut();
  };

  // Don't render until visible
  if (isDashboardLoading) {
    return null;
  }

  return (
    <>
      {/* Animated Arrow Tooltip */}
      {showTooltip && (
        <Animated.View
          style={[
            styles.tooltipContainer,
            {
              bottom: Platform.OS === 'web' ? 50 : Math.max(insets.bottom, 20) + 30,
              position: Platform.OS === 'web' ? 'fixed' : 'absolute',
              opacity: fadeAnim,
              transform: [{ translateY: bounceAnim }],
            },
          ]}
        >
          <ArrowUpIcon size={28} color="#2ddbdb" />
          <Text style={styles.tooltipText}>Menu</Text>
        </Animated.View>
      )}

      {/* Menu Button with Holographic Effect */}
      <TouchableOpacity
        style={[
          styles.menuButton,
          Platform.OS !== 'web' && { bottom: Math.max(insets.bottom, 20) } // Reduced by 10px padding
        ]}
        onPress={toggleMenu}
        hitSlop={{ top: 40, bottom: 40, left: 40, right: 40 }} // Larger touch area - 40px all around
      >
        <View style={styles.menuBarGlow} />
        <View style={styles.menuBar} />
      </TouchableOpacity>

      {/* Slide-up Menu */}
      <Animated.View
        style={[
          styles.slideMenu,
          {
            transform: [{ translateY: slideAnim }],
            bottom: Math.max(insets.bottom, 20) + 50,
            zIndex: 1001,
          },
        ]}
        pointerEvents={menuOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          delayPressIn={0}
          onPressIn={() => {
            // Close menu synchronously before anything else
            slideAnim.stopAnimation(() => {
              slideAnim.setValue(700);
              setMenuOpen(false);
              navigateTo('Dashboard');
            });
          }}
        >
          <DashboardIcon size={22} color="#2ddbdb" />
          <Text style={styles.menuItemText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          delayPressIn={0}
          onPressIn={() => {
            // Close menu synchronously before anything else
            slideAnim.stopAnimation(() => {
              slideAnim.setValue(700);
              setMenuOpen(false);
              navigateTo('Program');
            });
          }}
        >
          <ProgramIcon size={22} color="#2ddbdb" />
          <Text style={styles.menuItemText}>Program Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          delayPressIn={0}
          onPressIn={() => {
            // Close menu synchronously before anything else
            slideAnim.stopAnimation(() => {
              slideAnim.setValue(700);
              setMenuOpen(false);
              navigateTo('Workout');
            });
          }}
        >
          <WorkoutIcon size={22} color="#2ddbdb" />
          <Text style={styles.menuItemText}>Workout Tracker</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          delayPressIn={0}
          onPressIn={() => {
            // Close menu synchronously before anything else
            slideAnim.stopAnimation(() => {
              slideAnim.setValue(700);
              setMenuOpen(false);
              navigateTo('Progress');
            });
          }}
        >
          <ProgressIcon size={22} color="#2ddbdb" />
          <Text style={styles.menuItemText}>Progress</Text>
        </TouchableOpacity>

        {/* Only show My Clients for coaches/trainers */}
        {isCoach && (
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            delayPressIn={0}
            onPressIn={() => {
              slideAnim.stopAnimation(() => {
                slideAnim.setValue(700);
                setMenuOpen(false);
                navigateTo('Clients');
              });
            }}
          >
            <ClientsIcon size={22} color="#2ddbdb" />
            <Text style={styles.menuItemText}>My Clients</Text>
          </TouchableOpacity>
        )}

        {/* Only show Custom Workout Builder for coaches/trainers */}
        {isCoach && (
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            delayPressIn={0}
            onPressIn={() => {
              slideAnim.stopAnimation(() => {
                slideAnim.setValue(700);
                setMenuOpen(false);
                navigateTo('CustomWorkoutBuilder');
              });
            }}
          >
            <CustomWorkoutIcon size={22} color="#2ddbdb" />
            <Text style={styles.menuItemText}>Workout Builder</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          delayPressIn={0}
          onPressIn={() => {
            slideAnim.stopAnimation(() => {
              slideAnim.setValue(700);
              setMenuOpen(false);
              // Navigate to Dashboard with a param to open settings
              navigation.navigate('Dashboard', { openSettings: true });
            });
          }}
        >
          <SettingsIcon size={22} color="#2ddbdb" />
          <Text style={styles.menuItemText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          delayPressIn={0}
          onPress={handleLogout}
        >
          <LogoutIcon size={22} color="#2ddbdb" />
          <Text style={styles.menuItemText}>Logout</Text>
        </TouchableOpacity>

      </Animated.View>
    </>
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
        <Stack.Screen name="Clients" component={ClientsScreen} />
        <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
        <Stack.Screen name="CustomWorkoutBuilder" component={CustomWorkoutBuilderScreen} />
      </Stack.Navigator>
      <ExpandableMenu />
    </>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  useEffect(() => {
    // Configure Android system UI
    if (Platform.OS === 'android') {
      // Keep status bar hidden for full-screen experience
      RNStatusBar.setHidden(true);

      // Show navigation bar but make it transparent so we can control padding
      NavigationBar.setVisibilityAsync("visible");
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

      // Check if user has a client/coach profile by email with 8 second timeout
      const profileCheckPromise = supabase
        .from('clients')
        .select('*')
        .eq('email', session.user.email)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile check timeout')), 8000)
      );

      const { data: client, error } = await Promise.race([
        profileCheckPromise,
        timeoutPromise
      ]) as any;

      console.log('Profile check result:', { client, error });

      // If user doesn't exist at all, auto-create a basic profile and let them into dashboard
      if (!client || error?.code === 'PGRST116') {
        console.log('🆕 User not found in clients table - auto-creating profile');

        try {
          // Set program start date to today
          const today = new Date().toISOString().split('T')[0];

          const { data: newClient, error: insertError } = await supabase
            .from('clients')
            .insert({
              email: session.user.email,
              subscription_tier: 'client',
              rest_days: [], // Empty array = no rest days initially
              program_start_date: today,
              first_name: '',  // Explicitly set empty string to avoid NOT NULL constraint
              last_name: '',   // Will be filled in via profile modal
              is_coach: false, // New users are clients by default
            })
            .select()
            .single();

          console.log('Auto-create result:', { newClient, insertError });

          // Always let them into dashboard - they'll complete profile there via modal
          setNeedsProfileCompletion(false);
        } catch (createError) {
          console.error('Exception auto-creating profile:', createError);
          // Still let them into dashboard
          setNeedsProfileCompletion(false);
        }
      } else {
        // User exists - always let them into dashboard (modal will handle completion)
        console.log('✅ User profile found, proceeding to dashboard');
        setNeedsProfileCompletion(false);
      }
    } catch (error) {
      // On timeout, let them into dashboard
      console.log('Profile check timed out, allowing access');
      setNeedsProfileCompletion(false);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#2ddbdb" />
          <StatusBar style="light" />
        </View>
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
  tooltipContainer: {
    position: 'absolute',
    left: '25%',
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
    flexDirection: 'column',
    gap: 4,
  },
  tooltipText: {
    fontSize: 14,
    color: '#2ddbdb',
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(45, 219, 219, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  menuButton: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute', // Fixed to viewport on web
    ...(Platform.OS === 'web' ? {
      bottom: 10, // Positioned between content and Samsung navigation bar
      left: '50%',
      transform: [{ translateX: '-50%' }],
      width: 384, // 50% of 768px max-width
    } : {
      bottom: 20,
      left: '25%',
      width: '50%',
    }),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  menuBarGlow: {
    position: 'absolute',
    width: '100%',
    height: 5,
    backgroundColor: '#2ddbdb',
    borderRadius: 10,
    opacity: 0.4,
    shadowColor: '#2ddbdb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  menuBar: {
    width: '100%',
    height: 5,
    backgroundColor: '#2ddbdb',
    borderRadius: 10,
    shadowColor: '#2ddbdb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  slideMenu: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 80,
    backgroundColor: 'rgba(10, 14, 39, 0.85)',
    borderWidth: 2,
    borderColor: 'rgba(45, 219, 219, 0.4)',
    borderRadius: 20,
    zIndex: 1001,
    overflow: 'hidden',
    shadowColor: '#2ddbdb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }),
  },
  menuItem: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 17,
    color: '#fff',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
