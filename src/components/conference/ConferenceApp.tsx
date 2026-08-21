import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import ConferenceBox from './ConferenceBox';
import { useNavigate } from '@tanstack/react-router';
import {
  getActiveConferences,
  getFinishedConferences,
} from '@/services/conferenceServices';
import { Route } from '@/routes/_auth/conference/view';
import { useEffect, useState } from 'react';
import { SearchBar } from './ConferenceSearch';

type VISTA_CHOICES = 'single blind' | 'double blind' | 'completo';

export type Conference = {
  id: number;
  title: string;
  description: string;
  start_date?: string;
  end_date?: string;
  blind_kind: VISTA_CHOICES;
  chairs?: number[];
};

function ConferenceApp() {
  const conferenciasInicial = Route.useLoaderData();
  const [conferencias, setConferencias] =
    useState<Conference[]>(conferenciasInicial);
  const [verActivas, setVerActivas] = useState<boolean>(true);
  const [confActivas, setConfActivas] = useState<Conference[]>([]);
  const [confTerminadas, setConfTerminadas] = useState<Conference[]>([]);
  const navigate = useNavigate();

  const irAltaConferencia = async () => {
    navigate({ to: '/conference/create' });
  };

  useEffect(() => {
    const actualizarConferencias = async () => {
      setConfActivas(await getActiveConferences());
      setConfTerminadas(await getFinishedConferences());
    };

    actualizarConferencias();
  }, [verActivas]);

  useEffect(() => {
    if (verActivas) setConferencias(confActivas);
  }, [confActivas]);

  useEffect(() => {
    if (!verActivas) setConferencias(confTerminadas);
  }, [confTerminadas]);

  return (
    <div className="flex flex-col justify-start items-center gap-5 mt-3">
      <h1 className="text-3xl font-bold">Conferencias</h1>

      <div className="flex justify-center items-center gap-2 px-5 w-full">
        <SearchBar
          datos={verActivas ? confActivas : confTerminadas}
          setResultados={setConferencias}
          campos={['title']}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center w-full px-5 gap-2">
        <div className="flex-1"></div>
        <Tabs
          value={verActivas ? 'activas' : 'terminadas'}
          onValueChange={(v) => setVerActivas(v === 'activas')}
          className="flex items-center"
        >
          <TabsList className="py-5 shadow">
            <TabsTrigger
              value="activas"
              className="cursor-pointer data-[state=active]:font-bold p-4 text-lg"
            >
              Activas
            </TabsTrigger>
            <TabsTrigger
              value="terminadas"
              className="cursor-pointer data-[state=active]:font-bold p-4 text-lg"
            >
              Terminadas
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex-1 flex justify-end">
          <Button
            size={'lg'}
            onClick={irAltaConferencia}
            className="cursor-pointer text-md "
          >
            <Plus size={16} />
            Conferencia
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-center sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full px-5">
        {conferencias.length > 0 ? (
          conferencias.map((c) => {
            return <ConferenceBox key={c.id} conferencia={c} />;
          })
        ) : <p>No hay conferencias.</p>}
      </div>
    </div>
  );
}

export default ConferenceApp;
