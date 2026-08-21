// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Hook para leer los archivos de un artículo especifico y permitir su descarga
//
// -------------------------------------------------------------------------------------- 

import { useEffect, useState } from "react";
import type { Article } from "@/services/articleServices";

export function useArticleFiles(article: Article | null) {
    const [mainFileName, setMainFileName] = useState<string | null>(null);
    const [sourceFileName, setSourceFileName] = useState<string | null>(null);
    const [mainFileUrl, setMainFileUrl] = useState<string | null>(null);
    const [sourceFileUrl, setSourceFileUrl] = useState<string | null>(null);

    useEffect(() => {

        if (!article) return;

        const mf: any = article.main_file;
        const sf: any = article.source_file;

        // ----------------- Archivo principal -----------------
        if (mf) {
            const url = typeof mf === "string" ? mf : mf.url ?? null;
            setMainFileUrl(url);

            if (url) {
                try {
                    const parts = url.split("/");
                    setMainFileName(decodeURIComponent(parts[parts.length - 1]));
                } catch {
                    setMainFileName(String(mf));
                }
            } else {
                setMainFileName(typeof mf === "string" ? mf : null);
            }

        } else {
            setMainFileUrl(null);
            setMainFileName(null);
        }

        // ----------------- Archivo de fuentes -----------------
        if (sf) {
            const urlS = typeof sf === "string" ? sf : sf.url ?? null;
            setSourceFileUrl(urlS);
            if (urlS) {
                try {
                    const parts = urlS.split("/");
                    setSourceFileName(decodeURIComponent(parts[parts.length - 1]));
                } catch {
                    setSourceFileName(String(sf));
                }
            } else {
                setSourceFileName(typeof sf === "string" ? sf : null);
            }
        } else {
            setSourceFileUrl(null);
            setSourceFileName(null);
        }

    }, [article]);

    return { mainFileName, sourceFileName, mainFileUrl, sourceFileUrl };
    
}
