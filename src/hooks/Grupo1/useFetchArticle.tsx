// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Hook para leer un artículo especifico por su ID
//
// -------------------------------------------------------------------------------------- 

import { useEffect, useState } from "react";
import { getArticleById, type Article } from "@/services/articleServices";

export function useFetchArticle(id: number) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getArticleById(id);
        setArticle(data);
      } catch (err) {
        console.error("Error al obtener el artículo");
        setArticle(null);
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, [id]);

  return { article, loading };
}
