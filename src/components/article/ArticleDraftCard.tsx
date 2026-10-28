// --------------------------------------------------------------------------------------
//
// Grupo 2 - Card de un artículo en borrador dentro del listado del autor: muestra su
// completitud, el deadline de la sesión y el acceso para continuar la edición.
//
// --------------------------------------------------------------------------------------

// Importaciones
import { Button } from "@/components/ui/button";
import { useNavigate } from '@tanstack/react-router';
import { EyeIcon, FilePenLineIcon } from "lucide-react";
import { type Article } from "@/services/articleServices";
import { DeadlineBanner, DraftStatusBadge } from "./ArticleDraftBadges";

// Lo que espera recibir el componente
export interface ArticleDraftCardProps {
  article: Article;
}

//Cuerpo del Componente
const ArticleDraftCard : React.FC<ArticleDraftCardProps> = ({ article }) => {

  // Navegación
  const navigate = useNavigate();
  const navigateEditArticle = () => {navigate({ to: `/article/edit/${article.id}` });};
  const navigateDetailArticle = () => {navigate({ to: `/article/detail/${article.id}` });};

  //------------------------------------------------------------
  // Renderizado del componente
  //------------------------------------------------------------
  return (
    <div className="w-full max-w-md rounded-2xl shadow-md border p-4 mb-2 bg-white flex flex-col gap-4">

      {/* Titulo del Artículo */}
      <h2 className="text-lg font-bold italic text-slate-500 text-center">{article.title}</h2>

      <hr className="bg-slate-100"/>

      {/* Datos y accesos rápidos */}
      <div className="flex flex-row">
        <div className="basis-3/4">
          <p className="text-md text-slate-500"><b>Sesion:</b> {article.session?.title}</p>
          <p className="text-md text-slate-500"><b>Conferencia:</b> {article.session?.conference?.title}</p>
        </div>
        <div className="basis-1/4 flex justify-center items-center gap-1">
          <Button variant="ghost" size="icon" onClick={navigateEditArticle} title="Editar borrador" className="cursor-pointer">
            <FilePenLineIcon />
          </Button>
          <Button variant="ghost" size="icon" onClick={navigateDetailArticle} title="Ver detalle" className="cursor-pointer">
            <EyeIcon />
          </Button>
        </div>
      </div>

      <Button variant="outline" onClick={navigateEditArticle} className="w-full bg-slate-900 text-white cursor-pointer">
        Continuar edición
      </Button>

      {/* Estado */}
      <div className="flex flex-col gap-1">
        <span className="text-sm text-slate-900 font-medium text-start">Estado</span>
        <DraftStatusBadge />
      </div>

      <DeadlineBanner deadline={article.session?.deadline} />
    </div>
  );
};

export default ArticleDraftCard;
