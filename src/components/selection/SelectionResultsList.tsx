import { useState } from 'react';
import type { Article } from '@/services/articleServices';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SelectionResultsListProps {
  items: Article[];
}

export const SelectionResultsList = ({ items }: SelectionResultsListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const initialIndex = (currentPage - 1) * itemsPerPage;
  const visibleArticles = items.slice(initialIndex, initialIndex + itemsPerPage);

  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const lastPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  return (
    <div className="h-full flex flex-col">
      {/* Lista de resultados */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--sidebar-border)' }}>
        <div className="divide-y divide-gray-400 flex-1 overflow-y-auto">
          {visibleArticles.map((article: any) => (
            <div
              key={article.id}
              className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-2"
            >
              {/* Título */}
              <div
                className="flex-1 pr-4 w-full text-left"
              >
                <h3 className="text-base text-gray-900 leading-tight">{article.title}</h3>
              </div>

              {/* Puntaje promedio */}
              <div
                className={`flex-shrink-0 px-4 py-2 rounded-full text-2xl font-bold ${article.status === 'accepted'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
                  }`}
              >
                {article.avg_score !== null && article.avg_score !== undefined
                  ? `${Math.round(article.avg_score)}/3`
                  : 'N/A'}
              </div>
            </div>
          ))}
        </div>

        {/* Footer con paginación */}
        <div className="bg-slate-800 text-white py-4 px-6 flex-shrink-0">
          <div className="flex justify-center items-center gap-4">
            {totalPages > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={lastPage}
                disabled={currentPage === 1}
                className="bg-transparent border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            <p className="text-sm">
              Mostrando {initialIndex + visibleArticles.length} artículos de {items.length}
            </p>

            {totalPages > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="bg-transparent border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};