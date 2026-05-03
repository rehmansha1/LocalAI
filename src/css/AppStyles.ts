import { StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export const appStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexGrow: 1,
  },
});
