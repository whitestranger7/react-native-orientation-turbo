export type LogKind = 'action' | 'result' | 'event' | 'error';

export type LogEntry = {
  id: number;
  time: string;
  kind: LogKind;
  text: string;
};

export type AddLog = (kind: LogKind, text: string) => void;

// Runs a library call, logs it with its result and refreshes the live state
export type RunAction = (label: string, call: () => unknown) => void;

export type ModalVariant = 'default' | 'all';

export type ModalOrientation =
  'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right';
