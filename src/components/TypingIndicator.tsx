import React, { useRef, useEffect } from 'react';
import { View, Animated, Text } from 'react-native';
import { typingIndicatorStyles as s } from '../css/TypingIndicatorStyles';

const Dot = ({ delay }: { delay: number }) => {
  const anim = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.25, duration: 380, useNativeDriver: true }),
      ])
    ).start();
  }, [anim, delay]);
  
  return <Animated.View style={[s.dot, { opacity: anim }]} />;
};

export const TypingIndicator = ({ style }: { style?: any }) => (
  <View style={[s.assistantRow, style]}>
    <View style={s.avatar}><Text style={s.avatarText}>AI</Text></View>
    <View style={[s.bubble, s.assistantBubble, s.typingBubble]}>
      <Dot delay={0} /><Dot delay={140} /><Dot delay={280} />
    </View>
  </View>
);

