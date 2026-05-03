import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';
import { loadingScreenStyles as s } from '../css/LoadingScreenStyles';

interface LoadingScreenProps {
  label: string;
}

export const LoadingScreen = ({ label }: LoadingScreenProps) => (
  <View style={s.centerScreen}>
    <ActivityIndicator size="large" color={COLORS.accent} />
    <Text style={s.loadingLabel}>{label}</Text>
  </View>
);

