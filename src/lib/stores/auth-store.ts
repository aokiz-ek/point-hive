import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService, type AuthUser } from '@/lib/services/auth-service';
import type { User, AuthState, LoginCredentials, RegisterData } from '@/lib/types';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

// 辅助函数：将 AuthUser 转换为 User 类型
function mapAuthUserToUser(authUser: AuthUser): User {
  return {
    id: authUser.id,
    email: authUser.email,
    nickname: authUser.username,
    avatar: authUser.avatar_url || '',
    balance: authUser.balance,
    creditScore: authUser.credit_score,
    totalTransactions: 0, // 需要从数据库查询
    onTimeRate: 0, // 需要从数据库计算
    joinedGroups: [], // 需要从数据库查询
    isEmailVerified: true, // Supabase Auth 已验证邮箱
    isPhoneVerified: false,
    preferences: {
      language: 'zh-CN',
      theme: 'system',
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        transferRequests: true,
        returnReminders: true,
        creditUpdates: true,
        groupUpdates: true,
      },
      privacy: {
        showRealName: false,
        showPhone: false,
        showEmail: false,
        showCreditScore: true,
        allowFriendRequests: true,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const useAuthStore = create<AuthStore>()(
  (set, get) => ({
    // Initial state
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    // Actions
    login: async (credentials: LoginCredentials) => {
      set({ isLoading: true, error: null });
      
      try {
        const result = await authService.signIn({
          email: credentials.email,
          password: credentials.password,
        });

        if (result.success && result.user) {
          const user = mapAuthUserToUser(result.user);
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } else {
          set({ 
            error: result.error || '登录失败', 
            isLoading: false 
          });
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '登录失败', 
          isLoading: false 
        });
      }
    },

    register: async (data: RegisterData) => {
      set({ isLoading: true, error: null });
      
      try {
        const result = await authService.signUp({
          email: data.email,
          password: data.password,
          username: data.nickname,
          full_name: data.nickname,
        });

        if (result.success && result.user) {
          const user = mapAuthUserToUser(result.user);
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } else {
          set({ 
            error: result.error || '注册失败', 
            isLoading: false 
          });
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '注册失败', 
          isLoading: false 
        });
      }
    },

    logout: async () => {
      try {
        await authService.signOut();
      } catch (error) {
        console.error('退出登录失败:', error);
      }
      
      set({ 
        user: null, 
        isAuthenticated: false, 
        error: null 
      });
    },

    updateUser: async (userData: Partial<User>) => {
      const { user } = get();
      if (!user) return;

      try {
        const result = await authService.updateProfile({
          username: userData.nickname,
          full_name: userData.nickname,
          avatar_url: userData.avatar,
        });

        if (result.success) {
          set({ 
            user: { 
              ...user, 
              ...userData, 
              updatedAt: new Date().toISOString() 
            } 
          });
        } else {
          set({ error: result.error || '更新失败' });
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '更新失败' 
        });
      }
    },

    clearError: () => {
      set({ error: null });
    },

    refreshToken: async () => {
      // Supabase 会自动处理 token 刷新
      // 这里只需要检查用户是否仍然有效
      await get().checkAuth();
    },

    checkAuth: async () => {
      set({ isLoading: true });

      try {
        const authUser = await authService.getCurrentUser();
        
        if (authUser) {
          const user = mapAuthUserToUser(authUser);
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } else {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      } catch (error) {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: error instanceof Error ? error.message : '认证检查失败'
        });
      }
    },

    // 重置密码
    resetPassword: async (email: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const result = await authService.resetPassword(email);
        
        if (result.success) {
          set({ isLoading: false });
        } else {
          set({ 
            error: result.error || '重置密码失败', 
            isLoading: false 
          });
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '重置密码失败', 
          isLoading: false 
        });
      }
    },

    // 更新密码
    updatePassword: async (newPassword: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const result = await authService.updatePassword(newPassword);
        
        if (result.success) {
          set({ isLoading: false });
        } else {
          set({ 
            error: result.error || '更新密码失败', 
            isLoading: false 
          });
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '更新密码失败', 
          isLoading: false 
        });
      }
    },
  })
);