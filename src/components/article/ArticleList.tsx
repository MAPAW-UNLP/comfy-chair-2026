import { useState, useEffect, useRef } from 'react';
import type { Article } from '@/services/articleServices';
import { ArticleCard } from './ArticleCardChair';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getReviewersByArticle } from '@/services/reviewerServices';

interface ArticleListProps {
  items: Article[];
}

interface ArticleWithAssignedCount extends Article {
  assignedCount: number;
}

const filterOptions = ['Sin Filtros', 'Completos', 'Incompletos'] as const;

export const ArticleList = ({ items }: ArticleListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<'Sin Filtros' | 'Completos' | 'Incompletos'>('Sin Filtros');
  const [menuOpen, setMenuOpen] = useState(false);
  const [articlesWithCount, setArticlesWithCount] = useState<ArticleWithAssignedCount[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 5;

  // Calcula assignedCount para cada artículo
  useEffect(() => {
    const fetchAssignedCounts = async () => {
      const promises = items.map(async (article) => {
        try {
          const reviewers = await getReviewersByArticle(article.id);
          const assignedCount = reviewers.filter(r => r.assigned).length;
          return { ...article, assignedCount };
        } catch (error) {
          console.error('Error fetching reviewers for article', article.id, error);
          return { ...article, assignedCount: 0 };
        }
      });

      const results = await Promise.all(promises);
      setArticlesWithCount(results);
    };

    fetchAssignedCounts();
  }, [items]);

  const isComplete = (article: ArticleWithAssignedCount) => article.assignedCount === 3;

  // Filtra según selección
  const filteredArticles = articlesWithCount.filter((article) => {
    if (filter === 'Sin Filtros') return true;
    if (filter === 'Completos') return isComplete(article);
    if (filter === 'Incompletos') return !isComplete(article);
    return true;
  });

  // Reset page cuando cambia filtro
  useEffect(() => setCurrentPage(1), [filter]);

  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const initialIndex = (currentPage - 1) * itemsPerPage;
  const visibleArticles = filteredArticles.slice(initialIndex, initialIndex + itemsPerPage);

  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const lastPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  useEffect(() => {
    function closeMenu(e: MouseEvent) {
      const el = menuRef.current;
      if (!el?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="text-white py-4 px-6 flex justify-center items-center flex-shrink-0" style={{ backgroundColor: "#555353ff" }}>
        <div className="relative" ref={menuRef}>
          <Button
            variant="outline"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 bg-white text-black border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-full shadow-sm"
          >
            Todos los artículos - {filter}
            <ChevronDown className="w-4 h-4" />
          </Button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white text-gray-900 border rounded-lg shadow-lg z-50">
              {filterOptions.map((opcion, index) => (
                <button
                  key={opcion}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${filter === opcion ? 'bg-gray-100 font-medium' : ''} ${index === 0 ? 'rounded-t-lg' : ''} ${index === filterOptions.length - 1 ? 'rounded-b-lg' : ''}`}
                  onClick={() => {
                    setFilter(opcion);
                    setMenuOpen(false);
                  }}
                >
                  {opcion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista de artículos */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--sidebar-border)' }}>
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 text-gray-500 flex-1 flex items-center justify-center">
            No se encontraron artículos
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-400 flex-1 overflow-y-auto">
              {visibleArticles.map((articulo) => (
                <ArticleCard key={articulo.id} article={articulo} assignedCount={articulo.assignedCount} />
              ))}
            </div>

            <div className="bg-slate-800 text-white py-4 px-6 flex-shrink-0">
              <div className="flex justify-center items-center gap-4">
                {totalPages > 1 && (
                  <Button variant="outline" size="sm" onClick={lastPage} disabled={currentPage === 1} className="bg-transparent border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 p-2">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}

                <p className="text-sm">
                  Mostrando {initialIndex + visibleArticles.length} artículos de {filteredArticles.length}
                </p>

                {totalPages > 1 && (
                  <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage === totalPages} className="bg-transparent border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 p-2">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
