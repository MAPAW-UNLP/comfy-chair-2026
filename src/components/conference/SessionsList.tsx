/* Componente de ejemplo que muestra la lista de sesiones de una conferencia */

import { useState, useEffect } from "react";
import { getSessionsByConference } from "@/services/sessionServices";
import type { Session } from "@/services/sessionServices";
import SessionCard from "./SessionCard";
import AltaSession from "./SessionCreate";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

type SessionsListProps = {
  conferenceId: number;
};

export default function SessionsList({ conferenceId }: SessionsListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await getSessionsByConference(conferenceId);
      setSessions(data);
    } catch (error) {
      console.error("Error al cargar las sesiones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [conferenceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botón para dar de alta una sesión */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sesiones</h2>
        <AltaSession
          conferenceId={conferenceId}
          onSessionCreated={fetchSessions}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Alta Sesión
            </Button>
          }
        />
      </div>

      {/* Lista de sesiones */}
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No hay sesiones creadas aún. Creá la primera sesión.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onSessionUpdated={fetchSessions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
