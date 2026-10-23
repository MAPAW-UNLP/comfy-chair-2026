import React, { useEffect, useState } from 'react';
import type { Conference } from './ConferenceApp';
import { useNavigate } from '@tanstack/react-router';
import { formatearFecha } from './AConference';
import { Edit } from 'lucide-react';
import { getSessionsByConference } from '@/services/sessionServices';

type ConferenceBoxProps = {
  conferencia: Conference;
};

function ConferenceBox({ conferencia }: ConferenceBoxProps) {
  const navigate = useNavigate();
  const [sessionAmount, setSessionAmount] = useState<number | null>(null);

  const irUnaConferencia = () => {
    navigate({ to: `/conference/${conferencia.id}` });
  };

  const irEditarConferencia = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({ to: `/conference/edit/${conferencia.id}` });
  };

  useEffect(() => {
    const fetchSesiones = async () => {
      try {
        const sessions = await getSessionsByConference(Number(conferencia.id));
        setSessionAmount(sessions.length);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    }

    fetchSesiones()
  }, []);

  return (
    <div
      onClick={irUnaConferencia}
      className="flex w-full min-w-0 flex-col gap-2 rounded-sm border border-gray-400 bg-card p-4 shadow hover:bg-card/60"
    >
      <div className="flex justify-between items-start w-full">
        <div className="flex min-w-0 flex-1 flex-col gap-0 pr-2">
          <b className="truncate text-sm sm:text-base lg:text-lg">
            {conferencia.title.toUpperCase()}
          </b>
          <span className="text-xs sm:text-sm">
            {formatearFecha(conferencia.start_date)}-
            {formatearFecha(conferencia.end_date)}
          </span>
        </div>
        <button
          onClick={irEditarConferencia}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title="Editar conferencia"
        >
          <Edit className="w-4 h-4 cursor-pointer" />
        </button>
      </div>
      <hr />
      {sessionAmount !== null && <p className='font-medium'>{sessionAmount} {sessionAmount == 1 ?"sesión" : "sesiones"}</p>}
    </div>
  );
}

export default ConferenceBox;
