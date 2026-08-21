import type { Article } from '@/services/articleServices';
import { useNavigate } from '@tanstack/react-router';

interface ArticleCardProps {
  article: Article;
  assignedCount: number;
}

export const ArticleCard = ({ article, assignedCount }: ArticleCardProps) => {
  const { id, title } = article;
  const isComplete = assignedCount === 3;

  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate({ to: `/article/assign/${id}` });
  };

  return (
    <div
      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer w-full"
      onClick={handleCardClick}
    >
      {/* Título */}
      <div className="flex-1 pr-4">
        <h3 className="text-base text-gray-900 leading-tight">{title}</h3>
      </div>

      
      <div className="flex flex-col items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isComplete
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
            }`}
        >
          {isComplete ? 'Completo' : 'Incompleto'}
        </span>
      </div>
    </div>
  );
};
