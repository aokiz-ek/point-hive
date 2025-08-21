'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks';
import { LocalStorage, formatDate, formatDateTime } from '@/lib/utils/local-storage';
import type { Notification } from '@/lib/types/extended';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    loadNotifications();
    setupNotificationListener();
  }, [user]);

  const loadNotifications = () => {
    if (!user) return;

    setLoading(true);
    try {
      const allNotifications = LocalStorage.getNotifications();
      const userNotifications = allNotifications.filter(n => n.userId === user.id);
      
      // 按时间排序
      const sortedNotifications = userNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setNotifications(sortedNotifications);
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupNotificationListener = () => {
    // 监听存储变化，实时更新通知
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'point-hive-notifications') {
        loadNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const markAsRead = (notificationId: string) => {
    LocalStorage.markNotificationRead(notificationId);
    loadNotifications();
  };

  const markAllAsRead = () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    unreadNotifications.forEach(n => LocalStorage.markNotificationRead(n.id));
    loadNotifications();
  };

  const deleteNotification = (notificationId: string) => {
    const allNotifications = LocalStorage.getNotifications();
    const updatedNotifications = allNotifications.filter(n => n.id !== notificationId);
    LocalStorage.setNotifications(updatedNotifications);
    loadNotifications();
  };

  const clearAllNotifications = () => {
    if (user && confirm('确定要清空所有通知吗？')) {
      const allNotifications = LocalStorage.getNotifications();
      const userNotifications = allNotifications.filter(n => n.userId !== user.id);
      LocalStorage.setNotifications(userNotifications);
      loadNotifications();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transfer_request': return '💸';
      case 'transfer_approved': return '✅';
      case 'transfer_rejected': return '❌';
      case 'return_reminder': return '⏰';
      case 'credit_updated': return '📈';
      case 'group_invite': return '📧';
      case 'join_request': return '👥';
      case 'join_request_approved': return '🎉';
      case 'join_request_rejected': return '😞';
      case 'group_member_joined': return '👋';
      case 'group_member_removed': return '👋';
      case 'group_updated': return '⚙️';
      case 'group_deleted': return '🗑️';
      case 'return_completed': return '↩️';
      case 'settlement_completed': return '📊';
      case 'system_message': return '📢';
      default: return '📢';
    }
  };

  const getNotificationColor = (type: string, read: boolean) => {
    if (read) return 'ak-bg-gray-50';
    
    switch (type) {
      case 'transfer_request': return 'ak-bg-blue-50';
      case 'transfer_approved': return 'ak-bg-green-50';
      case 'transfer_rejected': return 'ak-bg-red-50';
      case 'return_reminder': return 'ak-bg-orange-50';
      case 'credit_updated': return 'ak-bg-purple-50';
      case 'group_invite': return 'ak-bg-indigo-50';
      case 'join_request': return 'ak-bg-yellow-50';
      case 'join_request_approved': return 'ak-bg-green-50';
      case 'join_request_rejected': return 'ak-bg-red-50';
      case 'group_member_joined': return 'ak-bg-green-50';
      case 'group_member_removed': return 'ak-bg-red-50';
      case 'group_updated': return 'ak-bg-blue-50';
      case 'group_deleted': return 'ak-bg-red-50';
      case 'return_completed': return 'ak-bg-green-50';
      case 'settlement_completed': return 'ak-bg-purple-50';
      case 'system_message': return 'ak-bg-gray-50';
      default: return 'ak-bg-gray-50';
    }
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  if (loading) {
    return (
      <div className="ak-flex ak-items-center ak-justify-center ak-py-12">
        <div className="ak-animate-spin ak-rounded-full ak-h-8 ak-w-8 ak-border-b-2 ak-border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="ak-space-y-6">
      {/* 页面标题 */}
      <div className="ak-flex ak-items-center ak-justify-between">
        <div>
          <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">通知中心</h1>
          <p className="ak-text-gray-600">查看您的最新通知和消息</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            全部标记为已读
          </Button>
        )}
      </div>

      {/* 通知统计 */}
      <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-3 ak-gap-6">
        <Card className="ak-p-4 ak-bg-blue-50">
          <div className="ak-text-center">
            <p className="ak-text-sm ak-text-gray-600">全部通知</p>
            <p className="ak-text-2xl ak-font-bold ak-text-blue-600">
              {notifications.length}
            </p>
          </div>
        </Card>
        <Card className="ak-p-4 ak-bg-orange-50">
          <div className="ak-text-center">
            <p className="ak-text-sm ak-text-gray-600">未读通知</p>
            <p className="ak-text-2xl ak-font-bold ak-text-orange-600">
              {unreadCount}
            </p>
          </div>
        </Card>
        <Card className="ak-p-4 ak-bg-green-50">
          <div className="ak-text-center">
            <p className="ak-text-sm ak-text-gray-600">已读通知</p>
            <p className="ak-text-2xl ak-font-bold ak-text-green-600">
              {notifications.filter(n => n.read).length}
            </p>
          </div>
        </Card>
      </div>

      {/* 筛选器 */}
      <Card className="ak-p-4">
        <div className="ak-flex ak-space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            全部 ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            onClick={() => setFilter('unread')}
          >
            未读 ({unreadCount})
          </Button>
          <Button
            variant={filter === 'read' ? 'default' : 'outline'}
            onClick={() => setFilter('read')}
          >
            已读 ({notifications.filter(n => n.read).length})
          </Button>
        </div>
      </Card>

      {/* 通知列表 */}
      <Card className="ak-p-6">
        <div className="ak-flex ak-items-center ak-justify-between ak-mb-4">
          <h3 className="ak-text-lg ak-font-semibold">通知列表</h3>
          {notifications.length > 0 && (
            <Button onClick={clearAllNotifications} variant="outline" size="sm">
              清空所有
            </Button>
          )}
        </div>

        {filteredNotifications.length > 0 ? (
          <div className="ak-space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`ak-p-4 ak-border ak-rounded-lg ak-transition-colors ${
                  getNotificationColor(notification.type, notification.read)
                } ${!notification.read ? 'ak-border-l-4 ak-border-l-blue-500' : ''}`}
              >
                <div className="ak-flex ak-items-start ak-justify-between">
                  <div className="ak-flex ak-items-start ak-space-x-3 ak-flex-1">
                    <div className="ak-text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="ak-flex-1">
                      <div className="ak-flex ak-items-center ak-justify-between ak-mb-1">
                        <h4 className="ak-font-medium ak-text-gray-900">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="ak-bg-blue-500 ak-text-white ak-text-xs ak-px-2 ak-py-1 ak-rounded-full">
                            新
                          </span>
                        )}
                      </div>
                      <p className="ak-text-sm ak-text-gray-600 ak-mb-2">
                        {notification.message}
                      </p>
                      <div className="ak-flex ak-items-center ak-justify-between ak-text-xs ak-text-gray-500">
                        <span>{formatDateTime(notification.createdAt)}</span>
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                            className="ak-text-blue-600 hover:ak-text-blue-800"
                          >
                            标记为已读
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteNotification(notification.id)}
                    className="ak-text-gray-400 hover:ak-text-red-600"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ak-text-center ak-py-8 ak-text-gray-500">
            <div className="ak-text-6xl ak-mb-4">🔕</div>
            <p className="ak-text-lg ak-font-medium ak-text-gray-900 ak-mb-2">
              {filter === 'unread' ? '没有未读通知' : '暂无通知'}
            </p>
            <p className="ak-text-gray-600">
              {filter === 'unread' ? '太棒了！您已阅读所有通知' : '开始使用后将收到相关通知'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}