import { type User } from './userServices';
import { axiosInstance as api } from './api';
import { type Conference } from '@/components/conference/ConferenceApp';

const errorMessages: Record<string, string> = {
  'conference with this title already exists.':
    'Ya existe una conferencia con ese título',
  'Ensure this field has no more than 300 characters.':
    'La descripción no debe tener más de 300 caracteres',
  'Ensure this field has no more than 50 characters.':
    'El título no debe tener más de 50 caracteres',
  'Se requiere al menos un chair para crear/editar la conferencia.':
    'Se requiere al menos un chair para crear/editar la conferencia.',
};

const handleConferenceError = (err: any, isCreate: boolean) => {
  const message = err.response?.data;
  const posibleError = message?.title?.[0] || message?.description?.[0] || message?.chairs?.[0];
  if (posibleError && errorMessages[posibleError]) {
    if (errorMessages[posibleError] === 'Se requiere al menos un chair para crear/editar la conferencia.') {
      if (isCreate) throw new Error('Se requiere al menos un chair para crear la conferencia.');
      else throw new Error('Se requiere al menos un chair para editar la conferencia.');
    }
    throw new Error(errorMessages[posibleError]);
  }
  console.error(err);
  throw err;
};

//------------------------------------------------------------
// GRUPO 1: Trae una conferencia filtrada por su id
//------------------------------------------------------------
export const getConferenceById = async (id: number): Promise<Conference | null> => {
  const response = await api.get(`/api/conference/${id}/`);
  const conf: Conference = response.data;
  return conf;
};

//------------------------------------------------------------
// GRUPO 1: Trae una lista de conferencias que no han finalizado
//------------------------------------------------------------
export const getActiveConferences = async (): Promise<Conference[]> => {
  try {
    const response = await api.get('/api/conference/active/');
    return response.data;
  } catch (err) {
    console.warn('Backend no disponible, devolviendo lista vacía.');
    return [];
  }
};

export const getAllConferences = async (): Promise<Conference[]> => {
  const response = await api.get('/api/conference/');
  return response.data;
};

export const getFinishedConferences = async (): Promise<Conference[]> => {
  const response = await api.get('/api/conference/finished/');
  return response.data;
};

export const getConference = async (id: string): Promise<Conference> => {
  const response = await api.get(`/api/conference/${id}/`);
  return response.data;
};

export const createConference = async (
  conferencia: Omit<Conference, 'id'>,
  chairs: User[],
  user_id: string
): Promise<Conference> => {
  try {

    //prueba para agregar admin
    // const response = await api.post('/user/register-admin/', {
    //   full_name: "nicolas admin",
    //   affiliation: "unlp",
    //   email: "nicoarditi13@gmail.com",
    //   password: "48595519"
    // });

    const response = await api.post('/api/conference/', {
      ...conferencia,
      chairs: chairs.map(user => user.id),
      user_id
    });

    return response.data;
  } catch (err) {
    handleConferenceError(err, true);
    throw err;
  }
};

export const updateConference = async (
  id: string,
  conferencia: Omit<Conference, 'id'>,
  chairs: User[],
  user_id: string
): Promise<Conference> => {
  try {
    const response = await api.patch(`/api/conference/${id}/`, {
      ...conferencia,
      chairs: chairs.map(user => user.id),
      user_id
    });
    return response.data;
  } catch (err) {
    handleConferenceError(err, false);
    throw err;
  }
};

export const deleteConference = async (id: string, user_id: string): Promise<void> => {
  await api.delete(`/api/conference/${id}/?user_id=${user_id}`);
};
