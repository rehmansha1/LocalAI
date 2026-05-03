import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../constants';
import { ramBadgeStyles as s } from '../css/RamBadgeStyles';
import { ramColor } from '../utils/helpers';

interface RamBadgeProps {
  used: number;
  total: number;
  ramFree: number;
}

export const RamBadge = ({ used, total }: RamBadgeProps) => {
  if (total === 0) return null;
  const pct = used / total;
  const color = ramColor(pct, COLORS);
  
  return (
    <View style={s.ramBadge}>
      <View style={s.ramTrack}>
        <View style={[s.ramFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[s.ramText, { color }]}>
        RAM {(used / 1024).toFixed(2)}GB / {(total / 1024).toFixed(1)}GB
      </Text>
    </View>
  );
};

