import { useCallback, useRef, useState } from 'react';

import { MAX_LOG_ENTRIES } from '../constants';
import type { AddLog, LogEntry } from '../types';
import { formatTime } from '../utils/format';

export function useEventLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const nextId = useRef(0);

  const addLog = useCallback<AddLog>((kind, text) => {
    const entry: LogEntry = {
      id: nextId.current++,
      time: formatTime(new Date()),
      kind,
      text,
    };
    setEntries((current) => [entry, ...current].slice(0, MAX_LOG_ENTRIES));
  }, []);

  const clearLog = useCallback(() => setEntries([]), []);

  return { entries, addLog, clearLog };
}
