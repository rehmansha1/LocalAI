import { StyleSheet } from 'react-native';
import { APP_FONT, COLORS } from '../constants';

export const loadingScreenStyles = StyleSheet.create({
  centerScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingLabel: {
    ...APP_FONT,
    marginTop: 18,
    fontSize: 14,
    color: COLORS.muted,
    letterSpacing: 0.4,
  },
});
