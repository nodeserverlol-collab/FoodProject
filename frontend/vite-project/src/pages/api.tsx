// src/api/api.ts
import axios from 'axios';

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  picture?: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'moderator' | 'admin';
}

const api = axios.create({
  baseURL: 'https://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Интерсептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Не перенаправляем на логин, просто пробрасываем ошибку
      console.error('Unauthorized:', error.response?.data?.detail);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (data: RegisterData): Promise<UserResponse> => {
    try {
      const response = await api.post<UserResponse>('/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role || 'user'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка регистрации');
    }
  },

  login: async (email: string, password: string): Promise<{ user: UserResponse }> => {
    try {
      const response = await api.post('/login', { email, password });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка входа');
    }
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    try {
      const response = await api.get<UserResponse>('/users/me');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка получения пользователя');
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/logout');
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  },

  getGoogleUrl: async (): Promise<string> => {
    try {
      const response = await api.get('/google_url');
      return response.data.redirect_url;
    } catch (error: any) {
      throw new Error('Ошибка получения URL для Google');
    }
  },

  googleCallback: async (code: string): Promise<{ user: UserResponse }> => {
    try {
      const response = await api.post('/google/callback', null, {
        params: { code }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Ошибка входа через Google');
    }
  },

  getAdminDashboard: async (): Promise<any> => {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Доступ запрещен');
    }
  },

  getModeratorTools: async (): Promise<any> => {
    try {
      const response = await api.get('/moderator/tools');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Доступ запрещен');
    }
  },
};

export const adminAPI = {
  getUsers: async (): Promise<{ users: AdminUser[]; total: number }> => {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('У вас нет прав администратора');
      }
      throw new Error(error.response?.data?.detail || 'Ошибка загрузки пользователей');
    }
  },

  updateUserRole: async (userId: number, role: string): Promise<any> => {
    try {
      const response = await api.put(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('У вас нет прав администратора');
      }
      throw new Error(error.response?.data?.detail || 'Ошибка обновления роли');
    }
  },

  deleteUser: async (userId: number): Promise<any> => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('У вас нет прав администратора');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.detail || 'Нельзя удалить самого себя');
      }
      throw new Error(error.response?.data?.detail || 'Ошибка удаления пользователя');
    }
  },

  getStats: async (): Promise<any> => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('У вас нет прав администратора');
      }
      throw new Error(error.response?.data?.detail || 'Ошибка загрузки статистики');
    }
  },
};

export default api;