/**
 * 用户认证相关类型定义
 */

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  balance: number;
  creditScore: number;
  totalTransactions: number;
  onTimeRate: number;
  joinedGroups: string[];
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  language: 'zh-CN' | 'en-US';
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  transferRequests: boolean;
  returnReminders: boolean;
  creditUpdates: boolean;
  groupUpdates: boolean;
}

export interface PrivacySettings {
  showRealName: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showCreditScore: boolean;
  allowFriendRequests: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  phone?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nickname: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface PasswordResetData {
  email: string;
  token?: string;
  newPassword?: string;
}

export interface EmailVerificationData {
  email: string;
  token: string;
}

// 用户角色类型
export type UserRole = 'owner' | 'admin' | 'member' | 'guest';

// 认证错误类型
export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// 权限定义
export interface Permission {
  resource: string;
  actions: string[];
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// 会话信息
export interface Session {
  user: User;
  token: string;
  expiresAt: string;
  lastActivity: string;
}