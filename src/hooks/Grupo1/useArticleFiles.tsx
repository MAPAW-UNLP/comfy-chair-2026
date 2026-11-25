// --------------------------------------------------------------------------------------
//
// Grupo 1 - Hook para leer los archivos de un artículo especifico y permitir su descarga
//
// --------------------------------------------------------------------------------------

import { useEffect, useState } from "react";
import type { Article } from "@/services/articleServices";

// Resuelve {name, url} a partir de un campo de archivo que puede venir como string
// (URL) o como objeto con .url. Antes este bloque estaba duplicado para main_file y
// source_file; se generaliza acá para no triplicarlo al sumar camera_ready.
function resolveFileField(value: unknown): { name: string | null; url: string | null } {
  if (!value) return { name: null, url: null };

  const url = typeof value === "string" ? value : (value as { url?: string }).url ?? null;
  if (!url) return { name: typeof value === "string" ? value : null, url: null };

  try {
    const parts = url.split("/");
    return { name: decodeURIComponent(parts[parts.length - 1]), url };
  } catch {
    return { name: String(value), url };
  }
}

export function useArticleFiles(article: Article | null) {
    const [mainFileName, setMainFileName] = useState<string | null>(null);
    const [sourceFileName, setSourceFileName] = useState<string | null>(null);
    const [mainFileUrl, setMainFileUrl] = useState<string | null>(null);
    const [sourceFileUrl, setSourceFileUrl] = useState<string | null>(null);
    const [cameraReadyName, setCameraReadyName] = useState<string | null>(null);
    const [cameraReadyUrl, setCameraReadyUrl] = useState<string | null>(null);

    useEffect(() => {

        if (!article) return;

        const mainFile = resolveFileField(article.main_file);
        setMainFileName(mainFile.name);
        setMainFileUrl(mainFile.url);

        const sourceFile = resolveFileField(article.source_file);
        setSourceFileName(sourceFile.name);
        setSourceFileUrl(sourceFile.url);

        // camera_ready no necesita resolveFileField: el GET ya devuelve filename y file (url) resueltos
        setCameraReadyName(article.camera_ready?.filename ?? null);
        setCameraReadyUrl(article.camera_ready?.file ?? null);

    }, [article]);

    return { mainFileName, sourceFileName, mainFileUrl, sourceFileUrl, cameraReadyName, cameraReadyUrl };

}
