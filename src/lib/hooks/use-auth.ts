import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores';
import { queryKeys, queryOptions } from '@/lib/providers/react-query-provider';
import type { LoginCredentials, RegisterData } from '@/lib/types';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
    clearError,
    refreshToken,
    checkAuth,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
    clearError,
    refreshToken,
    checkAuth,
  };
}

export function useAuthMutations() {
  const queryClient = useQueryClient();
  const { login, register, logout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => {
      logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return {
    loginMutation,
    registerMutation,
    logoutMutation,
  };
}

export function useUserProfile() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return user;
    },
    enabled: !!user,
    ...queryOptions.longCache,
  });
}