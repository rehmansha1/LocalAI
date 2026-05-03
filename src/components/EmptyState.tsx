import React from 'react';
import { Text, View } from 'react-native';
import { emptyStateStyles as s } from '../css/EmptyStateStyles';

interface EmptyStateProps {
  supportsVision: boolean;
}

export const EmptyState = ({ supportsVision }: EmptyStateProps) => (
  <View style={s.emptyState}>
    <Text style={s.emptyIcon}>◎</Text>
    <Text style={s.emptyTitle}>LocalAI</Text>
    <Text style={s.emptySub}>
      {supportsVision
        ? 'Send text or attach an image - runs fully offline'
        : 'Fully offline - Nothing leaves your device'}
    </Text>
  </View>
);
