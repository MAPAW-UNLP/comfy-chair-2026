import React, { useEffect } from 'react';
import type { Article } from '../../services/articleServices';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

type SessionArticleCardProps = {
  article: Article;
};

function traducirEstado(estado: string) {
  const traducciones = {
    reception: 'Recepción',
    bidding: 'Bidding',
    assignment: 'Asignación',
    review: 'Revisión',
    selection: 'Selección',
    accepted: 'Aceptado',
    rejected: 'Rechazado',
  };

  return traducciones[estado] || estado;
}

function SessionArticleCard({ article }: SessionArticleCardProps) {
  useEffect(() => {
    console.log('article, ', article);
  }, []);
  const userId = Number(useAuth().user?.id);
  const esAutor =
    article.corresponding_author?.id === userId ||
    article.authors.some((autor) => autor.id === userId);
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-800">{article.title}</h2>
          <Badge variant={esAutor ? 'default' : 'outline'} className="shrink-0">
            {esAutor ? 'Sos autor' : 'No sos autor'}
          </Badge>
        </div>
        <hr className="border-gray-300" />
      </div>

      <div className="space-y-4 text-sm">
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs uppercase tracking-wide">
            Tipo
          </span>
          <span className="font-bold text-blue-800 text-base uppercase">
            {article.type}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-gray-500 text-xs uppercase tracking-wide">
            Estado
          </span>
          <span
            className={`font-bold text-base uppercase ${
              article.status === 'accepted'
                ? 'text-green-600'
                : article.status === 'rejected'
                  ? 'text-red-600'
                  : 'text-yellow-600'
            }`}
          >
            {traducirEstado(article.status)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-gray-500 text-xs uppercase tracking-wide">
            Autores
          </span>
          <p className="font-bold text-gray-800 text-base">
            {article.authors.map((author, i) => (
              <span key={i}>
                {author.full_name}
                {i < article.authors.length - 1 ? ', ' : '.'}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SessionArticleCard;
