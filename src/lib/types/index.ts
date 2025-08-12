// 导出所有类型定义
export * from './auth';
export * from './group';
export * from './transaction';
export * from './extended';
export type { Database } from '../supabase/types';

// 通用类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
    version: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, any>;
}

// Notification types are now defined in extended.ts to avoid conflicts

// 存储类型
export interface StorageItem<T = any> {
  key: string;
  value: T;
  expiresAt?: number;
  createdAt: number;
  updatedAt: number;
}

// 应用配置
export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  features: {
    realTimeUpdates: boolean;
    offlineSupport: boolean;
    analytics: boolean;
    crashReporting: boolean;
  };
  limits: {
    maxFileSize: number;
    maxGroupMembers: number;
    maxTransferAmount: number;
    maxPendingRequests: number;
  };
}

// 错误类型
export interface AppError {
  code: string;
  message: string;
  statusCode?: number;
  details?: Record<string, any>;
  timestamp: string;
  userId?: string;
  context?: string;
}

// 设备信息
export interface DeviceInfo {
  id: string;
  name: string;
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  version: string;
  userAgent: string;
  screenResolution: string;
  isOnline: boolean;
  lastSeen: string;
}

// 路由参数
export interface RouteParams {
  [key: string]: string | string[] | undefined;
}

export interface SearchParamsType {
  [key: string]: string | string[] | undefined;
}

// 表单状态
export interface FormState<T = Record<string, any>> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  touchedFields: Record<string, boolean>;
}

// 主题类型
export type Theme = 'light' | 'dark' | 'system';

// 语言类型
export type Language = 'zh-CN' | 'en-US';

// 响应式断点
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// 组件大小
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 组件变体
export type ComponentVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';

// 加载状态
export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
}