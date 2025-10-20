import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import Svg, { Path, Defs, RadialGradient, Stop, Image as SvgImage } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DNALoader() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 2) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;
  const helixRadius = 45;
  const segments = 20;
  const segmentHeight = 15;

  const renderStrand = (color: string, offset: number, isGlow: boolean) => {
    const points = [];
    for (let i = 0; i < segments; i++) {
      const angle = ((rotation + i * 36 + offset) * Math.PI) / 180;
      const x = centerX + Math.cos(angle) * helixRadius;
      const y = centerY - 150 + i * segmentHeight;
      points.push({ x, y, angle: (rotation + i * 36 + offset) });
    }

    return (
      <>
        <Path
          d={`M ${points[0].x} ${points[0].y} ${points.map(p => `L ${p.x} ${p.y}`).join(' ')}`}
          stroke={color}
          strokeWidth={isGlow ? 8 : 4}
          fill="none"
          strokeLinecap="round"
          opacity={isGlow ? 0.4 : 1}
        />
        {!isGlow && points.map((p, i) => (
          <SvgImage
            key={`logo-${color}-${i}`}
            x={p.x - 8}
            y={p.y - 8}
            width={16}
            height={16}
            href={require('../assets/logo-original.png')}
            opacity={1}
          />
        ))}
      </>
    );
  };

  const renderBasePairs = () => {
    const pairs = [];
    for (let i = 0; i < segments; i++) {
      const angle1 = ((rotation + i * 36) * Math.PI) / 180;
      const angle2 = ((rotation + i * 36 + 180) * Math.PI) / 180;

      const x1 = centerX + Math.cos(angle1) * helixRadius;
      const y = centerY - 150 + i * segmentHeight;
      const x2 = centerX + Math.cos(angle2) * helixRadius;

      const dist = Math.abs(Math.sin(angle1));
      if (dist > 0.3) {
        pairs.push(
          <Path
            key={`pair-${i}`}
            d={`M ${x1} ${y} L ${x2} ${y}`}
            stroke="#ffffff"
            strokeWidth="2"
            opacity={0.4 * dist}
          />
        );
      }
    }
    return pairs;
  };

  return (
    <View style={styles.container}>
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        <Defs>
          <RadialGradient id="cyanGlow" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#2ddbdb" stopOpacity="1" />
            <Stop offset="100%" stopColor="#2ddbdb" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="purpleGlow" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#9b59d6" stopOpacity="1" />
            <Stop offset="100%" stopColor="#9b59d6" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {renderBasePairs()}
        {renderStrand('#2ddbdb', 0, true)}
        {renderStrand('#2ddbdb', 0, false)}
        {renderStrand('#9b59d6', 180, true)}
        {renderStrand('#9b59d6', 180, false)}
      </Svg>

      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0e27',
  },
  loadingText: {
    position: 'absolute',
    bottom: 80,
    fontSize: 20,
    color: '#2ddbdb',
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: '#2ddbdb',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
