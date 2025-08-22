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
  Hexagon
} from 'lucide-react';

interface HeaderProps {}

export const Header: React.FC<HeaderProps> = () => {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(3); // Mock数据

  const user = {
    name: 'Wade',
    avatar: '',
    creditScore: 852,
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <User className="ak-w-4 ak-h-4" />,
      label: '个人资料',
      onClick: () => router.push('/profile'),
    },
    {
      key: 'config',
      icon: <Database className="ak-w-4 ak-h-4" />,
      label: '存储配置',
      onClick: () => router.push('/config'),
    },
    {
      key: 'settings',
      icon: <Settings className="ak-w-4 ak-h-4" />,
      label: '系统设置',
      onClick: () => router.push('/settings'),
    },
  ];

  return (
    <header className="ak-sticky ak-top-0 ak-z-40 ak-w-full ak-border-b ak-border-border ak-bg-background/95 ak-backdrop-blur ak-supports-[backdrop-filter]:bg-background/60">
      <div className="ak-flex ak-h-14 ak-mx-6 ak-items-center ak-justify-between">
        {/* Logo */}
        <Link href="/" className="ak-flex ak-items-center ak-space-x-2">
          <Hexagon className="ak-h-6 ak-w-6 ak-text-ak-primary-500" />
          <span className="ak-text-gradient ak-font-bold">Point-Hive</span>
        </Link>

        <div className="ak-flex ak-items-center ak-space-x-4">
          {/* 通知 */}
          <Button
            variant="ghost"
            size="icon"
            className="ak-relative"
          >
            <Bell className="ak-h-4 ak-w-4" />
            {notifications > 0 && (
              <span className="ak-absolute ak--top-1 ak--right-1 ak-h-3 ak-w-3 ak-rounded-full ak-bg-destructive ak-text-xs ak-text-white ak-flex ak-items-center ak-justify-center">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
            <span className="ak-sr-only">通知</span>
          </Button>

          {/* 用户菜单 */}
          <Dropdown 
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button
              variant="ghost"
              className="ak-flex ak-items-center ak-space-x-2 ak-px-2"
            >
              <div className="ak-h-8 ak-w-8 ak-rounded-full ak-bg-gradient-to-br ak-from-ak-primary-400 ak-to-ak-primary-600 ak-flex ak-items-center ak-justify-center ak-text-white ak-text-sm ak-font-medium">
                {user.name[0] || 'U'}
              </div>
              <div className="ak-hidden sm:ak-block ak-text-left">
                <div className="ak-text-sm ak-font-medium">{user.name}</div>
                <div className="ak-text-xs ak-text-muted-foreground">
                  信用: {user.creditScore}
                </div>
              </div>
            </Button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};