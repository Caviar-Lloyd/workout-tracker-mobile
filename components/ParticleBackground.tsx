import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export default function ParticleBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    // Initialize particles - 35 particles
    const initialParticles: Particle[] = [];
    for (let i = 0; i < 35; i++) {
      initialParticles.push({
        x: Math.random() * SCREEN_WIDTH,
        y: Math.random() * SCREEN_HEIGHT,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.3 + 0.2,
      });
    }
    particlesRef.current = initialParticles;
    setParticles(initialParticles);

    // Update rate for testing
    const interval = setInterval(() => {
      const newParticles = particlesRef.current.map((p) => {
        let newX = p.x + p.vx;
        let newY = p.y + p.vy;
        let newVx = p.vx;
        let newVy = p.vy;

        // Bounce off edges
        if (newX <= 0 || newX >= SCREEN_WIDTH) {
          newVx = -p.vx;
          newX = newX <= 0 ? 0 : SCREEN_WIDTH;
        }
        if (newY <= 0 || newY >= SCREEN_HEIGHT) {
          newVy = -p.vy;
          newY = newY <= 0 ? 0 : SCREEN_HEIGHT;
        }

        return {
          ...p,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
        };
      });

      particlesRef.current = newParticles;
      setParticles(newParticles);
    }, 100); // 100ms interval

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        {/* Draw lines between nearby particles */}
        {particles.map((particle, i) =>
          particles.slice(i + 1).map((otherParticle, j) => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
              const lineOpacity = 0.3 * (1 - distance / 120);
              return (
                <Line
                  key={`line-${i}-${j}`}
                  x1={particle.x}
                  y1={particle.y}
                  x2={otherParticle.x}
                  y2={otherParticle.y}
                  stroke="#2ddbdb"
                  strokeWidth={1}
                  opacity={lineOpacity}
                />
              );
            }
            return null;
          })
        )}

        {/* Draw particles */}
        {particles.map((particle, i) => (
          <Circle
            key={`particle-${i}`}
            cx={particle.x}
            cy={particle.y}
            r={particle.size}
            fill="#2ddbdb"
            opacity={particle.opacity}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
});
