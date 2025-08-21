'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/hooks';
import { LocalStorage, generateId } from '@/lib/utils/local-storage';
import type { Group } from '@/lib/types';

export default function CreateGroupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: 50,
    isPublic: true,
    tags: [] as string[],
    requireApproval: false,
    initialPoints: 0
  });
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '群组名称不能为空';
    } else if (formData.name.length > 50) {
      newErrors.name = '群组名称不能超过50个字符';
    }

    if (!formData.description.trim()) {
      newErrors.description = '群组描述不能为空';
    } else if (formData.description.length > 500) {
      newErrors.description = '群组描述不能超过500个字符';
    }

    if (formData.maxMembers < 2 || formData.maxMembers > 1000) {
      newErrors.maxMembers = '成员数量必须在2-1000之间';
    }

    if (formData.initialPoints < 0 || formData.initialPoints > 100000) {
      newErrors.initialPoints = '初始积分必须在0-100000之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user) return;

    setLoading(true);

    try {
      const newGroup: Group = {
        id: generateId(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        ownerId: user.id,
        adminIds: [user.id],
        memberIds: [user.id],
        maxMembers: formData.maxMembers,
        totalPoints: formData.initialPoints,
        isPublic: formData.isPublic,
        tags: formData.tags,
        inviteCode: generateId().slice(0, 6).toUpperCase(),
        status: 'active' as const,
        rules: {
          maxTransferAmount: 5000,
          maxPendingAmount: 10000,
          defaultReturnPeriod: 7,
          creditScoreThreshold: 600,
          allowAnonymousTransfer: false,
          requireApproval: formData.requireApproval,
          autoReminderEnabled: true,
          allowPartialReturn: true,
          dailyTransferLimit: 50000,
          memberJoinApproval: formData.requireApproval
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          autoAcceptTransfers: true,
          notificationSound: true,
          showMemberActivity: true,
          allowMemberInvite: true,
          requireVerifiedEmail: false,
          requireVerifiedPhone: false,
          enableCreditLimit: true,
          enableTimeLimit: true
        }
      };

      // 保存群组到本地存储
      LocalStorage.addGroup(newGroup);

      // 创建初始积分记录
      if (formData.initialPoints > 0) {
        const initialTransaction = {
          id: generateId(),
          type: 'system' as const,
          fromUserId: 'system',
          toUserId: user.id,
          amount: formData.initialPoints,
          status: 'completed' as const,
          description: `群组 "${newGroup.name}" 初始积分`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          groupId: newGroup.id,
          metadata: {
            tags: ['group_creation', 'initial_points'],
            priority: 'normal' as const
          }
        };
        LocalStorage.addTransaction(initialTransaction);
      }

      // 跳转到群组详情页
      router.push(`/groups/${newGroup.id}`);
      
    } catch (error) {
      console.error('创建群组失败:', error);
      setErrors({ submit: '创建群组失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ak-space-y-6 ak-max-w-2xl ak-mx-auto">
      {/* 页面标题 */}
      <div>
        <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">创建群组</h1>
        <p className="ak-text-gray-600">创建一个新的积分管理群组</p>
      </div>

      {/* 创建表单 */}
      <Card className="ak-p-6">
        <form onSubmit={handleSubmit} className="ak-space-y-6">
          {/* 基本信息 */}
          <div className="ak-space-y-4">
            <h3 className="ak-text-lg ak-font-semibold">基本信息</h3>
            
            <div>
              <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                群组名称 <span className="ak-text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="请输入群组名称"
                maxLength={50}
              />
              {errors.name && (
                <p className="ak-text-sm ak-text-red-500 ak-mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                群组描述 <span className="ak-text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="请输入群组描述"
                maxLength={500}
                rows={3}
                className="ak-w-full ak-px-3 ak-py-2 ak-border ak-border-gray-300 ak-rounded-md ak-focus:outline-none ak-focus:ring-2 ak-focus:ring-blue-500 ak-focus:border-transparent"
              />
              {errors.description && (
                <p className="ak-text-sm ak-text-red-500 ak-mt-1">{errors.description}</p>
              )}
            </div>

            <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 ak-gap-4">
              <div>
                <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                  最大成员数 <span className="ak-text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.maxMembers}
                  onChange={(e) => handleInputChange('maxMembers', parseInt(e.target.value))}
                  min={2}
                  max={1000}
                />
                {errors.maxMembers && (
                  <p className="ak-text-sm ak-text-red-500 ak-mt-1">{errors.maxMembers}</p>
                )}
              </div>

              <div>
                <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                  初始积分
                </label>
                <Input
                  type="number"
                  value={formData.initialPoints}
                  onChange={(e) => handleInputChange('initialPoints', parseInt(e.target.value))}
                  min={0}
                  max={100000}
                  placeholder="0"
                />
                {errors.initialPoints && (
                  <p className="ak-text-sm ak-text-red-500 ak-mt-1">{errors.initialPoints}</p>
                )}
              </div>
            </div>
          </div>

          {/* 群组设置 */}
          <div className="ak-space-y-4">
            <h3 className="ak-text-lg ak-font-semibold">群组设置</h3>
            
            <div className="ak-space-y-3">
              <label className="ak-flex ak-items-center ak-space-x-3">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                  className="ak-w-4 ak-h-4 ak-text-blue-600 ak-border-gray-300 ak-rounded ak-focus:ring-blue-500"
                />
                <span className="ak-text-sm ak-text-gray-700">公开群组（其他用户可以搜索并申请加入）</span>
              </label>

              <label className="ak-flex ak-items-center ak-space-x-3">
                <input
                  type="checkbox"
                  checked={formData.requireApproval}
                  onChange={(e) => handleInputChange('requireApproval', e.target.checked)}
                  className="ak-w-4 ak-h-4 ak-text-blue-600 ak-border-gray-300 ak-rounded ak-focus:ring-blue-500"
                />
                <span className="ak-text-sm ak-text-gray-700">需要管理员审批才能加入</span>
              </label>
            </div>
          </div>

          {/* 标签设置 */}
          <div className="ak-space-y-4">
            <h3 className="ak-text-lg ak-font-semibold">标签</h3>
            
            <div className="ak-flex ak-items-center ak-space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="添加标签"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                maxLength={20}
              />
              <Button type="button" onClick={addTag} size="sm">
                添加
              </Button>
            </div>

            {formData.tags.length > 0 && (
              <div className="ak-flex ak-flex-wrap ak-gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="ak-inline-flex ak-items-center ak-px-3 ak-py-1 ak-rounded-full ak-text-sm ak-bg-blue-100 ak-text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ak-ml-2 ak-text-blue-600 hover:ak-text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 错误信息 */}
          {errors.submit && (
            <div className="ak-bg-red-50 ak-border ak-border-red-200 ak-rounded-md ak-p-3">
              <p className="ak-text-sm ak-text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="ak-flex ak-justify-end ak-space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '创建中...' : '创建群组'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}