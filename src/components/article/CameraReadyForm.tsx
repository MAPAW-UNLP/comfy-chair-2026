// --------------------------------------------------------------------------------------
//
// Formulario de subida del camera-ready. Solo selecciona y sube un archivo: no edita
// título, autores ni sesión (eso lo sigue haciendo ArticleForm). Sigue el mismo
// vocabulario de estados y manejo de errores que ArticleForm (ApiError, toasts).
//
// El deadline de camera-ready no se evalúa acá: si el artículo no es accepted o el
// usuario no es autor, ni siquiera se llega a esta pantalla (guarda de la ruta /
// ArticleDetail). El backend igual puede rechazar la subida con 400 si el deadline
// venció; ese caso cae en el manejo de error 400 genérico, igual que cualquier otro.
//
// Depende de POST /api/article/{id}/camera_ready/, ya integrado contra el backend
// real (rama feature/camera-ready, ticket "[Back] Habilitar la carga de camera-ready...").
//
// --------------------------------------------------------------------------------------

import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileSelectButton } from "./FileSelectButton";
import { validateFileExtension, formatAllowedExtensions, normalizeAllowedExtensions } from "@/lib/fileValidation";
import { useArticleFiles } from "@/hooks/Grupo1/useArticleFiles";
import { downloadMainFile, downloadFileByUrl, getArticleById } from "@/services/articleServices";
import { ApiError, uploadCameraReady, type Article } from "@/services/articleServices";

type CameraReadyFormProps = {
  article: Article;
  userId: number;
};

// Formatea una fecha ISO (string) al estilo dd/mm/aaaa usado en el resto del módulo
function formatDate(dateString?: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-AR");
}

export function CameraReadyForm({ article, userId }: CameraReadyFormProps) {
  const navigate = useNavigate();

  const [currentArticle, setCurrentArticle] = useState<Article>(article);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { mainFileName, cameraReadyName, cameraReadyUrl } = useArticleFiles(currentArticle);

  const esAutor =
    currentArticle.authors?.some((a) => a.id === userId) ||
    currentArticle.corresponding_author?.id === userId;
  const hasCameraReady = Boolean(cameraReadyName);

  const allowedExtensions = normalizeAllowedExtensions(currentArticle.session?.conference?.allowed_extensions);
  const extensionesFormateadas = formatAllowedExtensions(currentArticle.session?.conference?.allowed_extensions);

  const navigateToDetail = () => navigate({ to: `/article/detail/${currentArticle.id}`, replace: true });

  const handleFileSelected = (files: File[]) => {
    const selected = files[0];
    if (!selected) return;
    setFile(selected);

    if (allowedExtensions.length > 0 && !validateFileExtension(selected, allowedExtensions)) {
      const ext = selected.name.includes(".") ? selected.name.split(".").pop() : "";
      setFileError(`Extensión no permitida (.${ext}). Solo se admite: ${extensionesFormateadas}.`);
    } else {
      setFileError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setFileError("Seleccioná el archivo camera-ready.");
      return;
    }
    if (fileError) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // El POST devuelve el ArticleFile creado, no el Article completo: para reflejar
      // el artículo actualizado (por si hace falta mostrar algo más) se vuelve a pedir.
      await uploadCameraReady(currentArticle.id, file, setUploadProgress);
      const refreshed = await getArticleById(currentArticle.id);
      setCurrentArticle(refreshed);

      toast.success("Camera-ready subido correctamente.", { duration: 5000 });
      navigateToDetail();

    } catch (error) {

      if (error instanceof ApiError) {
        if (error.status === 403) {
          toast.error("No tenés permiso para subir el camera-ready.");
          navigateToDetail();
        } else if (error.status === 404) {
          toast.error("El artículo no existe.");
          navigateToDetail();
        } else if (error.status === 409) {
          toast.error("El artículo no está aceptado.");
          navigateToDetail();
        } else if (error.status === 400) {
          const message = Object.values(error.errors).flat().join(" ") || error.message;
          setFileError(message);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("No se pudo subir el archivo", { description: "Revisá tu conexión e intentá de nuevo." });
      }

    } finally {
      setUploading(false);
    }
  };

  // Sin permisos: el formulario se muestra igual, deshabilitado, con el motivo y solo "Volver"
  if (!esAutor) {
    return (
      <div className="w-full max-w-xl rounded-2xl shadow-md border p-4 bg-white flex flex-col gap-4">
        <h2 className="text-lg font-bold italic text-slate-500 text-center">Subir camera-ready</h2>
        <hr className="bg-slate-100" />
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p className="font-semibold">No tenés permisos para subir el camera-ready</p>
          <p>Solo los autores del artículo pueden subir el archivo final.</p>
        </div>
        <CameraReadyFields article={currentArticle} mainFileName={mainFileName} disabled />
        <Button variant="outline" onClick={navigateToDetail} className="w-full bg-slate-900 text-white">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl rounded-2xl shadow-md border p-4 bg-white flex flex-col gap-4">

      <h2 className="text-lg font-bold italic text-slate-500 text-center">Subir camera-ready</h2>
      <hr className="bg-slate-100" />

      <CameraReadyFields article={currentArticle} mainFileName={mainFileName} disabled={uploading} />

      {/* Camera-ready actual, si ya había uno, y aviso de reemplazo cuando se elige uno nuevo */}
      {hasCameraReady && (
        <div className="flex flex-col gap-1">
          <Label>Camera-ready actual</Label>
          <Button
            variant="link"
            className="p-0 m-0 h-auto w-fit leading-none text-sky-600 hover:underline"
            onClick={() => cameraReadyUrl && downloadFileByUrl(cameraReadyUrl, cameraReadyName!)}
          >
            {cameraReadyName}
          </Button>
          {currentArticle.camera_ready?.uploaded_at && (
            <span className="text-xs text-muted-foreground">Subido el {formatDate(currentArticle.camera_ready.uploaded_at)}</span>
          )}
        </div>
      )}

      {hasCameraReady && file && !fileError && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <p className="font-semibold">Vas a reemplazar el camera-ready anterior</p>
          <p>El nuevo archivo sustituye al que subiste el {formatDate(currentArticle.camera_ready?.uploaded_at)}.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label>{hasCameraReady ? "Nuevo camera-ready" : "Camera-ready"}</Label>
        <FileSelectButton
          label="Camera-ready"
          accept={allowedExtensions.join(",")}
          disabled={uploading}
          hasError={Boolean(fileError)}
          hasFile={Boolean(file)}
          displayText={file ? file.name : "Seleccionar archivo..."}
          onFilesSelected={handleFileSelected}
        />
        {fileError && <p className="text-xs text-red-600">{fileError}</p>}
        {uploading && (
          <div className="flex flex-col gap-1">
            <Progress value={uploadProgress} />
            <span className="text-xs text-muted-foreground">Subiendo archivo... {uploadProgress}%</span>
          </div>
        )}
        <span className="text-xs text-muted-foreground">Extensiones permitidas: {extensionesFormateadas}.</span>
      </div>

      <hr className="bg-slate-100" />

      <div className="flex flex-row gap-2">
        <Button variant="outline" onClick={navigateToDetail} className="flex-1 bg-zinc-500 text-white" disabled={uploading}>
          Cancelar
        </Button>
        <Button
          variant="outline"
          onClick={handleSubmit}
          className="flex-1 bg-slate-900 text-white"
          disabled={uploading}
        >
          {uploading ? "Subiendo..." : hasCameraReady ? "Reemplazar" : "Subir"}
        </Button>
      </div>
    </div>
  );
}

// Campos de solo lectura con contexto del artículo (título, conferencia, archivo inicial)
function CameraReadyFields({ article, mainFileName, disabled }: { article: Article; mainFileName: string | null; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label>Título del artículo</Label>
        <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-500">{article.title}</div>
      </div>
      <div className="flex flex-col gap-1">
        <Label>Conferencia</Label>
        <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-500">
          {article.session?.conference?.title ?? ""}
        </div>
      </div>
      {mainFileName && (
        <div className="flex flex-col gap-1">
          <Label>Archivo inicial</Label>
          <Button
            variant="link"
            className="p-0 m-0 h-auto w-fit leading-none text-sky-600 hover:underline"
            disabled={disabled}
            onClick={() => downloadMainFile(article.id, mainFileName)}
          >
            {mainFileName}
          </Button>
        </div>
      )}
    </div>
  );
}
