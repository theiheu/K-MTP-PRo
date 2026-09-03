import { create } from 'zustand';
import { User } from '../types';
import { usersService } from '../services/supabaseService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  
  login: async (username?: string, password?: string) => {
    set({ isLoading: true, error: null });
    try {
      if (!username || !password) {
        set({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu', isLoading: false });
        return false;
      }

      const user = await usersService.login(username, password);
      if (user) {
        set({ user, isLoading: false });
        localStorage.setItem('chicken_farm_user', JSON.stringify(user));
        return true;
      } else {
        set({ error: 'Sai tên đăng nhập hoặc mật khẩu!', isLoading: false });
        return false;
      }
    } catch (error: any) {
      set({ error: error.message || 'Có lỗi xảy ra khi đăng nhập', isLoading: false });
      return false;
    }
  },

  logout: () => {
    set({ user: null });
    localStorage.removeItem('chicken_farm_user');
  },

  checkSession: () => {
    const savedUser = localStorage.getItem('chicken_farm_user');
    if (savedUser) {
      try {
        set({ user: JSON.parse(savedUser) });
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
  }
}));
