import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, TextStyle } from 'react-native';

interface AnimatedTokenProps {
  text: string;
  style?: StyleProp<TextStyle>;
}

export const AnimatedToken = React.memo(({ text, style }: AnimatedTokenProps) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 120,
        tension: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ⚠️ Must be Animated.View — transforms are silently ignored on
  // Animated.Text when nested inside a <Text> node. Wrapping in a
  // View gives us a real layout box that honours opacity + transform.
  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ scale }, { translateY }],
        alignSelf: 'flex-start',
      }}
    >
      <Animated.Text style={style}>{text}</Animated.Text>
    </Animated.View>
  );
});

AnimatedToken.displayName = 'AnimatedToken';