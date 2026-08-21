// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Hook para leer los artículos de una conferencia específica y filtrarlos por autor
//
// -------------------------------------------------------------------------------------- 

import { useEffect, useState } from "react";
import { getArticlesByConferenceId, type Article } from "@/services/articleServices";

export function useFetchConferenceArticles(conferenceId: number, userEmail: string) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getArticlesByConferenceId(conferenceId);

        // Filtrar por autor = usuario actual
        const filtrados = data.filter(a =>
          a.authors.some(author => author.email === userEmail)
        );

        // Orden descendente
        const ordenados = filtrados.sort((a, b) => b.id - a.id);

        setArticles(ordenados);
      } catch {
        console.error("Error al obtener los artículos");
      } finally {
        setLoadingArticles(false);
      }
    }

    fetch();
  }, [conferenceId, userEmail]);

  return { articles, loadingArticles, setArticles };
}
