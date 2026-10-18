import { Platform } from 'react-native';

import type { LogKind } from './types';

export const colors = {
  background: '#f4f5f7',
  surface: '#fff',
  text: '#111',
  textMuted: '#555',
  primary: '#2563eb',
  primaryPressed: '#1d4ed8',
  disabled: '#9ca3af',
  onPrimary: '#fff',
};

export const logColors: Record<LogKind, string> = {
  action: '#1d4ed8',
  result: '#047857',
  event: '#7c3aed',
  error: '#dc2626',
};

export const monospaceFont = Platform.select({
  ios: 'Menlo',
  default: 'monospace',
});
