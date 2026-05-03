import { StyleSheet } from 'react-native';
import { APP_FONT, COLORS } from '../constants';

export const typingIndicatorStyles = StyleSheet.create({
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.muted,
  },
  assistantRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
    borderWidth: 1,
    borderColor: COLORS.accent + '44',
  },
  avatarText: {
    ...APP_FONT,
    fontSize: 9,
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexShrink: 1,
  },
  assistantBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
  },
});
