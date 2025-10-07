import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Animated } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';
import Svg, { Path } from 'react-native-svg';

interface CustomVideoPlayerProps {
  videoUrl: string;
}

const PlayIcon = ({ size = 60, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Path d="M8 5v14l11-7z" />
  </Svg>
);

const PauseIcon = ({ size = 24, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Path d="M6 4h4v16H6zM14 4h4v16h-4z" />
  </Svg>
);

const FullscreenIcon = ({ size = 24, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </Svg>
);

export default function CustomVideoPlayer({ videoUrl }: CustomVideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showCenterPlay, setShowCenterPlay] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const centerPlayFadeAnim = useRef(new Animated.Value(1)).current;
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Auto-hide controls after 3 seconds when playing
    if (showControls && isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        hideControls();
      }, 3000);
    }

    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [showControls, isPlaying]);

  const hideControls = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowControls(false);
    });
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }

    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        hideControls();
      }, 3000);
    }
  };

  const handleVideoPress = () => {
    if (!showControls) {
      showControlsTemporarily();
    }
  };

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
        setShowCenterPlay(false);

        // Fade out center play button
        Animated.timing(centerPlayFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();

        // Auto-hide controls after 3 seconds when playing
        if (hideControlsTimeout.current) {
          clearTimeout(hideControlsTimeout.current);
        }
        hideControlsTimeout.current = setTimeout(() => {
          hideControls();
        }, 3000);
      }
    }
  };

  const handleFullscreen = async () => {
    if (videoRef.current) {
      await videoRef.current.presentFullscreenPlayer();
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);

      // Show center play button when video ends
      if (status.didJustFinish) {
        setShowCenterPlay(true);
        setShowControls(false);
        fadeAnim.setValue(0);
        centerPlayFadeAnim.setValue(1);
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleVideoPress}>
      <View style={styles.container}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode="contain"
          isLooping={false}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          useNativeControls={false}
        />

        {/* Center Play Button (shows when paused/stopped) */}
        {showCenterPlay && !isPlaying && (
          <Animated.View style={[styles.centerPlayButton, { opacity: centerPlayFadeAnim }]}>
            <TouchableOpacity
              style={styles.centerPlayTouchable}
              onPress={handlePlayPause}
              activeOpacity={0.8}
            >
              <View style={styles.centerPlayCircle}>
                <PlayIcon size={34} color="#fff" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Bottom Controls Bar */}
        {showControls && (
          <Animated.View style={[styles.controlsBar, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handlePlayPause}
              activeOpacity={0.7}
            >
              {isPlaying ? (
                <PauseIcon size={24} color="#fff" />
              ) : (
                <PlayIcon size={24} color="#fff" />
              )}
            </TouchableOpacity>

            <View style={styles.spacer} />

            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleFullscreen}
              activeOpacity={0.7}
            >
              <FullscreenIcon size={24} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  centerPlayButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  centerPlayTouchable: {
    padding: 20,
  },
  centerPlayCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(45, 219, 219, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  controlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  controlButton: {
    padding: 8,
  },
  spacer: {
    flex: 1,
  },
});
