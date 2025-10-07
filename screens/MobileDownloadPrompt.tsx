import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

const PhoneIcon = () => (
  <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2z"
      stroke="#2ddbdb"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 18h.01" stroke="#2ddbdb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function MobileDownloadPrompt() {
  const handleDownload = () => {
    // Detect iOS or Android
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      // Open App Store
      Linking.openURL('https://apps.apple.com/your-app-store-link');
    } else if (isAndroid) {
      // Open Google Play Store
      Linking.openURL('https://play.google.com/store/apps/your-play-store-link');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0e27', '#1a1f3a', '#2a1f3a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <PhoneIcon />

        <Text style={styles.title}>Get the Best Experience</Text>
        <Text style={styles.subtitle}>
          For the optimal mobile experience, we recommend downloading our native app
        </Text>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.featureText}>Faster performance</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.featureText}>Offline workout tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.featureText}>Push notifications</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.featureText}>Better mobile UI</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <Text style={styles.downloadButtonText}>Download App Now</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Available on iOS and Android
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 30,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  featuresList: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmark: {
    fontSize: 20,
    color: '#2ddbdb',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#e5e7eb',
  },
  downloadButton: {
    width: '100%',
    backgroundColor: '#2ddbdb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  downloadButtonText: {
    color: '#0a0e27',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
});
