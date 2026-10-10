import { useEffect, useState } from "react"
import { useNavigate, Link } from "@tanstack/react-router"
import { ClipboardCheck } from "lucide-react"
import { getSession, type Session } from "@/services/sessionServices";
import {
  getArticleBySessionId,
  type Article,
} from "@/services/articleServices";

export function PanelSessionChair() {
  const navigate = useNavigate()

  const [sessionTitle, setSessionTitle] = useState("Panel del Chair");
  const [sessionId, setSessionId] = useState("ID de sesion");
  const [loadingTitle, setLoadingTitle] = useState(true);

  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
      const sessionIdString = localStorage.getItem("selectedSession");

      if (!sessionIdString) {
        navigate({ to: '/chairs/select-session' });
        return;
      }

      try {
        const sessionData: Session = await getSession(sessionIdString);

        setSessionTitle(sessionData.title);
        setSessionId(sessionData.id.toString());

        const articlesData = await getArticleBySessionId(sessionData.id);
        setArticles(articlesData);

      } catch (error) {
        console.error("Error fetching session data:", error);
      } finally {
        setLoadingTitle(false);
        setLoadingArticles(false);
      }
    };

    fetchSessionData();
  }, [navigate]);

  if (loadingTitle) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-10 text-gray-400 animate-pulse">
          Cargando...
        </h1>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">

      <h1 className="text-3xl font-bold text-center mb-10">
        Sesión #{sessionId}:<br />
        {sessionTitle}
      </h1>

      {/* Seleccionar corte */}
      <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6 mb-10">
        <div className="flex items-center justify-between gap-6">

          <div className="flex items-center gap-4">
            <div className="bg-gray-100 rounded-lg p-3">
              <ClipboardCheck size={32} className="text-gray-700" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Corte de sesión
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Definí el criterio de corte para esta sesión.
              </p>
            </div>
          </div>

          <Link
            to="/chairs/selection/selection-method"
            search={{ method: 'cutoff', value: '' }}
            className="shrink-0 bg-gray-800 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-700 transition"
          >
            Seleccionar corte
          </Link>

        </div>
      </div>

      {/* Lista de artículos */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          Artículos de la sesión
        </h2>

        {loadingArticles ? (
          <p className="text-gray-500">
            Cargando artículos...
          </p>
        ) : articles.length === 0 ? (
          <p className="text-gray-500">
            No hay artículos en esta sesión.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-300 shadow-sm">
            <table className="w-full bg-white">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Artículo
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Tipo
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Autores
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {articles.map((article) => (
                  <tr
                    key={article.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {article.title}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {article.type}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {article.status}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {article.authors
                        .map((author) => author.full_name)
                        .join(", ")}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                        onClick={() => {
                          navigate({
                            to: "/article/assign/$id",
                            params: { id: String(article.id) },
                          });
                        }}
                      >
                        Asignar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}