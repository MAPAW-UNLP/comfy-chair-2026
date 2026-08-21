import { useEffect, useState } from 'react';
import { Route } from '@/routes/_auth/conference/$id';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from '@tanstack/react-router';
import { getAllUsers, type User } from '@/services/userServices';
import AltaSession from './SessionCreate';
import { getSessionsByConference } from '@/services/sessionServices';
import type { Session } from '@/services/sessionServices';
import SessionCard from './SessionCard';
import ModalEliminar from './ModalDelete';
import { deleteConference } from '@/services/conferenceServices';
import { CarouselContainer, CarouselItem } from '@/components/ui/carousel-container';
import { toast } from 'sonner';
import { SearchBar } from './ConferenceSearch';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import Statistics from './Statistics';
import Breadcrumb from '../ui/Breadcrumb';
import { getArticlesByConferenceId, type Article } from '@/services/articleServices';
import { useAuth } from '@/contexts/AuthContext';

export function formatearFecha(fecha: string): string {
  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
}

function AConference() {
  const conferencia = Route.useLoaderData();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chairs, setChairs] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [verEstadisticas, setVerEstadisticas] = useState<boolean>(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const {user}= useAuth()

  const irEditarConferencia = () => {
    navigate({ to: `/conference/edit/${conferencia.id}` });
  };

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await getSessionsByConference(Number(conferencia.id));
      setSessions(data);
      setFilteredSessions(data);
    } catch (error) {
      console.error('Error al cargar las sesiones:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleEliminarConferencia = () => {
    setShowDeleteModal(true);
  };

  const onDelete = async () => {
    await deleteConference(conferencia.id, user!.id);
    toast.warning('Conferencia eliminada');
    navigate({ to: '/conference/view' });
  };

  const fetchArticles = async () => {
    try {
      const data = await getArticlesByConferenceId(Number(conferencia.id));
      setArticles(data);
    } catch (error) {
      console.error('Error al cargar los artículos:', error);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const getChairs = async () => {
      const chairsIds = conferencia.chairs;
      if (!chairsIds) return;

      const allUsers = await getAllUsers();
      const users = allUsers.filter((user: User) =>
        chairsIds.includes(user.id)
      );

      if (!isCancelled) {
        setChairs(users);
      }
    };

    getChairs();
    fetchSessions(); // Cargar sesiones al montar el componente
    fetchArticles(); // Cargar artículos al montar el componente

    return () => {
      //Cancelo el seteo de chairs del efecto anterior si cambia conferencia
      isCancelled = true;
    };
  }, [conferencia]);

  return (
    <div className="flex flex-col mt-5 px-8 w-full gap-2 ">
      <Breadcrumb items={[{label: "Home", to: "/conference/view" } , {label: "Conferencia"}]} />

      <div className="flex flex-col gap-1 bg-card rounded shadow border border-gray-200 p-5 w-full">
        <div className="flex justify-between items-center">
          <h1 className="text-lg sm:text-2xl font-bold">
            {conferencia.title.toUpperCase()}
          </h1>

          <div
            onClick={irEditarConferencia}
            className="cursor-pointer rounded hover:bg-gray-200 p-1"
          >
            <Edit size={'15'} />
          </div>
        </div>

        <p className="text-sm">
          Desde {formatearFecha(conferencia.start_date!)} a{' '}
          {formatearFecha(conferencia.end_date!)}
        </p>
      </div>

      <div className="flex flex-col bg-card rounded shadow border border-gray-200 p-5 w-full">
        <h2 className="text-1xl font-bold">Descripción</h2>
        <p className="break-words">{conferencia.description}</p>
        <h2 className="text-1xl font-bold">Chairs</h2>
        {chairs.map((ch) => {
          return <p key={ch.id}>{ch.full_name}</p>;
        })}
      </div>

      <div className="flex justify-center items-center my-3">
        <Tabs
          value={verEstadisticas ? 'estadisticas' : 'sesiones'}
          onValueChange={(v) => setVerEstadisticas(v === 'estadisticas')}
          className="flex items-center"
        >
          <TabsList className="py-5 shadow">
            <TabsTrigger
              value="sesiones"
              className="cursor-pointer data-[state=active]:font-bold p-4 text-lg"
            >
              Sesiones
            </TabsTrigger>
            <TabsTrigger
              value="estadisticas"
              className="cursor-pointer data-[state=active]:font-bold p-4 text-lg"
            >
              Estadísticas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col bg-card rounded shadow border border-gray-200 p-5 w-full gap-8">
        {verEstadisticas ? (
          <Statistics 
            fromConference={true}
            totalSessions={sessions.length}
            totalArticles={articles.length}
            sessionsWithArticles={sessions.map(session => ({
              id: session.id,
              title: session.title,
              articleCount: articles.filter(article => article.session?.id === session.id).length
            }))}
            percentageMethodCount={sessions.filter(session => 
              session.threshold_percentage !== null && session.threshold_percentage !== undefined
            ).length}
            thresholdMethodCount={sessions.filter(session => 
              session.improvement_threshold !== null && session.improvement_threshold !== undefined
            ).length}
            conferenceAcceptedArticles={articles.filter(a => a.status === 'accepted').length}
            conferenceTotalArticles={articles.length}
          />
        ) : (
          <>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <h2 className="text-1xl font-bold">Sesiones disponibles</h2>
                <AltaSession
                  conference={conferencia}
                  onSessionCreated={fetchSessions}
                  trigger={
                    <Button size={'sm'} className="cursor-pointer">
                      <Plus />
                      Nueva sesión
                    </Button>
                  }
                />
              </div>
              <SearchBar
                datos={sessions}
                setResultados={setFilteredSessions}
                campos={['title']}
              />
            </div>

            {/* Lista de sesiones con carrusel */}
            {loadingSessions ? (
              <div className="text-center py-4 text-muted-foreground">
                Cargando sesiones...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay sesiones creadas aún. Cree la primera sesión.
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay coincidencias.
              </div>
            ) : (
              <CarouselContainer>
                {filteredSessions.map((session) => (
                  <CarouselItem key={session.id} width="350px">
                    <SessionCard
                      session={session}
                      onSessionUpdated={fetchSessions}
                    />
                  </CarouselItem>
                ))}
              </CarouselContainer>
            )}
          </>
        )}
      </div>

      <div className="flex justify-between items-center mt-5 m-2">
        <div></div>

        {sessions.length == 0 && (
          <Button
            variant="destructive"
            onClick={handleEliminarConferencia}
            className="flex items-center gap-2 cursor-pointer bg-red-900 text-white hover:bg-red-700"
          >
            <Trash2 size={16} />
            Eliminar conferencia
          </Button>
        )}
      </div>
      {/* Modal de confirmación para eliminar*/}
      {showDeleteModal && (
        <ModalEliminar
          onDelete={onDelete}
          title={conferencia.title}
          isConference={true}
          cerrar={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

export default AConference;
