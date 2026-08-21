// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Componente para mostrar un articulo en forma de card con sus aspectos principales.
//
// -------------------------------------------------------------------------------------- 

// Importaciones
import { toast } from 'sonner';
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import { useNavigate } from '@tanstack/react-router';
import { deleteArticle } from "@/services/articleServices";
import ArticleDeleteAccepted from './ArticleDeleteAccepted';
import ArticleDeleteReception from "./ArticleDeleteReception";
import { useArticleFiles } from "@/hooks/Grupo1/useArticleFiles";
import { type Article, type Status } from "@/services/articleServices";
import { checkDeletionRequestExists } from "@/services/articleServices";
import { downloadMainFile, downloadSourceFile } from "@/services/articleServices";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertCircleIcon, CircleXIcon, EyeIcon, FileDownIcon, PencilIcon, SettingsIcon, Trash2Icon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Lo que espera recibir el componente
export interface ArticleCardProps {
  article: Article;
  onDeleted?: (id: number) => void 
}

// Colores asociados a cada estado
const estadoColor: Record<Status, string> = {
  accepted: "bg-lime-900",
  reception: "bg-slate-900",
  bidding: "bg-slate-900",
  assignment: "bg-slate-900",
  review: "bg-slate-900",
  selection: "bg-slate-900",
  rejected: "bg-red-900",
};

// Textos asociados a cada estado
const estadoTexto: Record<Status, string> = {
  accepted: "Aceptado",
  reception: "Recibido",
  bidding: "Bidding",
  assignment: "Asignación",
  review: "Revisión",
  selection: "Selección",
  rejected: "Rechazado",
};

// Descripciones asociadas a cada estado
const estadoDescripcion: Record<Status, string> = {
  accepted: "Su articulo ha sido aceptado para la conferencia. ¡Felicitaciones!",
  reception: "Su articulo ha sido recibido y está pendiente de revisión.",
  bidding: "Su articulo está en proceso de bidding.",
  assignment: "Su articulo está en proceso de asignación de revisores.",
  review: "Su articulo está siendo revisado por los revisores asignados.",
  selection: "Su articulo está en proceso de selección final.",
  rejected: "Lamentablemente, su articulo ha sido rechazado para la conferencia.",
};

// Convierte la deadline de una conferencia a un string con el tiempo restante
function formatearTiempo(msRestante: number): string {

  if (!Number.isFinite(msRestante) || msRestante <= 0) {
    return "invalido";
  }

  const minutosTotales = Math.floor(msRestante / (1000 * 60));
  const horasTotales = Math.floor(msRestante / (1000 * 60 * 60));
  const diasTotales = Math.floor(msRestante / (1000 * 60 * 60 * 24));

  if (horasTotales >= 48) {
    return `${diasTotales} ${diasTotales === 1 ? "Día" : "Días"}`;
  } else if (horasTotales >= 1) {
    return `${horasTotales} ${horasTotales === 1 ? "Hora" : "Horas"}`;
  } else {
    const minutos = Math.max(minutosTotales, 1);
    return `${minutos} ${minutos === 1 ? "Minuto" : "Minutos"}`;
  }
}

//Cuerpo del Componente
const ArticleCard : React.FC<ArticleCardProps> = ({ article, onDeleted }) => {

  // Navegación
  const navigate = useNavigate();
  const navigateEditArticle = () => {navigate({ to: `/article/edit/${article.id}` });};
  const navigateDetailArticle = () => {navigate({ to: `/article/detail/${article.id}` });};

  // Estado para verificar si el articulo tiene una solicitud de baja
  const [deletionRequested, setDeletionRequested] = useState<boolean>(false);
  const [isLoadingDeletionStatus, setIsLoadingDeletionStatus] = useState<boolean>(true);

  // Tiempo restante (deadline)
  const [tiempoRestante, setTiempoRestante] = useState<string>("");
  const deadlineDate = article.session?.deadline ? new Date(article.session?.deadline) : null;  

  // Hook custom para el manejo de archivos
  const { mainFileName, sourceFileName } = useArticleFiles(article);

  //------------------------------------------------------------
  // Manejo de la baja de un archivo
  //------------------------------------------------------------
  const handleDelete = async (id: number) => {
    try {
      await deleteArticle(id)
      onDeleted?.(id)
      toast.success('Articulo eliminado correctamente !', { duration: 5000 });
    } catch {
      toast.success('Error al eliminar el articulo...', { duration: 5000 });
    }
  }

  //------------------------------------------------------------
  // Efecto para verificar si el artículo tiene una solicitud de baja
  //------------------------------------------------------------
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Consultamos a la API
        const exists = await checkDeletionRequestExists(article.id);
        setDeletionRequested(exists);
      } catch (error) {
        console.error("Error al verificar solicitud de baja:", error);
      } finally {
        setIsLoadingDeletionStatus(false);
      }
    };

    // Solo verifica si el artículo está aceptado
    if (article.status === "accepted") {
      checkStatus();
    } else {
      setIsLoadingDeletionStatus(false);
    }
  }, [article.id, article.status]); 

  //------------------------------------------------------------
  // Efecto para actualizar el tiempo restante cada minuto si el estado es "Recibido"
  //------------------------------------------------------------
  useEffect(() => {
    if (article.status !== "reception") return;

    const actualizarTiempo = () => { 
      const ahora = new Date().getTime();
      const limite = deadlineDate?.getTime();

      if (typeof limite !== "number") {
        setTiempoRestante("Sin fecha límite");
        return;
      }

      const diferencia = limite - ahora;

      if (diferencia <= 0) {
        setTiempoRestante("invalido");
      } else {
        setTiempoRestante(formatearTiempo(diferencia));
      }
    };

    actualizarTiempo();
    const interval = setInterval(actualizarTiempo, 1000 * 60 * 5); // actualiza cada 5 minutos
    return () => clearInterval(interval);

  }, [article.status, article.session?.deadline, deadlineDate]);

  //------------------------------------------------------------
  // Renderizado del componente
  //------------------------------------------------------------
  return (
    <div className="w-full max-w-md rounded-2xl shadow-md border p-4 mb-2 bg-white flex flex-col gap-4">
      
      {/* Titulo de la Card*/}
      <div className="flex-1 flex flex-col justify-center items-center"> 
        
        {/* Badge: se muestra solo si el articulo tiene una solicitud de baja*/}
        {!isLoadingDeletionStatus && deletionRequested && (
          <Badge variant="secondary" className="bg-red-900 text-white mb-1">
            <AlertCircleIcon />
            Solicitud de Baja Pendiente
          </Badge>
        )}

        {/* Titulo del Artículo */}
        <h2 className="text-lg font-bold italic text-slate-500 text-center">{article.title}</h2>

      </div>

      <hr className="bg-slate-100"/>

      {/* Boton de opciones */}
      <div className="flex flex-row">
        <div className="basis-3/4">
          <p className="text-md text-slate-500"><b>Tipo:</b> {article.type ? article.type.charAt(0).toUpperCase() + article.type.slice(1) : "Desconocido"}</p>
          <p className="text-md text-slate-500"><b>Sesion:</b> {article.session?.title}</p>
          <p className="text-md text-slate-500"><b>Conferencia:</b> {article.session?.conference?.title}</p>
        </div>
        <div className="basis-1/4 flex justify-center items-center">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" className="bg-slate-900 text-white flex items-center gap-2">
                <span className="hidden sm:inline">Opciones</span>
                <SettingsIcon className="rounded" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={navigateDetailArticle}>
                <EyeIcon/> Ver Detalle
              </DropdownMenuItem>
              {((tiempoRestante !== "invalido") && (article.status === "reception")) && (
                <DropdownMenuItem onClick={navigateEditArticle}>
                  <PencilIcon/> Editar Articulo
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => downloadMainFile(article.id, mainFileName!)}>
                <FileDownIcon/> Descargar Articulo
              </DropdownMenuItem>
              {article.type === "poster" && (
                <DropdownMenuItem onClick={() => downloadSourceFile(article.id, sourceFileName!)}>
                  <FileDownIcon/> Descargar Fuentes
                </DropdownMenuItem>
              )}
              {((tiempoRestante !== "invalido") && (article.status === "reception")) && (
                <ArticleDeleteReception
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                      <Trash2Icon/> Eliminar Articulo
                    </DropdownMenuItem>
                  }
                  onConfirm={() => handleDelete(article.id)}
                />
              )}
              
              {/* Opción de "Solicitar Baja": Solo visible si NO se ha solicitado aún */}
              {(article.status === "accepted") && !deletionRequested && (
                <ArticleDeleteAccepted
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                      <CircleXIcon /> Solicitar Baja
                    </DropdownMenuItem>
                  }
                  articleId={article.id}
                  onConfirm={() => {
                    setDeletionRequested(true);
                    toast.success('Solicitud de baja enviada correctamente.', { duration: 5000 });
                  }}
                />
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Contenedor de los dos botones */}
      <div className="flex gap-2 mt-auto">

        {/* Boton Estado */}
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-sm text-slate-900 font-medium text-start">Estado</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className={`${estadoColor[article.status] ?? "bg-slate-900"} text-white w-full`}>
                {estadoTexto[article.status] ?? "Desconocido"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Detalle del Estado</DialogTitle>
                <DialogDescription>
                  {estadoDescripcion[article.status] ?? "Ocurrió un error al obtener el estado del artículo."}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>

        {/* Boton Modificar */}
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-sm text-slate-900 font-medium text-start">Deadline</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={article.status !== "reception" || tiempoRestante === "invalido"} className={`w-full ${article.status === "reception" ? "bg-slate-900 text-white" : "bg-zinc-500 text-white"}`}>
                {article.status === "reception" && tiempoRestante !== "invalido" ? tiempoRestante || "..." : "Expirado"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modificar Articulo</DialogTitle>
                <DialogDescription>
                  Tienes tiempo de modificar tu artículo hasta el día:
                  <br />
                  {/* TODO FIX: por alguna razón interpreta la Date de la base de datos como zona horaria UTC y al parsearse a la
                      hora de argentina UTC-3 muestra 3 horas menos, se parsea a hora UTC para que muestre la fecha y hora reales */}
                  <b>{deadlineDate?.toLocaleString("es-AR", { timeZone: "UTC", dateStyle: "full", timeStyle: "short"})}</b>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;