'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/hooks';
import { LocalStorage, generateId } from '@/lib/utils/local-storage';
import type { Group, JoinRequest } from '@/lib/types';

export default function ManageGroupPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'settings' | 'requests'>('members');
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    maxMembers: 50,
    isPublic: true,
    requireApproval: false,
    tags: [] as string[],
    newTag: '',
    settings: {
      allowInvites: true,
      requireApprovalForTransfer: false,
      autoApproveSmallAmounts: true,
      maxTransferAmount: 5000,
      pointsPerMember: 0
    }
  });

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = () => {
    setLoading(true);
    try {
      const groups = LocalStorage.getGroups();
      const foundGroup = groups.find(g => g.id === groupId);
      
      if (!foundGroup) {
        router.push('/groups');
        return;
      }

      // 检查权限
      if (!foundGroup.adminIds.includes(user?.id || '') && foundGroup.ownerId !== user?.id) {
        router.push(`/groups/${groupId}`);
        return;
      }

      setGroup(foundGroup);
      setEditForm({
        name: foundGroup.name,
        description: foundGroup.description,
        maxMembers: foundGroup.maxMembers,
        isPublic: foundGroup.isPublic,
        requireApproval: foundGroup.requireApproval,
        tags: foundGroup.tags,
        newTag: '',
        settings: foundGroup.settings || {
          allowInvites: true,
          requireApprovalForTransfer: false,
          autoApproveSmallAmounts: true,
          maxTransferAmount: 5000,
          pointsPerMember: 0
        }
      });

      // 加入申请
      const requests = LocalStorage.getItem<JoinRequest[]>('point-hive-join-requests') || [];
      const groupRequests = requests.filter(r => r.groupId === groupId && r.status === 'pending');
      setJoinRequests(groupRequests);

    } catch (error) {
      console.error('加载群组数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!group) return;

    setUpdating(true);
    try {
      const updatedGroup: Group = {
        ...group,
        name: editForm.name,
        description: editForm.description,
        maxMembers: editForm.maxMembers,
        isPublic: editForm.isPublic,
        requireApproval: editForm.requireApproval,
        tags: editForm.tags,
        settings: editForm.settings,
        updatedAt: new Date().toISOString()
      };

      LocalStorage.updateGroup(groupId, updatedGroup);
      setGroup(updatedGroup);
      setEditMode(false);

      // 发送通知给群组成员
      group.memberIds.forEach(memberId => {
        if (memberId !== user?.id) {
          const notification = {
            id: generateId(),
            type: 'group_updated' as const,
            title: '群组信息已更新',
            message: `群组 "${updatedGroup.name}" 的信息已更新`,
            userId: memberId,
            read: false,
            createdAt: new Date().toISOString(),
            metadata: {
              groupId: groupId
            }
          };
          LocalStorage.addNotification(notification);
        }
      });

    } catch (error) {
      console.error('更新群组失败:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddTag = () => {
    if (editForm.newTag.trim() && !editForm.tags.includes(editForm.newTag.trim())) {
      setEditForm(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleJoinRequest = async (requestId: string, approved: boolean) => {
    if (!group) return;

    try {
      const requests = LocalStorage.getItem<JoinRequest[]>('point-hive-join-requests') || [];
      const requestIndex = requests.findIndex(r => r.id === requestId);
      
      if (requestIndex === -1) return;

      const request = requests[requestIndex];
      requests[requestIndex] = { ...request, status: approved ? 'approved' : 'rejected' };
      LocalStorage.setItem('point-hive-join-requests', requests);

      if (approved) {
        // 添加成员到群组
        const updatedGroup = {
          ...group,
          memberIds: [...group.memberIds, request.userId],
          updatedAt: new Date().toISOString()
        };
        LocalStorage.updateGroup(groupId, updatedGroup);

        // 发放积分
        if (group.settings?.pointsPerMember && group.settings.pointsPerMember > 0) {
          const pointsTransaction = {
            id: generateId(),
            type: 'system' as const,
            fromUserId: 'system',
            toUserId: request.userId,
            amount: group.settings.pointsPerMember,
            status: 'completed' as const,
            description: `加入群组 "${group.name}" 获得`,
            createdAt: new Date().toISOString(),
            groupId: groupId,
            metadata: {
              type: 'group_join_points',
              groupName: group.name
            }
          };
          LocalStorage.addTransaction(pointsTransaction);
        }

        // 通知申请人
        const approvalNotification = {
          id: generateId(),
          type: 'join_request_approved' as const,
          title: '加入申请已批准',
          message: `您加入群组 "${group.name}" 的申请已批准`,
          userId: request.userId,
          read: false,
          createdAt: new Date().toISOString(),
          metadata: {
            groupId: groupId
          }
        };
        LocalStorage.addNotification(approvalNotification);

        // 通知群组成员
        group.memberIds.forEach(memberId => {
          const notification = {
            id: generateId(),
            type: 'group_member_joined' as const,
            title: '新成员加入',
            message: `${request.userName} 加入了群组 "${group.name}"`,
            userId: memberId,
            read: false,
            createdAt: new Date().toISOString(),
            metadata: {
              groupId: groupId,
              newMemberId: request.userId
            }
          };
          LocalStorage.addNotification(notification);
        });
      } else {
        // 通知申请人
        const rejectionNotification = {
          id: generateId(),
          type: 'join_request_rejected' as const,
          title: '加入申请已拒绝',
          message: `您加入群组 "${group.name}" 的申请被拒绝`,
          userId: request.userId,
          read: false,
          createdAt: new Date().toISOString(),
          metadata: {
            groupId: groupId
          }
        };
        LocalStorage.addNotification(rejectionNotification);
      }

      // 刷新数据
      loadGroupData();

    } catch (error) {
      console.error('处理加入申请失败:', error);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (!group || memberId === user?.id) return; // 不能移除自己

    if (confirm('确定要将该成员移出群组吗？')) {
      try {
        const updatedGroup = {
          ...group,
          memberIds: group.memberIds.filter(id => id !== memberId),
          adminIds: group.adminIds.filter(id => id !== memberId),
          updatedAt: new Date().toISOString()
        };

        LocalStorage.updateGroup(groupId, updatedGroup);

        // 通知被移除的成员
        const notification = {
          id: generateId(),
          type: 'group_member_removed' as const,
          title: '已被移出群组',
          message: `您已被移出群组 "${group.name}"`,
          userId: memberId,
          read: false,
          createdAt: new Date().toISOString(),
          metadata: {
            groupId: groupId
          }
        };
        LocalStorage.addNotification(notification);

        // 通知其他成员
        group.memberIds.forEach(id => {
          if (id !== memberId && id !== user?.id) {
            const notification = {
              id: generateId(),
              type: 'group_member_removed' as const,
              title: '成员已移出',
              message: `有成员被移出群组 "${group.name}"`,
              userId: id,
              read: false,
              createdAt: new Date().toISOString(),
              metadata: {
                groupId: groupId,
                removedMemberId: memberId
              }
            };
            LocalStorage.addNotification(notification);
          }
        });

        loadGroupData();

      } catch (error) {
        console.error('移除成员失败:', error);
      }
    }
  };

  const handleDeleteGroup = () => {
    if (!group) return;

    if (confirm('确定要删除这个群组吗？此操作不可撤销！')) {
      try {
        LocalStorage.deleteGroup(groupId);
        
        // 通知所有成员
        group.memberIds.forEach(memberId => {
          if (memberId !== user?.id) {
            const notification = {
              id: generateId(),
              type: 'group_deleted' as const,
              title: '群组已删除',
              message: `群组 "${group.name}" 已被删除`,
              userId: memberId,
              read: false,
              createdAt: new Date().toISOString(),
              metadata: {
                groupId: groupId
              }
            };
            LocalStorage.addNotification(notification);
          }
        });

        router.push('/groups');

      } catch (error) {
        console.error('删除群组失败:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="ak-flex ak-items-center ak-justify-center ak-py-12">
        <div className="ak-animate-spin ak-rounded-full ak-h-8 ak-w-8 ak-border-b-2 ak-border-blue-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="ak-text-center ak-py-12">
        <p className="ak-text-gray-600">群组不存在或您没有管理权限</p>
        <Button className="ak-mt-4" onClick={() => router.push('/groups')}>
          返回群组列表
        </Button>
      </div>
    );
  }

  return (
    <div className="ak-space-y-6">
      {/* 页面标题 */}
      <div className="ak-flex ak-items-center ak-justify-between">
        <div>
          <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">管理群组</h1>
          <p className="ak-text-gray-600">管理群组 "{group.name}" 的设置和成员</p>
        </div>
        <div className="ak-flex ak-space-x-2">
          <Button variant="outline" asChild>
            <a href={`/groups/${groupId}`}>返回群组</a>
          </Button>
          {group.ownerId === user?.id && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteGroup}
              className="ak-bg-red-600 hover:ak-bg-red-700"
            >
              删除群组
            </Button>
          )}
        </div>
      </div>

      {/* 选项卡导航 */}
      <div className="ak-border-b">
        <div className="ak-flex ak-space-x-8">
          {[
            { id: 'members', name: '成员管理', count: group.memberIds.length },
            { id: 'settings', name: '群组设置' },
            { id: 'requests', name: '加入申请', count: joinRequests.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`ak-py-2 ak-px-1 ak-border-b-2 ak-font-medium ak-text-sm ak-flex ak-items-center ak-space-x-2 ${
                activeTab === tab.id
                  ? 'ak-border-blue-500 ak-text-blue-600'
                  : 'ak-border-transparent ak-text-gray-500 hover:ak-text-gray-700 hover:ak-border-gray-300'
              }`}
            >
              <span>{tab.name}</span>
              {tab.count !== undefined && (
                <span className="ak-bg-gray-100 ak-text-gray-600 ak-text-xs ak-px-2 ak-py-1 ak-rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 选项卡内容 */}
      {activeTab === 'members' && (
        <Card className="ak-p-6">
          <h3 className="ak-text-lg ak-font-semibold ak-mb-4">群组成员</h3>
          <div className="ak-space-y-3">
            {group.memberIds.map((memberId) => (
              <div key={memberId} className="ak-flex ak-items-center ak-justify-between ak-p-3 ak-border ak-rounded-lg">
                <div className="ak-flex ak-items-center ak-space-x-3">
                  <div className="ak-w-8 ak-h-8 ak-bg-blue-100 ak-rounded-full ak-flex ak-items-center ak-justify-center">
                    <span className="ak-text-sm ak-font-medium">用户</span>
                  </div>
                  <div>
                    <div className="ak-font-medium ak-text-gray-900">用户 {memberId}</div>
                    <div className="ak-text-sm ak-text-gray-600">
                      {memberId === group.ownerId && '群主'}
                      {group.adminIds.includes(memberId) && memberId !== group.ownerId && '管理员'}
                    </div>
                  </div>
                </div>
                <div className="ak-flex ak-items-center ak-space-x-2">
                  {memberId !== user?.id && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRemoveMember(memberId)}
                      className="ak-text-red-600 ak-border-red-200 hover:ak-bg-red-50"
                    >
                      移除
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card className="ak-p-6">
          <div className="ak-flex ak-items-center ak-justify-between ak-mb-4">
            <h3 className="ak-text-lg ak-font-semibold">群组设置</h3>
            {!editMode ? (
              <Button onClick={() => setEditMode(true)}>
                编辑设置
              </Button>
            ) : (
              <div className="ak-flex ak-space-x-2">
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  取消
                </Button>
                <Button onClick={handleUpdateGroup} disabled={updating}>
                  {updating ? '保存中...' : '保存'}
                </Button>
              </div>
            )}
          </div>

          <div className="ak-space-y-6">
            {/* 基本信息 */}
            <div className="ak-space-y-4">
              <h4 className="ak-font-medium ak-text-gray-900">基本信息</h4>
              
              <div>
                <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                  群组名称
                </label>
                {editMode ? (
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                ) : (
                  <p className="ak-text-gray-900">{group.name}</p>
                )}
              </div>

              <div>
                <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                  群组描述
                </label>
                {editMode ? (
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="ak-w-full ak-px-3 ak-py-2 ak-border ak-border-gray-300 ak-rounded-md ak-focus:outline-none ak-focus:ring-2 ak-focus:ring-blue-500 ak-focus:border-transparent"
                  />
                ) : (
                  <p className="ak-text-gray-900">{group.description}</p>
                )}
              </div>

              <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 ak-gap-4">
                <div>
                  <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                    最大成员数
                  </label>
                  {editMode ? (
                    <Input
                      type="number"
                      value={editForm.maxMembers}
                      onChange={(e) => setEditForm(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                      min={group.memberIds.length}
                      max={1000}
                    />
                  ) : (
                    <p className="ak-text-gray-900">{group.maxMembers}</p>
                  )}
                </div>

                <div>
                  <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                    新成员积分
                  </label>
                  {editMode ? (
                    <Input
                      type="number"
                      value={editForm.settings.pointsPerMember}
                      onChange={(e) => setEditForm(prev => ({ 
                        ...prev, 
                        settings: { ...prev.settings, pointsPerMember: parseInt(e.target.value) || 0 }
                      }))}
                      min={0}
                      max={100000}
                    />
                  ) : (
                    <p className="ak-text-gray-900">{group.settings?.pointsPerMember || 0}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 群组设置 */}
            <div className="ak-space-y-4">
              <h4 className="ak-font-medium ak-text-gray-900">群组设置</h4>
              
              <div className="ak-space-y-3">
                <label className="ak-flex ak-items-center ak-space-x-3">
                  <input
                    type="checkbox"
                    checked={editMode ? editForm.isPublic : group.isPublic}
                    onChange={(e) => editMode && setEditForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                    disabled={!editMode}
                    className="ak-w-4 ak-h-4 ak-text-blue-600 ak-border-gray-300 ak-rounded ak-focus:ring-blue-500"
                  />
                  <span className="ak-text-sm ak-text-gray-700">公开群组</span>
                </label>

                <label className="ak-flex ak-items-center ak-space-x-3">
                  <input
                    type="checkbox"
                    checked={editMode ? editForm.requireApproval : group.requireApproval}
                    onChange={(e) => editMode && setEditForm(prev => ({ ...prev, requireApproval: e.target.checked }))}
                    disabled={!editMode}
                    className="ak-w-4 ak-h-4 ak-text-blue-600 ak-border-gray-300 ak-rounded ak-focus:ring-blue-500"
                  />
                  <span className="ak-text-sm ak-text-gray-700">需要审批才能加入</span>
                </label>

                <label className="ak-flex ak-items-center ak-space-x-3">
                  <input
                    type="checkbox"
                    checked={editMode ? editForm.settings.allowInvites : group.settings?.allowInvites}
                    onChange={(e) => editMode && setEditForm(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings, allowInvites: e.target.checked }
                    }))}
                    disabled={!editMode}
                    className="ak-w-4 ak-h-4 ak-text-blue-600 ak-border-gray-300 ak-rounded ak-focus:ring-blue-500"
                  />
                  <span className="ak-text-sm ak-text-gray-700">允许成员邀请</span>
                </label>
              </div>
            </div>

            {/* 标签 */}
            <div className="ak-space-y-4">
              <h4 className="ak-font-medium ak-text-gray-900">标签</h4>
              
              {editMode ? (
                <div className="ak-space-y-3">
                  <div className="ak-flex ak-items-center ak-space-x-2">
                    <Input
                      value={editForm.newTag}
                      onChange={(e) => setEditForm(prev => ({ ...prev, newTag: e.target.value }))}
                      placeholder="添加标签"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <Button type="button" onClick={handleAddTag} size="sm">
                      添加
                    </Button>
                  </div>
                  <div className="ak-flex ak-flex-wrap ak-gap-2">
                    {editForm.tags.map((tag) => (
                      <span
                        key={tag}
                        className="ak-inline-flex ak-items-center ak-px-3 ak-py-1 ak-rounded-full ak-text-sm ak-bg-blue-100 ak-text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ak-ml-2 ak-text-blue-600 hover:ak-text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="ak-flex ak-flex-wrap ak-gap-2">
                  {group.tags.map((tag) => (
                    <span
                      key={tag}
                      className="ak-bg-gray-100 ak-text-gray-700 ak-text-xs ak-px-2 ak-py-1 ak-rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'requests' && (
        <Card className="ak-p-6">
          <h3 className="ak-text-lg ak-font-semibold ak-mb-4">加入申请</h3>
          
          {joinRequests.length > 0 ? (
            <div className="ak-space-y-4">
              {joinRequests.map((request) => (
                <div key={request.id} className="ak-flex ak-items-center ak-justify-between ak-p-4 ak-border ak-rounded-lg">
                  <div className="ak-flex ak-items-center ak-space-x-3">
                    <div className="ak-w-8 ak-h-8 ak-bg-blue-100 ak-rounded-full ak-flex ak-items-center ak-justify-center">
                      <span className="ak-text-sm ak-font-medium">{request.userName.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="ak-font-medium ak-text-gray-900">{request.userName}</div>
                      <div className="ak-text-sm ak-text-gray-600">
                        申请时间: {new Date(request.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="ak-flex ak-space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJoinRequest(request.id, false)}
                      className="ak-text-red-600 ak-border-red-200 hover:ak-bg-red-50"
                    >
                      拒绝
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleJoinRequest(request.id, true)}
                      className="ak-bg-green-600 hover:ak-bg-green-700"
                    >
                      同意
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ak-text-center ak-py-8 ak-text-gray-500">
              <p>暂无待处理的加入申请</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}