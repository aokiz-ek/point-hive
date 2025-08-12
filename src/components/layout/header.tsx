'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { 
  Menu, 
  Bell, 
  Search, 
  User, 
  Settings,
  LogOut,
  Hexagon
} from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
  showMobileMenu?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  showMobileMenu = false 
}) => {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState(3); // Mock数据

  const navigation = [
    { name: '数据面板', href: '/dashboard', current: pathname === '/dashboard' },
    { name: '我的群组', href: '/groups', current: pathname.startsWith('/groups') },
    { name: '交易记录', href: '/transactions', current: pathname.startsWith('/transactions') },
    { name: '数据统计', href: '/analytics', current: pathname.startsWith('/analytics') },
  ];

  const user = {
    name: '用户名',
    avatar: '',
    creditScore: 852,
  };

  return (
    <header className="ak-sticky ak-top-0 ak-z-40 ak-w-full ak-border-b ak-border-border ak-bg-background/95 ak-backdrop-blur ak-supports-[backdrop-filter]:bg-background/60">
      <div className=" ak-flex ak-h-14 ak-mx-6 ak-items-center">
        {/* 移动端菜单按钮 */}
        {showMobileMenu && (
          <Button
            variant="ghost"
            size="icon"
            className="ak-mr-2 lg:ak-hidden"
            onClick={onMenuClick}
          >
            <Menu className="ak-h-5 ak-w-5" />
            <span className="ak-sr-only">打开菜单</span>
          </Button>
        )}

        {/* Logo */}
        <Link href="/dashboard" className="ak-flex ak-items-center ak-space-x-2">
          <Hexagon className="ak-h-6 ak-w-6 ak-text-ak-primary-500" />
          <span className="ak-text-gradient ak-font-bold">Point-Hive</span>
        </Link>

        {/* 桌面端导航 */}
        <nav className="ak-hidden ak-ml-8 lg:ak-flex ak-space-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'ak-text-sm ak-font-medium ak-transition-colors hover:ak-text-primary',
                item.current
                  ? 'ak-text-black ak-dark:text-white'
                  : 'ak-text-muted-foreground'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="ak-flex ak-flex-1 ak-items-center ak-justify-end ak-space-x-4">
          {/* 搜索 */}
          <div className="ak-relative ak-hidden sm:ak-block">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={cn(
                'ak-transition-colors',
                isSearchOpen && 'ak-bg-accent ak-text-accent-foreground'
              )}
            >
              <Search className="ak-h-4 ak-w-4" />
              <span className="ak-sr-only">搜索</span>
            </Button>
            
            {isSearchOpen && (
              <div className="ak-absolute ak-right-0 ak-top-full ak-mt-1 ak-w-80 ak-rounded-md ak-border ak-bg-popover ak-p-4 ak-shadow-md">
                <div className="ak-space-y-2">
                  <input
                    type="text"
                    placeholder="搜索群组、用户..."
                    className="ak-input ak-w-full"
                    autoFocus
                  />
                  <div className="ak-text-xs ak-text-muted-foreground">
                    快捷键：⌘ K
                  </div>
                </div>
              </div>
            )}
          </div>

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
          <div className="ak-relative ak-group">
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

            {/* 用户下拉菜单 */}
            <div className="ak-absolute ak-right-0 ak-top-full ak-mt-1 ak-w-48 ak-rounded-md ak-border ak-bg-popover ak-py-1 ak-shadow-md ak-opacity-0 ak-invisible ak-group-hover:opacity-100 ak-group-hover:visible ak-transition-all ak-duration-200">
              <Link
                href="/profile"
                className="ak-flex ak-items-center ak-px-4 ak-py-2 ak-text-sm hover:ak-bg-accent hover:ak-text-accent-foreground ak-transition-colors"
              >
                <User className="ak-mr-2 ak-h-4 ak-w-4" />
                个人资料
              </Link>
              <Link
                href="/settings"
                className="ak-flex ak-items-center ak-px-4 ak-py-2 ak-text-sm hover:ak-bg-accent hover:ak-text-accent-foreground ak-transition-colors"
              >
                <Settings className="ak-mr-2 ak-h-4 ak-w-4" />
                设置
              </Link>
              <div className="ak-border-t ak-my-1" />
              <button
                onClick={() => {/* 登出逻辑 */}}
                className="ak-flex ak-w-full ak-items-center ak-px-4 ak-py-2 ak-text-sm ak-text-destructive hover:ak-bg-destructive/10 ak-transition-colors"
              >
                <LogOut className="ak-mr-2 ak-h-4 ak-w-4" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 移动端搜索栏 */}
      {isSearchOpen && (
        <div className="ak-border-t ak-p-4 sm:ak-hidden">
          <input
            type="text"
            placeholder="搜索群组、用户..."
            className="ak-input ak-w-full"
            autoFocus
          />
        </div>
      )}
    </header>
  );
};