'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import {
  Home,
  Users,
  ArrowLeftRight,
  TrendingUp,
  Settings,
  Plus,
  QrCode,
  Star,
  Clock,
  BarChart3,
  Shield,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Wallet,
  RotateCcw,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  className,
}) => {
  const pathname = usePathname();

  const navigation = [
    {
      name: '积分大厅',
      href: '/hall',
      icon: Home,
      current: pathname === '/hall',
      badge: null,
    },
    {
      name: '我的群组',
      href: '/groups',
      icon: Users,
      current: pathname.startsWith('/groups'),
      badge: '3',
    },
    {
      name: '积分转移',
      href: '/transfer',
      icon: ArrowLeftRight,
      current: pathname.startsWith('/transfer'),
      badge: null,
    },
    {
      name: '余额中心',
      href: '/balance',
      icon: Wallet,
      current: pathname.startsWith('/balance'),
      badge: null,
    },
    {
      name: '积分归还',
      href: '/return',
      icon: RotateCcw,
      current: pathname.startsWith('/return'),
      badge: null,
    },
    {
      name: '交易记录',
      href: '/transactions',
      icon: Clock,
      current: pathname.startsWith('/transactions'),
      badge: null,
    },
    {
      name: '数据统计',
      href: '/stats',
      icon: BarChart3,
      current: pathname.startsWith('/stats'),
      badge: null,
    },
    {
      name: '信用中心',
      href: '/credit',
      icon: Star,
      current: pathname.startsWith('/credit'),
      badge: null,
    },
    {
      name: '排行榜',
      href: '/leaderboard',
      icon: TrendingUp,
      current: pathname.startsWith('/leaderboard'),
      badge: null,
    },
    {
      name: '用户评价',
      href: '/ratings',
      icon: Shield,
      current: pathname.startsWith('/ratings'),
      badge: null,
    },
    {
      name: '统一结算',
      href: '/settlement',
      icon: BarChart3,
      current: pathname.startsWith('/settlement'),
      badge: null,
    },
    {
      name: '通知中心',
      href: '/notifications',
      icon: HelpCircle,
      current: pathname.startsWith('/notifications'),
      badge: '3',
    },
  ];

  const quickActions = [
    {
      name: '创建群组',
      href: '/groups/create',
      icon: Plus,
      variant: 'primary' as const,
    },
    {
      name: '扫码加入',
      href: '/groups/join',
      icon: QrCode,
      variant: 'secondary' as const,
    },
  ];

  const bottomNavigation = [
    {
      name: '设置',
      href: '/settings',
      icon: Settings,
      current: pathname.startsWith('/settings'),
    },
    {
      name: '帮助',
      href: '/help',
      icon: HelpCircle,
      current: pathname.startsWith('/help'),
    },
  ];

  return (
    <>
      {/* 遮罩层 (移动端) */}
      {isOpen && (
        <div
          className="ak-fixed ak-inset-0 ak-z-20 ak-bg-black/20 ak-backdrop-blur-sm lg:ak-hidden"
          onClick={onToggle}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          'ak-fixed ak-inset-y-0 ak-left-0 ak-z-30 ak-flex ak-flex-col ak-w-64 ak-bg-background ak-border-r ak-transition-transform ak-duration-300 lg:ak-static lg:ak-translate-x-0',
          isOpen ? 'ak-translate-x-0' : 'ak--translate-x-full',
          className
        )}
      >
        {/* 侧边栏头部 */}
        <div className="ak-flex ak-items-center ak-justify-between ak-p-4 ak-border-b">
          <h2 className="ak-text-lg ak-font-semibold ak-text-gradient">导航菜单</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="ak-hidden lg:ak-flex"
          >
            {isOpen ? (
              <ChevronLeft className="ak-h-4 ak-w-4" />
            ) : (
              <ChevronRight className="ak-h-4 ak-w-4" />
            )}
            <span className="ak-sr-only">切换侧边栏</span>
          </Button>
        </div>

        {/* 快捷操作 */}
        <div className="ak-p-4 ak-space-y-2">
          <h3 className="ak-text-xs ak-font-medium ak-text-muted-foreground ak-uppercase ak-tracking-wider">
            快捷操作
          </h3>
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <Button
                variant={action.variant}
                className="ak-w-full ak-justify-start ak-h-9"
              >
                <action.icon className="ak-mr-2 ak-h-4 ak-w-4" />
                {action.name}
              </Button>
            </Link>
          ))}
        </div>

        {/* 主导航 */}
        <div className="ak-flex-1 ak-px-4 ak-space-y-1">
          <h3 className="ak-text-xs ak-font-medium ak-text-muted-foreground ak-uppercase ak-tracking-wider ak-mb-3">
            主功能
          </h3>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'ak-flex ak-items-center ak-justify-between ak-rounded-md ak-px-3 ak-py-2 ak-text-sm ak-font-medium ak-transition-colors ak-group',
                item.current
                  ? 'ak-bg-accent ak-text-accent-foreground'
                  : 'ak-text-muted-foreground hover:ak-bg-accent hover:ak-text-accent-foreground'
              )}
            >
              <div className="ak-flex ak-items-center">
                <item.icon
                  className={cn(
                    'ak-mr-3 ak-h-4 ak-w-4',
                    item.current
                      ? 'ak-text-accent-foreground'
                      : 'ak-text-muted-foreground ak-group-hover:text-accent-foreground'
                  )}
                />
                {item.name}
              </div>
              {item.badge && (
                <span className="ak-bg-ak-primary-500 ak-text-white ak-text-xs ak-rounded-full ak-px-2 ak-py-0.5 ak-min-w-[20px] ak-text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* 底部导航 */}
        <div className="ak-border-t ak-p-4 ak-space-y-1">
          {bottomNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'ak-flex ak-items-center ak-rounded-md ak-px-3 ak-py-2 ak-text-sm ak-font-medium ak-transition-colors ak-group',
                item.current
                  ? 'ak-bg-accent ak-text-accent-foreground'
                  : 'ak-text-muted-foreground hover:ak-bg-accent hover:ak-text-accent-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'ak-mr-3 ak-h-4 ak-w-4',
                  item.current
                    ? 'ak-text-accent-foreground'
                    : 'ak-text-muted-foreground ak-group-hover:text-accent-foreground'
                )}
              />
              {item.name}
            </Link>
          ))}
        </div>

        {/* 用户信息 */}
        <div className="ak-border-t ak-p-4">
          <div className="ak-flex ak-items-center ak-space-x-3">
            <div className="ak-h-8 ak-w-8 ak-rounded-full ak-bg-gradient-to-br ak-from-ak-primary-400 ak-to-ak-primary-600 ak-flex ak-items-center ak-justify-center ak-text-white ak-text-sm ak-font-medium">
              U
            </div>
            <div className="ak-flex-1 ak-min-w-0">
              <div className="ak-text-sm ak-font-medium ak-truncate">
                用户名
              </div>
              <div className="ak-text-xs ak-text-muted-foreground ak-truncate">
                信用分数: 852
              </div>
            </div>
            <Shield className="ak-h-4 ak-w-4 ak-text-green-500" />
          </div>
        </div>
      </aside>
    </>
  );
};