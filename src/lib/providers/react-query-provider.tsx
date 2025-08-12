'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  // 创建QueryClient实例，只在客户端创建一次
  const [queryClient] = React.useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          // 数据被认为是新鲜的时间 (5分钟)
          staleTime: 5 * 60 * 1000,
          // 数据在缓存中的时间 (10分钟)
          gcTime: 10 * 60 * 1000,
          // 当窗口重新获得焦点时，不自动重新获取数据
          refetchOnWindowFocus: false,
          // 重新连接时自动重新获取数据
          refetchOnReconnect: true,
          // 挂载时不自动重新获取数据（如果数据是新鲜的）
          refetchOnMount: true,
          // 重试次数
          retry: (failureCount, error: any) => {
            // 对于4xx错误不进行重试
            if (error?.response?.status >= 400 && error?.response?.status < 500) {
              return false;
            }
            // 最多重试3次
            return failureCount < 3;
          },
          // 重试延迟（指数退避）
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
        mutations: {
          // 重试次数
          retry: (failureCount, error: any) => {
            // 对于客户端错误不进行重试
            if (error?.response?.status >= 400 && error?.response?.status < 500) {
              return false;
            }
            return failureCount < 2;
          },
          // 重试延迟
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools 
        initialIsOpen={false}
        position="bottom"
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  );
}

// Query Keys 工厂函数
export const queryKeys = {
  // 认证相关
  auth: {
    me: () => ['auth', 'me'] as const,
    profile: () => ['auth', 'profile'] as const,
  },
  
  // 群组相关
  groups: {
    all: () => ['groups'] as const,
    list: (filters?: any) => ['groups', 'list', filters] as const,
    detail: (id: string) => ['groups', 'detail', id] as const,
    members: (id: string) => ['groups', 'members', id] as const,
    activities: (id: string) => ['groups', 'activities', id] as const,
    stats: (id: string) => ['groups', 'stats', id] as const,
  },
  
  // 交易相关
  transactions: {
    all: () => ['transactions'] as const,
    list: (filters?: any) => ['transactions', 'list', filters] as const,
    detail: (id: string) => ['transactions', 'detail', id] as const,
    summary: () => ['transactions', 'summary'] as const,
    pending: () => ['transactions', 'pending'] as const,
  },
  
  // 统计相关
  analytics: {
    overview: () => ['analytics', 'overview'] as const,
    points: (period: string) => ['analytics', 'points', period] as const,
    credit: () => ['analytics', 'credit'] as const,
    activity: (period: string) => ['analytics', 'activity', period] as const,
  },
  
  // 通知相关
  notifications: {
    all: () => ['notifications'] as const,
    unread: () => ['notifications', 'unread'] as const,
    count: () => ['notifications', 'count'] as const,
  },
} as const;

// 常用的查询选项
export const queryOptions = {
  // 长期缓存（用于不经常变化的数据）
  longCache: {
    staleTime: 30 * 60 * 1000, // 30分钟
    gcTime: 60 * 60 * 1000,    // 1小时
  },
  
  // 短期缓存（用于经常变化的数据）
  shortCache: {
    staleTime: 1 * 60 * 1000,  // 1分钟
    gcTime: 5 * 60 * 1000,     // 5分钟
  },
  
  // 实时数据（用于需要频繁更新的数据）
  realtime: {
    staleTime: 0,              // 立即过期
    gcTime: 1 * 60 * 1000,     // 1分钟
    refetchInterval: 30 * 1000, // 30秒刷新一次
  },
  
  // 静态数据（用于几乎不变化的数据）
  static: {
    staleTime: Infinity,       // 永不过期
    gcTime: Infinity,          // 永不清理
  },
} as const;