import { StyleSheet } from 'react-native';
import { APP_FONT, COLORS } from '../constants';

export const ramBadgeStyles = StyleSheet.create({
  ramBadge: {
    alignItems: 'flex-end',
    gap: 3,
  },
  ramTrack: {
    width: 48,
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  ramFill: {
    height: 3,
    borderRadius: 2,
  },
  ramText: {
    ...APP_FONT,
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
