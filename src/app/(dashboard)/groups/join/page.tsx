'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/hooks';
import { LocalStorage, generateId } from '@/lib/utils/local-storage';
import type { Group } from '@/lib/types';

export default function JoinGroupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [joinRequests, setJoinRequests] = useState<Record<string, 'pending' | 'approved' | 'rejected'>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 获取所有群组
  const groups = LocalStorage.getGroups();
  
  // 过滤出用户已经加入的群组
  const joinedGroupIds = user ? groups.filter(g => g.memberIds?.includes(user.id)).map(g => g.id) : [];
  
  // 过滤出可加入的群组
  const availableGroups = groups.filter(group => {
    // 用户未加入
    if (joinedGroupIds.includes(group.id)) return false;
    // 群组未满员
    if ((group.memberIds?.length || 0) >= group.maxMembers) return false;
    // 公开群组或搜索匹配
    return group.isPublic || (searchTerm && 
      (group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       group.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  });

  const filteredGroups = availableGroups.filter(group => {
    if (!searchTerm) return true;
    return group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           group.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleJoinGroup = async (group: Group) => {
    if (!user) return;

    setLoading(true);
    try {
      if (group.rules?.requireApproval || group.requireApproval) {
        // 需要审批的群组，创建加入申请
        const joinRequest = {
          id: generateId(),
          groupId: group.id,
          userId: user.id,
          userName: user.nickname,
          message: '',
          status: 'pending' as const,
          createdAt: new Date().toISOString()
        };

        // 保存申请到本地存储
        const existingRequests = LocalStorage.getItem<any[]>('point-hive-join-requests') || [];
        existingRequests.push(joinRequest);
        LocalStorage.setItem('point-hive-join-requests', existingRequests);

        setJoinRequests(prev => ({ ...prev, [group.id]: 'pending' }));
        
        // 发送通知给群组管理员
        group.adminIds.forEach(adminId => {
          const notification = {
            id: generateId(),
            type: 'join_request' as const,
            title: '新的加入申请',
            message: `${user.nickname} 申请加入群组 "${group.name}"`,
            userId: adminId,
            read: false,
            isRead: false,
            createdAt: new Date().toISOString(),
            metadata: {
              groupId: group.id,
              requestId: joinRequest.id,
              applicantId: user.id
            }
          };
          LocalStorage.addNotification(notification);
        });

      } else {
        // 直接加入群组
        const updatedGroup = {
          ...group,
          memberIds: [...group.memberIds, user.id],
          updatedAt: new Date().toISOString()
        };

        LocalStorage.updateGroup(group.id, updatedGroup);

        // 创建加入记录
        const joinTransaction = {
          id: generateId(),
          type: 'system' as const,
          fromUserId: 'system',
          toUserId: user.id,
          amount: 0,
          status: 'completed' as const,
          description: `加入群组 "${group.name}"`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          groupId: group.id,
          metadata: {
            tags: ['group_join'],
            priority: 'normal' as const
          }
        };

        if (joinTransaction.amount > 0) {
          LocalStorage.addTransaction(joinTransaction);
        }

        setJoinRequests(prev => ({ ...prev, [group.id]: 'approved' }));
        
        // 发送通知给群组成员
        group.memberIds.forEach(memberId => {
          if (memberId !== user.id) {
            const notification = {
              id: generateId(),
              type: 'group_member_joined' as const,
              title: '新成员加入',
              message: `${user.nickname} 加入了群组 "${group.name}"`,
              userId: memberId,
              read: false,
              isRead: false,
              createdAt: new Date().toISOString(),
              metadata: {
                groupId: group.id,
                newMemberId: user.id
              }
            };
            LocalStorage.addNotification(notification);
          }
        });

        // 跳转到群组详情页
        setTimeout(() => {
          router.push(`/groups/${group.id}`);
        }, 1500);
      }
    } catch (error) {
      console.error('加入群组失败:', error);
      setErrors({ submit: '加入群组失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const getJoinStatusText = (status: string | undefined) => {
    switch (status) {
      case 'pending':
        return '待审批';
      case 'approved':
        return '已加入';
      case 'rejected':
        return '已拒绝';
      default:
        return '加入群组';
    }
  };

  const getJoinStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'pending':
        return 'ak-bg-orange-100 ak-text-orange-800';
      case 'approved':
        return 'ak-bg-green-100 ak-text-green-800';
      case 'rejected':
        return 'ak-bg-red-100 ak-text-red-800';
      default:
        return '';
    }
  };

  return (
    <div className="ak-space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">加入群组</h1>
        <p className="ak-text-gray-600">发现并加入合适的积分管理群组</p>
      </div>

      {/* 搜索框 */}
      <Card className="ak-p-4">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索群组名称、描述或标签..."
        />
      </Card>

      {/* 群组列表 */}
      {filteredGroups.length > 0 ? (
        <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 lg:ak-grid-cols-3 ak-gap-6">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="ak-p-6 ak-hover:shadow-lg ak-transition-shadow">
              <div className="ak-flex ak-items-start ak-justify-between ak-mb-4">
                <div className="ak-flex-1">
                  <h3 className="ak-text-lg ak-font-semibold ak-text-gray-900 ak-mb-2">
                    {group.name}
                  </h3>
                  <p className="ak-text-gray-600 ak-text-sm ak-line-clamp-2">
                    {group.description}
                  </p>
                </div>
                <div className="ak-flex ak-items-center ak-space-x-1">
                  {group.requireApproval && (
                    <span className="ak-bg-orange-100 ak-text-orange-800 ak-text-xs ak-px-2 ak-py-1 ak-rounded-full">
                      需审批
                    </span>
                  )}
                  {group.isPublic && (
                    <span className="ak-bg-green-100 ak-text-green-800 ak-text-xs ak-px-2 ak-py-1 ak-rounded-full">
                      公开
                    </span>
                  )}
                </div>
              </div>

              <div className="ak-grid ak-grid-cols-2 ak-gap-4 ak-mb-4 ak-text-sm">
                <div>
                  <p className="ak-text-gray-500">成员数量</p>
                  <p className="ak-font-semibold">
                    {group.memberIds.length}/{group.maxMembers}
                  </p>
                </div>
                <div>
                  <p className="ak-text-gray-500">总积分</p>
                  <p className="ak-font-semibold ak-text-green-600">
                    {(group.totalPoints || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {group.settings?.pointsPerMember && group.settings.pointsPerMember > 0 && (
                <div className="ak-mb-4">
                  <p className="ak-text-sm ak-text-gray-600">
                    加入可获得 <span className="ak-font-semibold ak-text-blue-600">
                      {(group.settings.pointsPerMember || 0).toLocaleString()}
                    </span> 积分
                  </p>
                </div>
              )}

              <div className="ak-flex ak-flex-wrap ak-gap-2 ak-mb-4">
                {group.tags.map((tag) => (
                  <span
                    key={tag}
                    className="ak-bg-gray-100 ak-text-gray-700 ak-text-xs ak-px-2 ak-py-1 ak-rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="ak-flex ak-items-center ak-justify-between">
                <div className="ak-text-xs ak-text-gray-500">
                  创建于 {new Date(group.createdAt).toLocaleDateString()}
                </div>
                <Button
                  onClick={() => handleJoinGroup(group)}
                  disabled={loading || joinRequests[group.id] !== undefined}
                  size="sm"
                  className={getJoinStatusColor(joinRequests[group.id])}
                >
                  {getJoinStatusText(joinRequests[group.id])}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="ak-p-12 ak-text-center">
          <div className="ak-text-gray-400 ak-mb-4">
            <span className="ak-text-6xl">🔍</span>
          </div>
          <h3 className="ak-text-lg ak-font-semibold ak-text-gray-900 ak-mb-2">
            {searchTerm ? '未找到匹配的群组' : '暂无可加入的群组'}
          </h3>
          <p className="ak-text-gray-600 ak-mb-6">
            {searchTerm 
              ? '请尝试调整搜索条件或创建新群组'
              : '创建或搜索群组来开始管理积分'
            }
          </p>
          <div className="ak-flex ak-justify-center ak-space-x-3">
            <Button variant="outline" asChild>
              <a href="/groups">返回群组列表</a>
            </Button>
            <Button asChild>
              <a href="/groups/create">创建群组</a>
            </Button>
          </div>
        </Card>
      )}

      {/* 错误信息 */}
      {errors.submit && (
        <Card className="ak-p-4 ak-bg-red-50 ak-border ak-border-red-200">
          <p className="ak-text-sm ak-text-red-600">{errors.submit}</p>
        </Card>
      )}
    </div>
  );
}