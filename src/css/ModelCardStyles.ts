import { StyleSheet } from 'react-native';
import { APP_FONT, COLORS } from '../constants';

export const modelCardStyles = StyleSheet.create({
  modelCard: {
    width: '100%',
    flexDirection: 'column',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  modelCardActive: {
    borderColor: COLORS.accent + '55',
    backgroundColor: COLORS.accentDim + '66',
  },
  modelIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  modelCardIcon: {
    ...APP_FONT,
    fontSize: 20,
  },
  modelCardBody: {
    flex: 1,
    gap: 3,
  },
  modelCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  modelCardName: {
    ...APP_FONT,
    fontSize: 15,
    color: COLORS.text,
  },
  modelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  modelBadgeText: {
    ...APP_FONT,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  modelCardDesc: {
    ...APP_FONT,
    fontSize: 12,
    color: COLORS.textSub,
    lineHeight: 17,
  },
  modelCardSize: {
    ...APP_FONT,
    fontSize: 11,
    color: COLORS.muted,
  },
  modelPathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modelPathIcon: {
    ...APP_FONT,
    fontSize: 11,
  },
  modelPathText: {
    ...APP_FONT,
    fontSize: 10,
    color: COLORS.muted,
    flex: 1,
  },
  modelCardActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  modelActionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  modelDownloadBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modelActionBtnText: {
    ...APP_FONT,
    color: '#fff',
    fontSize: 13,
  },
  modelDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelDeleteText: {
    ...APP_FONT,
    color: COLORS.danger,
    fontSize: 13,
  },
});
