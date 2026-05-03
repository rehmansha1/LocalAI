import { StyleSheet } from 'react-native';
import { APP_FONT, COLORS } from '../constants';

export const emptyStateStyles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    ...APP_FONT,
    fontSize: 38,
    color: COLORS.border,
    marginBottom: 14,
  },
  emptyTitle: {
    ...APP_FONT,
    fontSize: 20,
    color: COLORS.textSub,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  emptySub: {
    ...APP_FONT,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
});
