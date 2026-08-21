import React from 'react';
import { useCountdown } from '@/utils/useCountdown';

type Props = {
  deadlineIso?: string; // ej: '2025-11-30T23:59:59Z'
  label?: string;       // ej: 'Fecha Límite'
};

export default function CountdownCard({ deadlineIso, label = 'Fecha Límite' }: Props) {
  const c = useCountdown(deadlineIso);

  if (!deadlineIso) return null;

  const dateFmt = new Date(deadlineIso).toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  const urgency =
    c.isOver ? 'text-gray-500'
    : c.msLeft < 3600_000 ? 'text-red-600'
    : c.msLeft < 24 * 3600_000 ? 'text-amber-600'
    : 'text-slate-900';

  return (
    <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-slate-500">{label}: {dateFmt}</p>
        <p className={`text-lg font-semibold ${urgency}`}>
          {c.isOver ? 'Bidding cerrado' : `Faltan ${c.display}`}
        </p>
      </div>
    </div>
  );
}
