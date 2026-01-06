import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api';
import type { User } from '../types';

const OAUTH_STATE_KEY = 'oauth_state';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingApproval: boolean;
  oauthError: string | null;
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  handleGoogleCallback: (code: string, state: string) => Promise<{ pendingApproval: boolean; isNewUser: boolean }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearOAuthError: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      pendingApproval: false,
      oauthError: null,

      login: async (username: string, password: string) => {
        const response = await authApi.login(username, password);
        localStorage.setItem('token', response.access_token);
        set({
          user: response.user,
          token: response.access_token,
          isAuthenticated: true,
          isLoading: false,
          pendingApproval: false,
        });
      },

      loginWithGoogle: async () => {
        try {
          set({ isLoading: true, oauthError: null });
          const { url, state } = await authApi.getGoogleAuthUrl();
          // Store state for CSRF verification
          sessionStorage.setItem(OAUTH_STATE_KEY, state);
          // Redirect to Google
          window.location.href = url;
        } catch (error) {
          set({
            isLoading: false,
            oauthError: 'Failed to initiate Google login. Please try again.',
          });
          throw error;
        }
      },

      handleGoogleCallback: async (code: string, state: string) => {
        try {
          set({ isLoading: true, oauthError: null });

          // Verify state matches
          const storedState = sessionStorage.getItem(OAUTH_STATE_KEY);
          if (storedState !== state) {
            throw new Error('Invalid state parameter. Please try again.');
          }
          sessionStorage.removeItem(OAUTH_STATE_KEY);

          const response = await authApi.googleCallback(code, state);

          if (response.pending_approval) {
            set({
              user: response.user,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              pendingApproval: true,
            });
            return { pendingApproval: true, isNewUser: response.is_new_user };
          }

          localStorage.setItem('token', response.access_token);
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            pendingApproval: false,
          });
          return { pendingApproval: false, isNewUser: response.is_new_user };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error
            ? error.message
            : (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Google login failed. Please try again.';
          set({
            isLoading: false,
            oauthError: errorMessage,
            pendingApproval: false,
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem(OAUTH_STATE_KEY);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          pendingApproval: false,
          oauthError: null,
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const user = await authApi.getMe();
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearOAuthError: () => {
        set({ oauthError: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
