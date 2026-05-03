import { StyleSheet } from 'react-native';
import { APP_FONT, COLORS } from '../constants';

export const errorScreenStyles = StyleSheet.create({
  centerScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errIcon: {
    ...APP_FONT,
    fontSize: 38,
    color: COLORS.danger,
    marginBottom: 14,
  },
  errTitle: {
    ...APP_FONT,
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 8,
  },
  errMsg: {
    ...APP_FONT,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: COLORS.accent,
    borderRadius: 22,
  },
  retryText: {
    ...APP_FONT,
    color: '#fff',
    fontSize: 15,
  },
});
