import {axiosInstance} from './api'
import type { RegisterFormData, LoginFormData } from '@/lib/validations'

export interface User {
  id: string
  email: string
  full_name: string
  affiliation: string
  role: string
}

export interface AuthResponse {
  status?: string
  token: string
  user: User
}

export const authService = {
  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/user/register/', {
      full_name: data.fullName,
      affiliation: data.affiliation,
      email: data.email,
      password: data.password
    })
    // Don't store token - user needs to log in after registration
    return response.data
  },

  login: async (data: LoginFormData): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/user/login/', {
      email: data.email,
      password: data.password
    })
    // Store token immediately after successful login
    localStorage.setItem('authToken', response.data.token)
    return response.data
  },

  verifyToken: async (token: string): Promise<AuthResponse> => {
    const response = await axiosInstance.get('/user/getUser/')
    return {
      token: token,
      user: {
        id: response.data.id,
        email: response.data.email,
        full_name: response.data.full_name,
        affiliation: response.data.affiliation,
        role: response.data.role
      }
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      return null
    }
    
    try {
      const response = await authService.verifyToken(token)
      return response.user
    } catch {
      localStorage.removeItem('authToken')
      return null
    }
  },

  logout: () => {
    localStorage.removeItem('authToken')
  }
}