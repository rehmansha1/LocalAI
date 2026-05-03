import { Platform, StatusBar, StyleSheet } from 'react-native';
import { APP_FONT, COLORS } from '../constants';

export const chatHeaderStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 28 : 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modelPillIcon: {
    ...APP_FONT,
    fontSize: 16,
  },
  modelPillName: {
    ...APP_FONT,
    fontSize: 14,
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  modelPillBadge: {
    ...APP_FONT,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.4,
  },
  modelPillChevron: {
    ...APP_FONT,
    fontSize: 13,
    color: COLORS.muted,
    marginLeft: 2,
  },
});
