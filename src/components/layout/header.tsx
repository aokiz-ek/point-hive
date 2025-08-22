'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { Dropdown, MenuProps } from 'antd';
import { 
  Bell, 
  User, 
  Settings,
  Database,
  Crown,
  Flame,
  Zap
} from 'lucide-react';

interface HeaderProps {}

export const Header: React.FC<HeaderProps> = () => {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(3); // Mock数据

  const user = {
    name: 'Wade',
    avatar: '',
    creditScore: 852,
    level: 15,
    title: '积分大师',
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <User className="ak-w-4 ak-h-4 ak-text-amber-400" />,
      label: (
        <span className="ak-text-gray-200 ak-hover:text-amber-400 ak-transition-colors">
          个人资料
        </span>
      ),
      onClick: () => router.push('/profile'),
    },
    {
      key: 'config',
      icon: <Database className="ak-w-4 ak-h-4 ak-text-amber-400" />,
      label: (
        <span className="ak-text-gray-200 ak-hover:text-amber-400 ak-transition-colors">
          存储配置
        </span>
      ),
      onClick: () => router.push('/config'),
    },
    {
      key: 'settings',
      icon: <Settings className="ak-w-4 ak-h-4 ak-text-amber-400" />,
      label: (
        <span className="ak-text-gray-200 ak-hover:text-amber-400 ak-transition-colors">
          系统设置
        </span>
      ),
      onClick: () => router.push('/settings'),
    },
  ];

  return (
    <header className="ak-sticky ak-top-0 ak-z-50 ak-w-full ak-bg-gradient-to-r ak-from-gray-900 ak-via-gray-800 ak-to-gray-900 ak-border-b ak-border-amber-500/20 ak-shadow-2xl ak-shadow-amber-500/10">
      {/* 装饰性顶部光线 */}
      <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-amber-400 ak-to-transparent ak-opacity-60"></div>
      
      <div className="ak-flex ak-h-16 ak-mx-4 sm:ak-mx-6 ak-items-center ak-justify-between">
        {/* Logo */}
        <Link href="/" className="ak-flex ak-items-center ak-space-x-3 ak-group">
          <div className="ak-relative">
            <Crown className="ak-h-7 ak-w-7 ak-text-amber-400 ak-drop-shadow-lg ak-transition-all ak-duration-300 ak-group-hover:ak-text-amber-300 ak-group-hover:ak-scale-110" />
            <div className="ak-absolute ak-inset-0 ak-bg-amber-400 ak-opacity-20 ak-blur-sm ak-rounded-full ak-group-hover:ak-opacity-30 ak-transition-opacity"></div>
          </div>
          <div className="ak-flex ak-flex-col">
            <span className="ak-text-lg sm:ak-text-xl ak-font-bold ak-bg-gradient-to-r ak-from-amber-300 ak-via-amber-400 ak-to-amber-500 ak-bg-clip-text ak-text-transparent ak-drop-shadow-sm">
              Point-Hive
            </span>
            <span className="ak-text-xs ak-text-amber-600/80 ak-font-medium ak-hidden sm:ak-block">
              积分蜂巢
            </span>
          </div>
        </Link>

        <div className="ak-flex ak-items-center ak-space-x-3 sm:ak-space-x-4">
          {/* 通知 */}
          <Button
            variant="ghost"
            size="icon"
            className="ak-relative ak-bg-gray-800/50 ak-border ak-border-amber-500/20 ak-hover:ak-bg-amber-500/5 ak-hover:ak-border-amber-500/30 ak-transition-all ak-duration-300 ak-group"
          >
            <Bell className="ak-h-4 ak-w-4 ak-text-amber-400 ak-group-hover:ak-text-amber-300 ak-transition-colors" />
            {notifications > 0 && (
              <div className="ak-absolute ak--top-1 ak--right-1 ak-h-4 ak-w-4 ak-rounded-full ak-bg-gradient-to-br ak-from-red-500 ak-to-red-600 ak-border ak-border-red-400 ak-flex ak-items-center ak-justify-center ak-shadow-lg ak-animate-pulse">
                <span className="ak-text-xs ak-text-white ak-font-bold">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              </div>
            )}
            <div className="ak-absolute ak-inset-0 ak-bg-amber-400 ak-opacity-0 ak-group-hover:ak-opacity-5 ak-rounded ak-transition-opacity"></div>
          </Button>

          {/* 用户菜单 */}
          <Dropdown 
            menu={{ 
              items: userMenuItems,
              className: 'ak-bg-gray-800 ak-border ak-border-amber-500/20 ak-shadow-2xl ak-shadow-amber-500/20'
            }}
            placement="bottomRight"
            trigger={['click']}
            overlayClassName="ak-custom-dropdown"
          >
            <Button
              variant="ghost"
              className="ak-flex ak-items-center ak-space-x-3 ak-px-3 ak-py-2 ak-bg-gray-800/50 ak-border ak-border-amber-500/20 ak-hover:ak-bg-amber-500/5 ak-hover:ak-border-amber-500/30 ak-transition-all ak-duration-300 ak-group ak-rounded-lg"
            >
              {/* 用户头像 */}
              <div className="ak-relative">
                <div className="ak-h-9 ak-w-9 ak-rounded-full ak-bg-gradient-to-br ak-from-amber-400 ak-via-amber-500 ak-to-amber-600 ak-p-0.5 ak-shadow-lg ak-shadow-amber-500/30">
                  <div className="ak-h-full ak-w-full ak-rounded-full ak-bg-gray-900 ak-flex ak-items-center ak-justify-center">
                    <span className="ak-text-sm ak-font-bold ak-text-amber-400">
                      {user.name[0] || 'W'}
                    </span>
                  </div>
                </div>
                <div className="ak-absolute ak--top-1 ak--right-1">
                  <div className="ak-bg-gradient-to-r ak-from-amber-400 ak-to-amber-500 ak-text-gray-900 ak-text-xs ak-font-bold ak-px-1.5 ak-py-0.5 ak-rounded-full ak-shadow-md">
                    {user.level}
                  </div>
                </div>
              </div>

              {/* 用户信息 */}
              <div className="ak-hidden sm:ak-block ak-text-left">
                <div className="ak-flex ak-items-center ak-space-x-1">
                  <span className="ak-text-sm ak-font-bold ak-text-amber-300">{user.name}</span>
                  <Flame className="ak-h-3 ak-w-3 ak-text-amber-500" />
                </div>
                <div className="ak-flex ak-items-center ak-space-x-1">
                  <span className="ak-text-xs ak-text-amber-600">{user.title}</span>
                  <Zap className="ak-h-2.5 ak-w-2.5 ak-text-amber-500" />
                  <span className="ak-text-xs ak-text-amber-500 ak-font-medium">{user.creditScore}</span>
                </div>
              </div>

              {/* 下拉箭头 */}
              <div className="ak-text-amber-400 ak-group-hover:ak-text-amber-300 ak-transition-colors">
                <svg className="ak-w-4 ak-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* 底部装饰性光效 */}
      <div className="ak-absolute ak-bottom-0 ak-left-0 ak-right-0 ak-h-px ak-bg-gradient-to-r ak-from-transparent ak-via-amber-500/30 ak-to-transparent"></div>
    </header>
  );
};