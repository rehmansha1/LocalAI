import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { errorScreenStyles as s } from '../css/ErrorScreenStyles';

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export const ErrorScreen = ({ message, onRetry }: ErrorScreenProps) => (
  <View style={s.centerScreen}>
    <Text style={s.errIcon}>⚠</Text>
    <Text style={s.errTitle}>Something went wrong</Text>
    <Text style={s.errMsg}>{message}</Text>
    <TouchableOpacity style={s.retryBtn} onPress={onRetry}>
      <Text style={s.retryText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

