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

type VISTA_CHOICES = 'single blind' | 'double blind';
export type ALLOWED_EXTENSIONS_CHOICES = 'pdf' | 'docx' | 'txt';

export type Conference = {
  id: number;
  title: string;
  description: string;
  start_date?: string;
  end_date?: string;
  submission_start?: string | null;
  submission_end?: string | null;
  review_start?: string | null;
  review_end?: string | null;
  blind_kind: VISTA_CHOICES;
  chairs?: number[];
  sources_multiple: boolean;
  allowed_extensions: ALLOWED_EXTENSIONS_CHOICES[];
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
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-start gap-4 px-3 py-4 sm:gap-5 sm:px-5">
      <h1 className="text-2xl font-bold sm:text-3xl">Conferencias</h1>

      <div className="flex w-full items-center justify-center gap-2">
        <SearchBar
          datos={verActivas ? confActivas : confTerminadas}
          setResultados={setConferencias}
          campos={['title']}
        />
      </div>

      <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={verActivas ? 'activas' : 'terminadas'}
          onValueChange={(v) => setVerActivas(v === 'activas')}
          className="flex w-full items-center sm:w-auto"
        >
          <TabsList className="grid h-11 w-full grid-cols-2 shadow sm:h-10 sm:w-auto">
            <TabsTrigger
              value="activas"
              className="cursor-pointer px-4 py-2 text-sm data-[state=active]:font-bold sm:text-base"
            >
              Activas
            </TabsTrigger>
            <TabsTrigger
              value="terminadas"
              className="cursor-pointer px-4 py-2 text-sm data-[state=active]:font-bold sm:text-base"
            >
              Terminadas
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex w-full sm:w-auto sm:justify-end">
          <Button
            size={'lg'}
            onClick={irAltaConferencia}
            className="w-full cursor-pointer text-base sm:w-auto"
          >
            <Plus size={16} />
            Conferencia
          </Button>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {conferencias.length > 0 ? (
          conferencias.map((c) => {
            return <ConferenceBox key={c.id} conferencia={c} />;
          })
        ) : <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No hay conferencias.</p>}
      </div>
    </div>
  );
}

export default ConferenceApp;
