'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Header } from './header';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  showSidebar?: boolean;
  showBottomNav?: boolean;
  showHeader?: boolean;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className,
  showSidebar = false, // 默认不显示侧边栏
  showBottomNav = false, // 默认不显示底部导航
  showHeader = true,
}) => {
  return (
    <div className="ak-min-h-screen ak-bg-background">
      {/* 头部 */}
      {showHeader && <Header />}

      {/* 主内容区 */}
      <main className={cn('ak-min-h-[calc(100vh-3.5rem)] ak-overflow-auto', className)}>
        <div className="ak-container ak-mx-auto ak-p-4 ak-space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
};

// 简化的页面容器组件
interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  description,
  actions,
  className,
}) => {
  return (
    <div className={cn('ak-space-y-6', className)}>
      {(title || description || actions) && (
        <div className="ak-flex ak-flex-col ak-space-y-4 sm:ak-flex-row sm:ak-items-start sm:ak-justify-between sm:ak-space-y-0">
          <div className="ak-space-y-1">
            {title && (
              <h1 className="ak-text-2xl ak-font-bold ak-tracking-tight ak-text-foreground">
                {title}
              </h1>
            )}
            {description && (
              <p className="ak-text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="ak-flex ak-items-center ak-space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <div className="ak-space-y-6">
        {children}
      </div>
    </div>
  );
};

// 卡片网格布局组件
interface CardGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  cols = 3,
  gap = 'md',
  className,
}) => {
  const gridCols = {
    1: 'ak-grid-cols-1',
    2: 'ak-grid-cols-1 sm:ak-grid-cols-2',
    3: 'ak-grid-cols-1 sm:ak-grid-cols-2 lg:ak-grid-cols-3',
    4: 'ak-grid-cols-1 sm:ak-grid-cols-2 lg:ak-grid-cols-3 xl:ak-grid-cols-4',
  };

  const gapSizes = {
    sm: 'ak-gap-4',
    md: 'ak-gap-6',
    lg: 'ak-gap-8',
  };

  return (
    <div
      className={cn(
        'ak-grid',
        gridCols[cols],
        gapSizes[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

// 空状态组件
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="ak-flex ak-flex-col ak-items-center ak-justify-center ak-py-12 ak-text-center">
      {icon && (
        <div className="ak-mb-4 ak-text-4xl ak-text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="ak-text-lg ak-font-semibold ak-text-foreground ak-mb-2">
        {title}
      </h3>
      {description && (
        <p className="ak-text-muted-foreground ak-mb-6 ak-max-w-sm">
          {description}
        </p>
      )}
      {action}
    </div>
  );
};

// 加载状态组件
export const LoadingState: React.FC<{ message?: string }> = ({
  message = '加载中...',
}) => {
  return (
    <div className="ak-flex ak-flex-col ak-items-center ak-justify-center ak-py-12 ak-space-y-4">
      <div className="ak-animate-spin ak-rounded-full ak-h-8 ak-w-8 ak-border-b-2 ak-border-ak-primary-500" />
      <p className="ak-text-sm ak-text-muted-foreground">{message}</p>
    </div>
  );
};

// 错误状态组件
interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = '出现错误',
  description = '抱歉，加载数据时出现了问题。',
  action,
}) => {
  return (
    <div className="ak-flex ak-flex-col ak-items-center ak-justify-center ak-py-12 ak-text-center">
      <div className="ak-mb-4 ak-text-4xl ak-text-destructive">⚠️</div>
      <h3 className="ak-text-lg ak-font-semibold ak-text-foreground ak-mb-2">
        {title}
      </h3>
      <p className="ak-text-muted-foreground ak-mb-6 ak-max-w-sm">
        {description}
      </p>
      {action}
    </div>
  );
};