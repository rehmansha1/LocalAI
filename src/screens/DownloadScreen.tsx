import React, { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { DownloadState } from '../types';
import { downloadScreenStyles as s } from '../css/DownloadScreenStyles';
import { getModelsDirDisplay } from '../utils/storage';

interface DownloadScreenProps {
  state: DownloadState;
}

export const DownloadScreen = ({ state }: DownloadScreenProps) => {
  const barAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: state.progress,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [barAnim, state.progress]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={s.centerScreen}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <View style={s.dlIconRing}>
          <Text style={s.dlIconText}>↓</Text>
        </View>
      </Animated.View>
      <Text style={s.dlTitle}>{state.label}</Text>
      <Text style={s.dlSub}>{state.downloadedMB.toFixed(0)} / {state.totalMB.toFixed(0)} MB</Text>

      <View style={s.dlTrack}>
        <Animated.View style={[s.dlFill, { width: barWidth }]} />
      </View>
      <View style={s.dlRow}>
        <Text style={s.dlPct}>{Math.round(state.progress * 100)}%</Text>
        <Text style={s.dlNote}>Offline after this · stays on device</Text>
      </View>
      <View style={s.dlPathBadge}>
        <Text style={s.dlPathIcon}>📁</Text>
        <Text style={s.dlPathText}>{getModelsDirDisplay()}</Text>
      </View>
    </View>
  );
};

