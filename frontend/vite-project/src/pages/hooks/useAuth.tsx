// src/hooks/useAuth.tsx
import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  picture?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && savedUser !== 'undefined') {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('user');
  });

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:3000/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  // Проверка ролей
  const hasRole = (role: 'user' | 'moderator' | 'admin'): boolean => {
    if (!user) return false;
    
    if (role === 'admin') return user.role === 'admin';
    if (role === 'moderator') return user.role === 'moderator' || user.role === 'admin';
    return true; // 'user' - все авторизованные
  };

  const isAdmin = hasRole('admin');
  const isModerator = hasRole('moderator');

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    isAdmin,
    isModerator
  };
};