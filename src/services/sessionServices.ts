import type { Conference } from '@/components/conference/ConferenceApp';

import { axiosInstance as api } from './api';

export interface Session {
  id: number;
  title: string;
  deadline: string | undefined;
  capacity: number;
  conference: Conference | null;
  threshold_percentage?: number | null;
  improvement_threshold?: number | null;
  chairs?: number[];
}

const handleSessionError = (err: any, isCreate: boolean) => {
  const message= err.response?.data;
  if (!message) return
  const posibleError =
    message?.title?.[0] ||
    message?.deadline?.[0] ||
    message?.capacity?.[0] ||
    message?.chairs?.[0] ||
    message?.improvement_threshold?.[0] ||
    message?.threshold_percentage?.[0];
  if (posibleError) throw new Error(posibleError);
};

//------------------------------------------------------------
// GRUPO 1: Trae una lista de sesiones filtradas por conference_id
//------------------------------------------------------------
export const getSessionsByConferenceGrupo1 = async (conferenceId: number): Promise<Session[]> => {
  const now = new Date();
  const response = await api.get('/api/session', {
    params: { conference_id: conferenceId },
  });
  const activeSessions = response.data.filter(
    (session: Session) => session.deadline !== undefined && new Date(session.deadline) > now
  );
  return activeSessions;
};

// Trae todas las sesiones
export const getAllSessions = async (): Promise<Session[]> => {
  const response = await api.get('/api/session');
  return response.data;
};

// Trae sesiones filtradas por conference_id
export const getSessionsByConference = async (
  conferenceId: number
): Promise<Session[]> => {
  const response = await api.get('/api/session', {
    params: { conference_id: conferenceId },
  });
    console.log('Sesiones obtenidas:', response.data);
  return response.data;
};

//Trae una sesion por su ID
export const getSession = async (sessionId: string): Promise<Session> => {
  const response = await api.get(`/api/session/${sessionId}/`);
  return response.data;
};

// Crear una sesión
export const createSession = async (
  sessionData: Omit<Session, 'id' | 'conference'>,
  conference_id: number,
  user_id: string
): Promise<Session> => {
  try {
    const response = await api.post('/api/session/', {
      ...sessionData,
      conference_id,
      user_id
    });
    return response.data;
  } catch (error: any) {
    handleSessionError(error, true);
    throw error;
  }
};

// Editar una sesión
export const updateSession = async (
  sessionId: string,
  sessionData: Omit<Session, 'id' | 'conference'>,
  conference_id: string,
  user_id: string
): Promise<Session> => {
  try {
    console.log('Updating session with data:', sessionData);
    const response = await api.put(`/api/session/${sessionId}/`, {
      ...sessionData,
      conference_id,
      user_id
    });
    return response.data;
  } catch (error: any) {
    handleSessionError(error, true);
    throw error;
  }
};

// Elimina una sesión por su ID
export const deleteSession = async (sessionId: string, user_id: string): Promise<void> => {
  await api.delete(`/api/session/${sessionId}/?user_id=${user_id}`);
};
