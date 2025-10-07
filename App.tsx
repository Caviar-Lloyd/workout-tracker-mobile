import { NavigationContainer, DefaultTheme, useNavigation, useNavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Text, Animated, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from './lib/supabase/client';
import { Session } from '@supabase/supabase-js';
import DashboardScreen from './screens/DashboardScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import ProgramScreen from './screens/ProgramScreen';
import ClientsScreen from './screens/ClientsScreen';
import ClientDetailScreen from './screens/ClientDetailScreen';
import AuthScreen from './screens/AuthScreen';
import ProfileCompletionScreen from './screens/ProfileCompletionScreen';
import DatabaseCheckScreen from './screens/DatabaseCheckScreen';
import MobileDownloadPrompt from './screens/MobileDownloadPrompt';
import ParticleBackground from './components/ParticleBackground';
import Svg, { Path } from 'react-native-svg';
import { SpeedInsights } from '@vercel/speed-insights/react';

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

const ArrowUpIcon = ({ size = 24, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" fill={color} />
  </Svg>
);

function ExpandableMenu() {
  const navigation = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(500)).current; // Start completely off-screen
  const bounceAnim = useRef(new Animated.Value(0)).current; // For arrow bounce
  const fadeAnim = useRef(new Animated.Value(1)).current; // For tooltip fade
  const [showTooltip, setShowTooltip] = useState(true);
  const insets = useSafeAreaInsets();
  const isNavigatingRef = useRef(false);

  // Animated arrow bounce effect
  useEffect(() => {
    if (showTooltip) {
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
  }, [showTooltip]);

  const toggleMenu = () => {
    // Don't toggle if currently navigating
    if (isNavigatingRef.current) return;

    // Hide tooltip when user interacts
    if (showTooltip) {
      setShowTooltip(false);
    }

    const toValue = menuOpen ? 500 : 0; // 400 = hidden off-screen, 0 = visible
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
      slideAnim.setValue(500);
      setMenuOpen(false);
    });
    await supabase.auth.signOut();
  };

  return (
    <>
      {/* Animated Arrow Tooltip */}
      {showTooltip && (
        <Animated.View
          style={[
            styles.tooltipContainer,
            {
              bottom: Math.max(insets.bottom, 20) + 30,
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
          { bottom: Math.max(insets.bottom, 20) + 10 } // Add 10px extra padding above navigation bar
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
            bottom: Math.max(insets.bottom, 20) + 70,
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
              slideAnim.setValue(500);
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
              slideAnim.setValue(500);
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
              slideAnim.setValue(500);
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
            slideAnim.stopAnimation(() => {
              slideAnim.setValue(500);
              setMenuOpen(false);
              navigateTo('Clients');
            });
          }}
        >
          <ClientsIcon size={22} color="#2ddbdb" />
          <Text style={styles.menuItemText}>My Clients</Text>
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
        <Stack.Screen name="Clients" component={ClientsScreen} />
        <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
      </Stack.Navigator>
      <ExpandableMenu />
    </>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);

  // Detect if user is on mobile browser - force app download
  useEffect(() => {
    if (Platform.OS === 'web') {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileBrowser = /iphone|ipad|ipod|android/.test(userAgent);

      if (isMobileBrowser) {
        setShowMobilePrompt(true);
      }
    }
  }, []);

  useEffect(() => {
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

    // Check if user has a client/coach profile by email
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (error || !client) {
      setNeedsProfileCompletion(true);
    } else if (!client.first_name || !client.last_name) {
      setNeedsProfileCompletion(true);
    } else {
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

  // Force mobile users to download app - no option to continue on web
  if (showMobilePrompt) {
    return (
      <SafeAreaProvider>
        <MobileDownloadPrompt />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <NavigationContainer theme={DarkTheme} linking={linking}>
            {!session ? (
              <AuthScreen />
            ) : needsProfileCompletion ? (
              <ProfileCompletionScreen />
            ) : (
              <AppNavigator />
            )}
          </NavigationContainer>
        </View>
        <StatusBar style="light" />
        {Platform.OS === "web" && <SpeedInsights />}
      </View>
    </SafeAreaProvider>
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
    position: 'absolute',
    ...(Platform.OS === 'web' ? {
      bottom: 20,
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
