import type { Session } from '@/services/sessionServices';

export type DateWindow = {
  start?: string | null;
  end?: string | null;
};

function toDay(value?: string | null): number | null {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day).getTime();
}

export function getSessionWindow(
  session: Session | null | undefined,
  period: 'submission' | 'review'
): DateWindow {
  const conference = session?.conference;
  const sessionStart = session?.[`${period}_start`];
  const sessionEnd = session?.[`${period}_end`];

  return {
    start: sessionStart || conference?.[`${period}_start`] || null,
    end: sessionEnd || conference?.[`${period}_end`] || null,
  };
}

export function isDateWindowOpen(window: DateWindow, now = new Date()): boolean {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const start = toDay(window.start);
  const end = toDay(window.end);

  return (start === null || today >= start) && (end === null || today <= end);
}

export function formatDateWindow(window: DateWindow): string {
  if (!window.start && !window.end) return 'Sin configurar';
  return `${window.start || 'Sin inicio'} - ${window.end || 'Sin cierre'}`;
}