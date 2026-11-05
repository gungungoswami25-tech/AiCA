import { create } from 'zustand';
import { User, UserProfile } from '@aica/shared';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, profile?: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem('aica_token');
  const savedUser = localStorage.getItem('aica_user');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    profile: null,
    accessToken: savedToken,
    isAuthenticated: Boolean(savedToken),

    setAuth: (user, token, profile) => {
      localStorage.setItem('aica_token', token);
      localStorage.setItem('aica_user', JSON.stringify(user));
      set({
        user,
        profile: profile || null,
        accessToken: token,
        isAuthenticated: true
      });
    },

    logout: () => {
      localStorage.removeItem('aica_token');
      localStorage.removeItem('aica_user');
      set({
        user: null,
        profile: null,
        accessToken: null,
        isAuthenticated: false
      });
    }
  };
});
