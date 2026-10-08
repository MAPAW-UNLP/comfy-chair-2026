// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Servicios relacionados a la app users (alta, baja y modificación).
// También fue modificado por otros grupos para adaptarse a sus necesidades.
//
// -------------------------------------------------------------------------------------- 

import { axiosInstance as api } from './api';
import type { User } from '@/services/userServices';
import type { Session } from '@/services/sessionServices';

export type Type = "regular" | "poster";

export type Status = "reception" | "bidding" | "assignment" | "review" | "selection" | "accepted" | "rejected";

export type EventTypeChoices = 
  | "draft_created" 
  | "submitted" 
  | "reviewer_assigned" 
  | "review_received" 
  | "final_verdict";

  export type VerdictStatus = "accepted" | "rejected";
  

export interface ArticleHistoryItem {
  event_type: EventTypeChoices;
  created_at: string; 
  verdict?: VerdictStatus; // Presente solo si event_type es 'final_verdict'
}
export interface Article {
  id: number;
  title: string;
  main_file: File;
  status: Status;
  type: Type;
  abstract: string;
  source_file?: File | null;
  authors: User[];
  corresponding_author: User | null;
  session: Session | null;
}

export interface ArticleNew {
  title: string;
  main_file: File;
  status: string | null;
  type: string | null;
  abstract: string;
  source_file?: File[] | null;
  authors: number[];
  corresponding_author: number | null;
  session: number | null;
}

export interface ArticleUpdate {
  title?: string;
  main_file?: File | null;
  source_file?: File | null;
  status?: string | null;
  type?: string | null;
  abstract?: string;
  authors?: number[];
  corresponding_author?: number | null;
  session?: number | null;
}

export interface ArticleHistory {
    event_type: EventTypeChoices;
    metadata: Record<string, unknown>;
    created_at: Date;
    article: Article;
    created_by: User | null;
    reviewed_by: User | null;
}

function normalizeArticleShape(raw: any): Article {
  return {
    id: Number(raw?.id),
    title: raw?.title ?? raw?.titulo ?? 'Sin título',
    main_file: (raw?.main_file as unknown as File) ?? (null as unknown as File),
    status: (raw?.status as Status) ?? ('reception' as Status),
    type: raw?.type ?? null,
    abstract: raw?.abstract ?? '',
    source_file: (raw?.source_file as unknown as File) ?? null,
    authors: (raw?.authors as User[]) ?? [],
    corresponding_author: (raw?.corresponding_author as User) ?? null,
    session: (raw?.session as Session) ?? null,
  };
}

//------------------------------------------------------------
// GRUPO 1 - Buscar Articulo por ID
//------------------------------------------------------------
export const getArticleById = async (id: number): Promise<Article> => {
  const res = await api.get(`/api/article/${id}/`);
  if (!res.status || res.status >= 400) throw new Error("Error al obtener el artículo");
  return res.data;
};

//------------------------------------------------------------
// GRUPO 1 - Listar Articulos por ID de conferencia
//------------------------------------------------------------
export const getArticlesByConferenceId = async (conferenceId: number): Promise<Article[]> => {
  const response = await api.get(`/api/article/getArticlesByConferenceId/${conferenceId}`);
  const articles: Article[] = response.data;
  return articles;
};

//------------------------------------------------------------
// GRUPO 1 - Alta de Articulos
//------------------------------------------------------------
export async function createArticle(newArticle: ArticleNew) {
  // 1. Armamos el payload en formato JSON con la estructura exacta recibida
  const payload = {
    article: {
      title: newArticle.title,
      abstract: newArticle.abstract || "",
      corresponding_author: newArticle.corresponding_author,
      main_file: newArticle.main_file,
      status: newArticle.status || "reception",
      type: newArticle.type || "regular",
      session: newArticle.session,
      authors: newArticle.authors,
    },
    sources: newArticle.source_file?.map((file) => ({
      file_path: `media/articles/${file.name}`, // Ajusta la ruta base según requiera el backend
      filename: file.name,
    })) || [],
  };

  try {
    console.log("Enviando JSON del artículo:", payload);

    // 2. Realizamos la petición POST enviando el objeto con Header application/json
    const res = await api.post(`/api/article/`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    return normalizeArticleShape(res.data);
  } catch (err: any) {
    if (err.response?.data) {
      throw new Error(JSON.stringify(err.response.data));
    }
    throw err;
  }
}
 
//------------------------------------------------------------
// GRUPO 1 - Edición de Articulos
//------------------------------------------------------------
export async function updateArticle(id: number, updated: ArticleUpdate) {
  const formData = new FormData();

  if (updated.title !== undefined) formData.append('title', updated.title as string);
  if (updated.main_file !== undefined && updated.main_file !== null) formData.append('main_file', updated.main_file);
  if (updated.source_file !== undefined) {
  if (updated.source_file === null) {
    formData.append('source_file', '');
    } else {
      formData.append('source_file', updated.source_file);
    }
  }
  if (updated.status !== undefined) formData.append('status', updated.status ?? '');
  if (updated.type !== undefined) formData.append('type', updated.type ?? '');
  if (updated.abstract !== undefined) formData.append('abstract', updated.abstract ?? '');
  if (updated.corresponding_author !== undefined) formData.append('corresponding_author_id', String(updated.corresponding_author ?? ''));
  if (updated.session !== undefined) formData.append('session_id', String(updated.session ?? ''));
  if (updated.authors && Array.isArray(updated.authors)) {
    updated.authors.forEach((a) => formData.append('authors_ids', String(a)));
  }

  try {
    const res = await api.patch(`/api/article/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err: any) {
    if (err.response && err.response.data) {
      throw new Error(JSON.stringify(err.response.data));
    }
    throw err;
  }
}

//------------------------------------------------------------
// GRUPO 1 - Eliminar Artículo por ID
//------------------------------------------------------------
export const deleteArticle = async (id: number): Promise<void> => {
  try {
    const res = await api.delete(`/api/article/${id}/`);

    if (!res.status || res.status >= 400) {
      throw new Error("Error al eliminar el artículo");
    }
  } catch (err: any) {
    if (err.response?.data) {
      throw new Error(JSON.stringify(err.response.data));
    }
    throw err;
  }
};

//------------------------------------------------------------
// GRUPO 1 - Descargar archivo principal del artículo
//------------------------------------------------------------
export async function downloadMainFile(articleId: number, fileName: string) {
  const res = await api.get(`/api/article/${articleId}/download_main/`, {
    responseType: "blob",
  });

  if (res.status !== 200) {
    throw new Error("No se pudo descargar el archivo principal.");
  }

  const url = window.URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "archivo";
  link.click();
  window.URL.revokeObjectURL(url);
}

//------------------------------------------------------------
// GRUPO 1 - Descargar archivo de fuentes del artículo
//------------------------------------------------------------
export async function downloadSourceFile(articleId: number, fileName: string) {
  const res = await api.get(`/api/article/${articleId}/download_source/`, {
    responseType: "blob",
  });

  if (res.status !== 200) {
    throw new Error("No se pudo descargar el archivo de fuentes.");
  }

  const url = window.URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "fuentes";
  link.click();
  window.URL.revokeObjectURL(url);
}

//------------------------------------------------------------
// GRUPO 1 - Verificar si ya existe una solicitud de baja para este artículo
//------------------------------------------------------------
export const checkDeletionRequestExists = async (articleId: number): Promise<boolean> => {
  try {
    const res = await api.get(`/api/article-deletion-request/exists/${articleId}`);
    return res.data.exists; // true o false
  } catch (err) {
    console.error("Error al verificar solicitud de baja:", err);
    return false;
  }
};

// GRUPO 3 - Obtener artículo por ID de sesión
export const getArticleBySessionId = async (id: number): Promise<Article[]> => {
  console.log('Obteniendo artículos para la sesión con ID:', id);
  const res = await api.get(`/api/article/getArticlesBySessionId/${id}/`);
  if (!res.status || res.status >= 400) throw new Error("Error al obtener los artículos");
  return res.data;
};

// Usado por el grupo 1 en el sprint 1. Se deja por si es usado por otro grupo.
export const getAllArticles = async (): Promise<Article[]> => {
  const response = await api.get('/api/article');
  return response.data;
};

//Usado por el grupo 4 en el sprint 1. Se utilizar para el historial de los articulos
export async function getArticleHistory(articleId: number): Promise<ArticleHistoryItem[]> {
  try {
    const res = await api.get<ArticleHistoryItem[]>(`/api/article/${articleId}/history/`);
    if (!res.status || res.status >= 400) {
      throw new Error("Error al obtener el historial del artículo");
    }
    return res.data;
  } catch (err: any) {
    if (err.response?.data) {
      throw new Error(JSON.stringify(err.response.data));
    }
    throw err;
  }
}