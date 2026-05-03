import { StyleSheet } from 'react-native';
import { APP_FONT, COLORS } from '../constants';

export const modelSelectorModalStyles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'flex-end',
  },
  modelSheet: {
    backgroundColor: COLORS.surfaceHigh,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    marginBottom: 18,
  },
  modelSheetTitle: {
    ...APP_FONT,
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  modelSheetSub: {
    ...APP_FONT,
    fontSize: 12,
    color: COLORS.muted,
    alignSelf: 'flex-start',
    marginBottom: 18,
    lineHeight: 18,
  },
  scroll: {
    width: '100%',
  },
  bottomSpacer: {
    height: 24,
  },
});
