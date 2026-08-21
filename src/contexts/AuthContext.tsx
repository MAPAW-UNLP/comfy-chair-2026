import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from '@tanstack/react-router';
import { authService, type User } from '@/services/auth';
import type { RegisterFormData } from '@/lib/validations';
import { setNavigateToLogin } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Configure navigation callback for API interceptor
    setNavigateToLogin(() => {
      setUser(null);
      router.navigate({ to: '/login', search: { redirect: undefined, registered: undefined } });
    });

    const checkAuth = async () => {
      // Check if user is logged in on mount
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user);
  };

  const register = async (data: RegisterFormData) => {
    await authService.register(data);
    // Don't set user - let them log in manually after registration
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

