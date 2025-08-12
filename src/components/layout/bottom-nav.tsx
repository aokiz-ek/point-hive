'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  ArrowLeftRight,
  BarChart3,
  User,
  Plus,
} from 'lucide-react';

interface BottomNavProps {
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ className }) => {
  const pathname = usePathname();

  const navigation = [
    {
      name: '首页',
      href: '/hall',
      icon: Home,
      current: pathname === '/hall',
    },
    {
      name: '群组',
      href: '/groups',
      icon: Users,
      current: pathname.startsWith('/groups'),
      badge: '3',
    },
    {
      name: '转移',
      href: '/transfer',
      icon: ArrowLeftRight,
      current: pathname.startsWith('/transfer'),
    },
    {
      name: '统计',
      href: '/stats',
      icon: BarChart3,
      current: pathname.startsWith('/stats'),
    },
    {
      name: '我的',
      href: '/credit',
      icon: User,
      current: pathname.startsWith('/credit') || pathname.startsWith('/profile') || pathname.startsWith('/settings'),
    },
  ];

  const [showQuickActions, setShowQuickActions] = React.useState(false);

  const quickActions = [
    {
      name: '创建群组',
      href: '/groups/create',
      icon: '📝',
    },
    {
      name: '扫码加入',
      href: '/groups/join',
      icon: '📱',
    },
    {
      name: '发起转移',
      href: '/transfer/new',
      icon: '💸',
    },
  ];

  return (
    <>
      {/* 快捷操作浮层 */}
      {showQuickActions && (
        <>
          <div
            className="ak-fixed ak-inset-0 ak-z-40 ak-bg-black/20 ak-backdrop-blur-sm"
            onClick={() => setShowQuickActions(false)}
          />
          <div className="ak-fixed ak-bottom-20 ak-left-1/2 ak--translate-x-1/2 ak-z-50 ak-bg-background ak-rounded-2xl ak-border ak-shadow-lg ak-p-4 ak-min-w-64">
            <div className="ak-text-sm ak-font-medium ak-text-center ak-mb-3 ak-text-muted-foreground">
              快捷操作
            </div>
            <div className="ak-grid ak-grid-cols-3 ak-gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  onClick={() => setShowQuickActions(false)}
                  className="ak-flex ak-flex-col ak-items-center ak-space-y-1 ak-p-3 ak-rounded-lg ak-bg-accent/50 hover:ak-bg-accent ak-transition-colors"
                >
                  <span className="ak-text-2xl">{action.icon}</span>
                  <span className="ak-text-xs ak-text-center ak-font-medium">
                    {action.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 底部导航栏 */}
      <nav
        className={cn(
          'ak-fixed ak-bottom-0 ak-left-0 ak-right-0 ak-z-30 ak-bg-background/95 ak-backdrop-blur ak-supports-[backdrop-filter]:bg-background/60 ak-border-t ak-border-border lg:ak-hidden',
          className
        )}
      >
        <div className="ak-flex ak-items-center ak-justify-around ak-px-4 ak-py-2">
          {navigation.slice(0, 2).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'ak-flex ak-flex-col ak-items-center ak-space-y-1 ak-px-3 ak-py-2 ak-rounded-lg ak-transition-colors ak-relative ak-min-w-0',
                item.current
                  ? 'ak-text-ak-primary-500'
                  : 'ak-text-muted-foreground hover:ak-text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'ak-h-5 ak-w-5',
                  item.current && 'ak-text-ak-primary-500'
                )}
              />
              <span className="ak-text-xs ak-font-medium ak-truncate ak-max-w-12">
                {item.name}
              </span>
              {item.badge && (
                <span className="ak-absolute ak--top-1 ak--right-1 ak-bg-ak-primary-500 ak-text-white ak-text-xs ak-rounded-full ak-px-1.5 ak-py-0.5 ak-min-w-[18px] ak-text-center ak-leading-none">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          {/* 中间的快捷操作按钮 */}
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={cn(
              'ak-flex ak-flex-col ak-items-center ak-space-y-1 ak-p-3 ak-rounded-full ak-transition-all ak-duration-200 ak-transform ak-relative',
              showQuickActions
                ? 'ak-bg-ak-primary-500 ak-text-white ak-scale-110 ak-shadow-lg'
                : 'ak-bg-ak-primary-500/10 ak-text-ak-primary-500 hover:ak-bg-ak-primary-500/20 hover:ak-scale-105'
            )}
          >
            <Plus
              className={cn(
                'ak-h-6 ak-w-6 ak-transition-transform ak-duration-200',
                showQuickActions && 'ak-rotate-45'
              )}
            />
          </button>

          {navigation.slice(2).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'ak-flex ak-flex-col ak-items-center ak-space-y-1 ak-px-3 ak-py-2 ak-rounded-lg ak-transition-colors ak-relative ak-min-w-0',
                item.current
                  ? 'ak-text-ak-primary-500'
                  : 'ak-text-muted-foreground hover:ak-text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'ak-h-5 ak-w-5',
                  item.current && 'ak-text-ak-primary-500'
                )}
              />
              <span className="ak-text-xs ak-font-medium ak-truncate ak-max-w-12">
                {item.name}
              </span>
              {item.badge && (
                <span className="ak-absolute ak--top-1 ak--right-1 ak-bg-ak-primary-500 ak-text-white ak-text-xs ak-rounded-full ak-px-1.5 ak-py-0.5 ak-min-w-[18px] ak-text-center ak-leading-none">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* 安全区域适配 (iPhone等设备) */}
        <div className="ak-h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
};