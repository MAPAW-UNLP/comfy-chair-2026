import { ArticleStatsChart, type ChartItem } from './ArticleStatsChart';
import { FileText, PresentationIcon, Percent, Target } from 'lucide-react';

// Tipo para representar una sesión con su cantidad de artículos
export type SessionStats = {
  id: number;
  title: string;
  articleCount: number;
};

type StatisticsProps = {
  fromConference: boolean;
  acceptedArticles?: number;
  regularArticles?: number;
  posterArticles?: number;
  totalSessions?: number;
  totalArticles?: number;
  sessionsWithArticles?: SessionStats[];
  percentageMethodCount?: number;
  thresholdMethodCount?: number;
  conferenceAcceptedArticles?: number;
  conferenceTotalArticles?: number;
};

function Statistics({ 
  fromConference, 
  acceptedArticles = 0,
  regularArticles = 0,
  posterArticles = 0,
  totalSessions,
  totalArticles,
  sessionsWithArticles = [],
  percentageMethodCount = 0,
  thresholdMethodCount = 0,
  conferenceAcceptedArticles = 0,
  conferenceTotalArticles = 0
}: StatisticsProps) {
  // Items para el gráfico de tipo (regular/poster)
  const typeItems: ChartItem[] = [
    {
      label: 'Regular',
      value: regularArticles,
      icon: FileText,
      colorClass: 'text-blue-600',
      gradientClass: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      label: 'Poster',
      value: posterArticles,
      icon: PresentationIcon,
      colorClass: 'text-purple-600',
      gradientClass: 'bg-gradient-to-r from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold">Estadísticas</h2>

      <div className="flex flex-col gap-5">
        {fromConference && totalSessions !== undefined && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Box de Sesiones */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold mb-2">Sesiones</h3>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-blue-600">{totalSessions}</span>
                <span className="text-gray-600">sesiones creadas</span>
              </div>
            </div>
            
            {/* Box de Artículos aprobados */}
            {conferenceTotalArticles > 0 && (
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold mb-2">Artículos aprobados</h3>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-green-600">
                    {((conferenceAcceptedArticles / conferenceTotalArticles) * 100).toFixed(1)}%
                  </span>
                  <span className="text-gray-600 text-sm">
                    ({conferenceAcceptedArticles}/{conferenceTotalArticles})
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gráfico de métodos de selección (solo en conferencia) */}
        {fromConference && (percentageMethodCount > 0 || thresholdMethodCount > 0) && (
          <ArticleStatsChart 
            title="Métodos de selección utilizados"
            showTotal={false}
            items={[
              {
                label: 'Porcentaje',
                value: percentageMethodCount,
                icon: Percent,
                colorClass: 'text-indigo-600',
                gradientClass: 'bg-gradient-to-r from-indigo-500 to-indigo-600'
              },
              {
                label: 'Puntaje mínimo',
                value: thresholdMethodCount,
                icon: Target,
                colorClass: 'text-cyan-600',
                gradientClass: 'bg-gradient-to-r from-cyan-500 to-cyan-600'
              }
            ]}
          />
        )}

        {/* Gráfico de artículos por sesión (solo en conferencia) - Al final */}
        {fromConference && sessionsWithArticles.length > 0 && (
          <ArticleStatsChart 
            title="Artículos enviados por sesión"
            items={sessionsWithArticles.map((session, index) => {
              // Array de colores para diferenciar las sesiones
              const colors = [
                { colorClass: 'text-blue-600', gradientClass: 'bg-gradient-to-r from-blue-500 to-blue-600' },
                { colorClass: 'text-purple-600', gradientClass: 'bg-gradient-to-r from-purple-500 to-purple-600' },
                { colorClass: 'text-green-600', gradientClass: 'bg-gradient-to-r from-green-500 to-green-600' },
                { colorClass: 'text-orange-600', gradientClass: 'bg-gradient-to-r from-orange-500 to-orange-600' },
                { colorClass: 'text-pink-600', gradientClass: 'bg-gradient-to-r from-pink-500 to-pink-600' },
                { colorClass: 'text-teal-600', gradientClass: 'bg-gradient-to-r from-teal-500 to-teal-600' },
              ];
              const colorIndex = index % colors.length;
              
              return {
                label: session.title,
                value: session.articleCount,
                icon: FileText,
                colorClass: colors[colorIndex].colorClass,
                gradientClass: colors[colorIndex].gradientClass
              };
            })}
          />
        )}

        {!fromConference && (
          <>
            {/* Cajas de resumen para sesiones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Box de Artículos enviados */}
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold mb-2">Artículos enviados</h3>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-purple-600">
                    {totalArticles || 0}
                  </span>
                  <span className="text-gray-600">artículos totales</span>
                </div>
              </div>
              
              {/* Box de Artículos aprobados */}
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold mb-2">Artículos aprobados</h3>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-green-600">
                    {totalArticles && totalArticles > 0 
                      ? ((acceptedArticles / totalArticles) * 100).toFixed(1)
                      : '0.0'}%
                  </span>
                  <span className="text-gray-600 text-sm">
                    ({acceptedArticles}/{totalArticles || 0})
                  </span>
                </div>
              </div>
            </div>
            
            <ArticleStatsChart 
              title="Tipo de Artículos"
              items={typeItems}
              showTotal={false}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default Statistics;
