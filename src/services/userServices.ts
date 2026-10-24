import { axiosInstance as api } from './api';

export interface User {
  id: number;
  full_name: string;
  affiliation: string;
  email: string;
  role: string;
  deleted:boolean;
  is_active?: boolean;
}

export interface DisableConflict {
  type: 'conference' | 'session';
  id: number;
  title: string;
  conference_id?: number;
  conference_title?: string;
  can_request_conference_chair?: boolean;
  pending_request?: { id: number; requested_at: string } | null;
}

export interface ChairReplacementRequestResponse {
  id: number;
  requested_at: string;
  session_id: number;
  session_title: string;
  conference_id: number;
  conference_title: string;
  notified_chairs: string[];
}

export interface PendingReviewSession {
  session_id: number;
  session_title: string;
  articles: Array<{ id: number; title: string }>;
}

export interface DisableCheckResponse {
  user_id: number;
  can_disable: boolean;
  conflicts: DisableConflict[];
  chair_removals: DisableConflict[];
  pending_reviews: PendingReviewSession[];
}

export interface UserStatusResponse {
  message: string;
  user: User;
  removed_assignments?: number;
  notified_sessions?: Array<{ session_id: number; session_title: string }>;
}

export interface Article {
  id: number;
  title: string;
  status?: string;
  type?: string;
  score?: number | null;
  opinion?: string | null;
}

export interface Role {
  role: string;
  articles: Article[];
}

export interface Session {
  session_id: number;
  session_name: string;
  roles: Role[];
}

export interface UserConference {
  conference_id: number;
  conference_name: string;
  sessions: Session[];
}

export interface ProcessedConference {
  conference_id: number;
  conference_name: string;
  roles: string[];
}

//------------------------------------------------------------
// GRUPO 1: Trae una lista de usuarios registrados - Usado también por el grupo 3
//------------------------------------------------------------
export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get('/user/getUsers');
  return response.data;
}

export const getUserDisableCheck = async (
  userId: number
): Promise<DisableCheckResponse> => {
  const response = await api.get(`/user/${userId}/disable-check/`);
  return response.data;
}

export const updateUserStatus = async (
  userId: number,
  isActive: boolean
): Promise<UserStatusResponse> => {
  const response = await api.patch(`/user/${userId}/status/`, {
    is_active: isActive,
  });
  return response.data;
}

export const requestChairReplacement = async (
  userId: number,
  sessionId: number
): Promise<ChairReplacementRequestResponse> => {
  const response = await api.post(`/user/${userId}/chair-requests/`, {
    session_id: sessionId,
  });
  return response.data;
}

export const getUserFullData = async (): Promise<ProcessedConference[]> => {
  const response = await api.get('/user/user-full-data/');
  const conferences: UserConference[] = response.data.conferences;
  
  // Procesar la respuesta para extraer roles únicos por conferencia
  const processedConferences: ProcessedConference[] = conferences.map((conference) => {
    // Recopilar todos los roles únicos de todas las sesiones
    const rolesSet = new Set<string>();
    
    conference.sessions.forEach((session) => {
      session.roles.forEach((roleObj) => {
        rolesSet.add(roleObj.role);
      });
    });
    
    return {
      conference_id: conference.conference_id,
      conference_name: conference.conference_name,
      roles: Array.from(rolesSet),
    };
  });
  
  return processedConferences;
}

// Notification type enum
export type NotificationType = "info" | "critical";

// Main Notification interface
export interface Notification {
  id: number;
  user: number; // User ID (foreign key)
  article: number | null; // Article ID (foreign key, can be null)
  session: number | null; // Session ID for actionable session notifications
  title: string; // max 100 characters
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string; // ISO datetime string
}

// API Response interfaces
export interface NotificationsResponse {
  data: Notification[];
}

export interface MarkAsReadResponse {
  message: string;
}

// Get all notifications for authenticated user
export const getAllNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/notifications/');
  return response.data;
}

// Mark notification as read
export const markNotificationAsRead = async (notificationId: number): Promise<MarkAsReadResponse> => {
  const response = await api.post(`/notifications/${notificationId}/read/`);
  return response.data;
}

// Necesario para grupo 3
export const getCommonUsers= async (): Promise<User[]> =>{
  const response = await api.get('/user/getCommonUsers');
  return response.data;
}

export const getUserById= async (id: number): Promise<User> =>{
  const response = await api.get(`/user/getUserById/${id}`);
  return response.data;
}

// Update user data (name, affiliation, email)
export interface UpdateUserDataPayload {
  full_name: string;
  affiliation: string;
  email: string;
}

export interface UpdateUserDataResponse {
  message: string;
  user: User;
}

export const updateUserData = async (data: UpdateUserDataPayload): Promise<UpdateUserDataResponse> => {
  const response = await api.put('/user/update/', data);
  return response.data;
}

// Update user password
export interface UpdatePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UpdatePasswordResponse {
  message: string;
}

export const updateUserPassword = async (data: UpdatePasswordPayload): Promise<UpdatePasswordResponse> => {
  const response = await api.put('/user/update-password/', data);
  return response.data;
}

// Usuarios que participan en una conferencia
export interface ConferenceUser {
  id: number;
  full_name: string;
  email: string;
  affiliation: string;
  roles: string[];
}

export interface ConferenceUsersResponse {
  conference_id: number;
  users: ConferenceUser[];
}

export interface ConferenceUsersFilters {
  search?: string;
  role?: string;
}

export const getConferenceUsers = async (
  conferenceId: number,
  filters?: ConferenceUsersFilters
): Promise<ConferenceUsersResponse> => {
  const params = new URLSearchParams();

  if (filters?.search?.trim()) {
    params.append('search', filters.search.trim());
  }

  if (filters?.role?.trim()) {
    params.append('role', filters.role.trim());
  }

  const queryString = params.toString();

  const response = await api.get(
    `/api/conference/${conferenceId}/users/${queryString ? `?${queryString}` : ''}`
  );

  return response.data;
};