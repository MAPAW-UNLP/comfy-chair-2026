import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { getArticlesBySessionAndStatus } from '@/services/selectionServices';
import { Route as ReviewDetailRoute } from "@/routes/_auth/review/chair/$id"

type ReviewedArticleListProps = {
  status: 'accepted' | 'rejected';
};

export const ReviewedArticleList = ({
  status,
}: ReviewedArticleListProps) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const headerText =
    status === 'accepted' ? 'Artículos Aceptados' : 'Artículos Rechazados';

  useEffect(() => {
    const fetchArticles = async () => {
      // Obtiene sessionId desde localStorage
      const sessionIdString = localStorage.getItem("selectedSession");
      const sessionId = sessionIdString ? parseInt(sessionIdString) : NaN;

      if (sessionId <= 0 || isNaN(sessionId)) {
        setLoading(false);
        console.warn('No se encontró Session ID en localStorage.');
        return;
      }

      setLoading(true);
      try {
        // Usa el ID de sesión de localStorage
        const data = await getArticlesBySessionAndStatus(sessionId, status);
        setArticles(data);
      } catch (error) {
        console.error(`Error fetching ${status} articles:`, error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [status]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center text-gray-500">
          Cargando {headerText.toLowerCase()}...{' '}
        </div>
      </div>
    );
  }

  const listContent = (
    <div className="flex-1 overflow-y-auto">
      <div className="divide-y divide-gray-200">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={ReviewDetailRoute.to} // Ruta de detalle
            params={{ id: String(article.id) }}
            className="flex items-center justify-between p-4 transition-colors cursor-pointer w-full
              hover:bg-gray-50
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400
            "
          >
            <div className="flex-1 pr-4">
              <h3 className="text-base text-gray-900 leading-snug">
                {article.title}
              </h3>
            </div>

            {/* Puntaje promedio */}
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-gray-400">Puntaje Promedio</p>
              <p className="text-base font-bold text-gray-700 mt-1">
                {article.avg_score?.toFixed(2) ?? 'N/A'}{' '} {/* formato de 2 decimales o si no existe devuelve Not Available*/}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div
        className="text-white py-4 px-6 flex items-center flex-shrink-0 relative"
        style={{ backgroundColor: '#555353ff' }}
      >
        <h1 className="text-xl font-semibold mx-auto">{headerText}</h1>
      </div>

      {/* Subheader verde/rojo */}
      <div className="py-2 px-6 flex flex-col items-start justify-between flex-shrink-0 bg-gray-100 border-b border-gray-300"
      style={{ backgroundColor: '#ebe7e7ff' }}>
        <p
          className={`text-lg font-bold mt-1 ${status === 'accepted' ? 'text-green-700' : 'text-red-700'}`}
        >
          Totales: {articles.length} {/* {status === 'accepted' ? '' : ''} */}
        </p>
      </div>

      {/* Lista de artículos */}
      <div
        className="flex-1 overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--background)' }}
      >
        {listContent}
      </div>
    </div>
  );
};
