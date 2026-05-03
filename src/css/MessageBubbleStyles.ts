import { Dimensions, StyleSheet } from 'react-native';
import { APP_FONT, COLORS } from '../constants';

const { width } = Dimensions.get('window');

export const messageBubbleStyles = StyleSheet.create({
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 14,
    maxWidth: width * 0.83,
  },
  userRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantRow: {
    alignSelf: 'flex-start',
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
  userBubble: {
    backgroundColor: COLORS.accent,
    borderBottomRightRadius: 5,
  },
  assistantBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleText: {
    ...APP_FONT,
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: COLORS.text,
  },
  attachedImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 8,
  },
});
