// src/utils/useCountdown.ts
import { useEffect, useMemo, useState } from 'react';

export type Countdown = {
  isOver: boolean;
  msLeft: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  display: string;
};

export function useCountdown(deadlineIso?: string): Countdown {
  const target = useMemo(() => {
    if (!deadlineIso) return NaN;
    const t = Date.parse(deadlineIso);
    return Number.isNaN(t) ? NaN : t;
  }, [deadlineIso]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now()); // primer tick inmediato
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  if (Number.isNaN(target)) {
    return { isOver: true, msLeft: 0, days: 0, hours: 0, minutes: 0, seconds: 0, display: '00:00:00' };
  }

  const diffMs = Math.max(0, target - now);
  const totalSec = Math.ceil(diffMs / 1000); // ⬅️ clave

  if (totalSec <= 0) {
    // Nunca mostramos 00:00:00: la UI debe cambiar por isOver
    return { isOver: true, msLeft: 0, days: 0, hours: 0, minutes: 0, seconds: 0, display: '00:00:00' };
  }

  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const hms = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const display = days > 0 ? `${days}d ${hms}` : hms;

  return { isOver: false, msLeft: diffMs, days, hours, minutes, seconds, display };
}
