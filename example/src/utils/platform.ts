import { Platform } from 'react-native';

export const getPlatformLabel = () => {
  const device = Platform.OS === 'ios' && Platform.isPad ? 'iPad' : Platform.OS;
  return `${device} ${Platform.Version}`;
};
