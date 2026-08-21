import { useEffect, useState } from "react"
import { useNavigate, Link } from "@tanstack/react-router"
import { Users, FileSearch, ClipboardCheck } from "lucide-react"
import { getSession, type Session } from "@/services/sessionServices";

export function PanelSessionChair() {
  const navigate = useNavigate()

  const [sessionTitle, setSessionTitle] = useState("Panel del Chair");
  const [sessionId, setSessionId] = useState("ID de sesion");
  const [loadingTitle, setLoadingTitle] = useState(true);

  useEffect(() => {
    const fetchSessionTitle = async () => {
      const sessionIdString = localStorage.getItem("selectedSession");

      if (!sessionIdString) {
        navigate({ to: '/chairs/select-session'});
        return;
      }

      try {
        const sessionData: Session = await getSession(sessionIdString);

        setSessionTitle(sessionData.title);
        setSessionId(sessionData.id.toString());
      } catch (error) {
        console.error("Error fetching session data:", error);
      } finally {
        setLoadingTitle(false);
      }
    };
      fetchSessionTitle();
  }, [navigate]);

  if (loadingTitle) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-10 text-gray-400 animate-pulse">Cargando...</h1>
      </div>
    );
  }
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-10">
        Sesión #{sessionId}:<br/>
        {sessionTitle}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
        <Link
          to="/article/select"
          className="bg-white shadow-lg rounded-xl p-6 flex flex-col items-center hover:shadow-2xl hover:bg-gray-50 transition border border-gray-300"
        >
          <Users size={70} className="mb-4 text-gray-700" />
          <p className="text-xl font-semibold text-gray-800">
            Articulos a Asignar
          </p>
        </Link>

        <Link
          to="/review/chair/reviewed"
          className="bg-white shadow-lg rounded-xl p-6 flex flex-col items-center hover:shadow-2xl hover:bg-gray-50 transition border border-gray-300"
        >
          <FileSearch size={70} className="mb-4 text-gray-700" />
          <p className="text-xl font-semibold text-gray-800">
            Articulos Revisados
          </p>
        </Link>

        <Link
          to="/chairs/selection/selection-method"
          search={{ method: 'cutoff', value: '' }}
          className="bg-white shadow-lg rounded-xl p-6 flex flex-col items-center hover:shadow-2xl hover:bg-gray-50 transition border border-gray-300"
        >
          <ClipboardCheck size={70} className="mb-4 text-gray-700" />
          <p className="text-xl font-semibold text-gray-800">
            Seleccionar Corte de Sesión
          </p>
        </Link>
      </div>
    </div>
  )
}
