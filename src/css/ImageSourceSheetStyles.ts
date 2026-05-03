import { StyleSheet } from 'react-native';
import { APP_FONT, COLORS } from '../constants';

export const imageSourceSheetStyles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surfaceHigh,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 34,
    paddingTop: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    marginBottom: 18,
  },
  sheetTitle: {
    ...APP_FONT,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 18,
    alignSelf: 'flex-start',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    paddingVertical: 10,
  },
  sheetRowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconBg: {
    backgroundColor: '#4f8ef722',
  },
  galleryIconBg: {
    backgroundColor: '#a78bfa22',
  },
  sheetRowIconText: {
    ...APP_FONT,
    fontSize: 20,
  },
  sheetRowLabel: {
    ...APP_FONT,
    fontSize: 15,
    color: COLORS.text,
  },
  sheetRowSub: {
    ...APP_FONT,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 1,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    width: '100%',
    marginVertical: 4,
  },
  sheetCancelBtn: {
    marginTop: 16,
    width: '100%',
    paddingVertical: 13,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  sheetCancelText: {
    ...APP_FONT,
    color: COLORS.text,
    fontSize: 15,
  },
});
