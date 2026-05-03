import { StyleSheet } from 'react-native';
import { APP_FONT, COLORS } from '../constants';

export const downloadScreenStyles = StyleSheet.create({
  centerScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  dlIconRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accent + '66',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  dlIconText: {
    ...APP_FONT,
    fontSize: 26,
    color: COLORS.accent,
  },
  dlTitle: {
    ...APP_FONT,
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 4,
  },
  dlSub: {
    ...APP_FONT,
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 24,
  },
  dlTrack: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  dlFill: {
    height: 4,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  dlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dlPct: {
    ...APP_FONT,
    fontSize: 14,
    color: COLORS.accent,
  },
  dlNote: {
    ...APP_FONT,
    fontSize: 12,
    color: COLORS.muted,
  },
  dlPathBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dlPathIcon: {
    ...APP_FONT,
    fontSize: 13,
  },
  dlPathText: {
    ...APP_FONT,
    fontSize: 11,
    color: COLORS.textSub,
  },
});
