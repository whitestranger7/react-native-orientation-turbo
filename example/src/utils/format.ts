export const formatTime = (date: Date) =>
  `${date.toTimeString().slice(0, 8)}.${String(date.getMilliseconds()).padStart(3, '0')}`;

export const formatValue = (value: unknown) =>
  typeof value === 'string' ? value : JSON.stringify(value);
