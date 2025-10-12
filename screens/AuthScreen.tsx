import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase/client';
import ParticleBackground from '../components/ParticleBackground';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

// Required for OAuth to work properly
WebBrowser.maybeCompleteAuthSession();

const GoogleLogo = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      // Try to sign in first
      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If user doesn't exist, create account automatically
      if (signInError?.message?.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: undefined,
          }
        });

        if (signUpError) throw signUpError;

        // Try signing in immediately (works if email confirmation is disabled)
        const { error: immediateSignInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!immediateSignInError) {
          Alert.alert('Success', 'Account created and signed in!');
          setLoading(false);
          return;
        }

        Alert.alert('Account Created', 'Please sign in with your credentials.');
        setLoading(false);
        return;
      }

      if (signInError) throw signInError;
      // Navigation and profile completion will happen automatically
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      let redirectTo: string;

      if (Platform.OS === 'web') {
        // For web, use the current domain
        redirectTo = typeof window !== 'undefined' ? window.location.origin : 'https://app.eccentriciron.com';

        const { data, error} = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
          },
        });

        if (error) throw error;
      } else {
        // For mobile APK, use the package-based redirect URI
        redirectTo = 'com.eccentriciron.workouttracker://auth';

        console.log('Mobile redirect URL:', redirectTo);

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        });

        if (error) throw error;

        if (data?.url) {
          console.log('Opening OAuth URL:', data.url);

          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectTo
          );

          console.log('Browser result:', result);

          if (result.type === 'success') {
            // Extract the URL from the result
            if ('url' in result && result.url) {
              // Parse the URL to get the session tokens
              const url = new URL(result.url);
              const accessToken = url.searchParams.get('access_token');
              const refreshToken = url.searchParams.get('refresh_token');

              if (accessToken && refreshToken) {
                // Set the session using the tokens
                const { error: sessionError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });

                if (sessionError) throw sessionError;
                console.log('Session created successfully');
              } else {
                Alert.alert('Sign In Failed', 'Could not extract authentication tokens');
              }
            }
          } else if (result.type === 'cancel') {
            Alert.alert('Cancelled', 'Google sign in was cancelled');
          }
        }

        setLoading(false);
      }
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      Alert.alert('Google Sign In Error', error.message);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ParticleBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
          <LinearGradient
            colors={['rgba(45, 219, 219, 0.1)', 'rgba(45, 219, 219, 0.05)']}
            style={styles.card}
          >
            <Image
              source={{ uri: 'https://storage.googleapis.com/msgsndr/z3m4mhravHce78P6jW12/media/67266bd09e9f000c92db2bce.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Sign In to Continue</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleEmailSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0a0e27" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={styles.googleLogoButton}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                <GoogleLogo />
              </TouchableOpacity>
            </View>

          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    width: '100%',
    maxWidth: 430,
  },
  logo: {
    width: 250,
    height: 100,
    alignSelf: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#2ddbdb',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  button: {
    backgroundColor: '#2ddbdb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0e27',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  switchTextBold: {
    color: '#2ddbdb',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: '#9ca3af',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  googleLogoButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
