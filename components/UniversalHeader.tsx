import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

// Back Arrow Icon
const BackIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#2ddbdb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

interface BreadcrumbItem {
  label?: string;
  icon?: React.ReactNode;
  screen?: string;
}

interface UniversalHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
}

export default function UniversalHeader({
  title,
  subtitle,
  breadcrumbs,
  showBackButton = true,
  onBackPress,
  rightComponent,
}: UniversalHeaderProps) {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* Left: Back button + Breadcrumbs */}
      <View style={styles.headerLeft}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <BackIcon />
          </TouchableOpacity>
        )}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <View style={styles.breadcrumbContainer}>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                {item.screen ? (
                  <TouchableOpacity
                    onPress={() => navigation.navigate(item.screen as never)}
                    style={styles.breadcrumbButton}
                  >
                    {item.icon ? (
                      <View style={styles.breadcrumbIcon}>{item.icon}</View>
                    ) : (
                      <Text style={styles.breadcrumbLink}>{item.label}</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <>
                    {item.icon ? (
                      <View style={styles.breadcrumbIcon}>{item.icon}</View>
                    ) : (
                      <Text style={styles.breadcrumbCurrent}>{item.label}</Text>
                    )}
                  </>
                )}
                {index < breadcrumbs.length - 1 && (
                  <Text style={styles.breadcrumbSeparator}> / </Text>
                )}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>

      {/* Center: Title + Subtitle */}
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>

      {/* Right: Custom component (e.g., Edit button, Settings icon, etc.) */}
      <View style={styles.headerRight}>
        {rightComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 48,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  breadcrumbButton: {
    padding: 0,
  },
  breadcrumbIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 219, 219, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 219, 219, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breadcrumbLink: {
    color: '#2ddbdb',
    fontSize: 14,
    fontWeight: '600',
  },
  breadcrumbSeparator: {
    color: '#6b7280',
    fontSize: 14,
    marginHorizontal: 8,
  },
  breadcrumbCurrent: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '400',
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1, // Behind breadcrumbs and buttons
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 2,
  },
  headerRight: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});
