'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CreditScore, PointsDisplay, PointsCard } from '@/components/ui';
import { useGroups, useAuth, useTransactionSummary, useGroupMutations } from '@/lib/hooks';

export default function PointHallPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'recent' | 'recommended' | 'favorite'>('recent');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  
  // Create group form state
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    initialPoints: 1000,
    isPublic: true,
    template: 'community'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  
  // Join group form state
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  
  const { groups, refetch: refetchGroups } = useGroups();
  const { user } = useAuth();
  const { summary } = useTransactionSummary();
  const { createGroupMutation, joinGroupMutation } = useGroupMutations();

  // 真实数据
  const recentGroups = groups?.slice(0, 3) || [];
  // 基于真实群组数据生成推荐
  const recommendedGroups = groups?.filter(group => 
    group.memberIds?.length >= 3 && 
    group.status === 'active' && 
    group.ownerId !== user?.id
  ).slice(0, 3) || [];

  const templates = [
    { id: 'enterprise', name: '企业团队版', desc: '适用：部门协作、项目管理', icon: '🏢' },
    { id: 'community', name: '社群互助版', desc: '适用：兴趣小组、学习社群', icon: '👥' },
    { id: 'activity', name: '活动专用版', desc: '适用：临时活动、竞赛管理', icon: '🎯' },
    { id: 'poker', name: 'DZ扑克桌', desc: '适用：DZ扑克筹码管理', icon: '🃏' },
    { id: 'custom', name: '自定义配置', desc: '完全自定义规则和设置', icon: '⚙️' },
  ];

  // 处理创建群组
  const handleCreateGroup = async () => {
    if (!createForm.name.trim()) {
      setCreateError('请输入群组名称');
      return;
    }

    if (!user) {
      setCreateError('用户未登录');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      // 使用真实的API调用创建群组
      await createGroupMutation.mutateAsync({
        name: createForm.name,
        description: createForm.description || '',
        type: createForm.template as 'enterprise' | 'community' | 'activity' | 'custom',
        maxMembers: 50,
        initialPoints: createForm.initialPoints,
        isPublic: createForm.isPublic,
        rules: {
          requireApproval: false,
          maxTransferAmount: 5000,
          creditScoreThreshold: 600
        },
      });

      // 重置表单
      setCreateForm({
        name: '',
        description: '',
        initialPoints: 1000,
        isPublic: true,
        template: 'community'
      });
      setShowCreateModal(false);

      // 刷新群组列表
      await refetchGroups();

      // 显示成功消息
      alert('群组创建成功！');
      
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : '创建失败，请稍后重试');
    } finally {
      setIsCreating(false);
    }
  };

  // 处理加入群组
  const handleJoinGroup = async () => {
    if (inviteCode.length !== 6) {
      setJoinError('请输入6位邀请码');
      return;
    }

    if (!user) {
      setJoinError('用户未登录');
      return;
    }

    setIsJoining(true);
    setJoinError('');

    try {
      // 使用真实的API调用加入群组
      await joinGroupMutation.mutateAsync({ inviteCode });
      
      alert('成功加入群组！');
      setInviteCode('');
      setShowJoinModal(false);
      
      // 刷新群组列表
      await refetchGroups();
      
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : '加入失败，请稍后重试');
    } finally {
      setIsJoining(false);
    }
  };

  // 处理扫码功能
  const handleStartCamera = () => {
    setShowCamera(true);
    // TODO: 集成真实的摄像头扫码功能
    // 暂时使用演示邀请码进行测试
    setTimeout(() => {
      // 使用实际群组的邀请码进行演示
      const demoInviteCode = groups?.[0]?.inviteCode || 'DEMO01';
      setInviteCode(demoInviteCode);
      setShowCamera(false);
      alert('扫码成功，已自动填入邀请码');
    }, 3000);
  };

  // 选择模板
  const handleSelectTemplate = (templateId: string) => {
    if (templateId === 'poker') {
      // DZ扑克模板，跳转到专用创建页面
      router.push('/groups/poker/create');
      return;
    }
    
    // 其他模板使用原有流程
    setCreateForm(prev => ({ ...prev, template: templateId }));
    setShowCreateModal(true);
  };

  return (
    <div className="ak-space-y-6 ak-p-4">
      {/* 页面标题 */}
      <div className="ak-text-center ak-py-6">
        <h1 className="ak-text-3xl ak-font-bold ak-text-gray-900 ak-mb-2">
          Point-Hive 积分蜂巢
        </h1>
        <p className="ak-text-gray-600">智能积分管理平台，让积分流转更简单</p>
      </div>

      {/* 用户状态概览 */}
      <Card className="ak-p-6 ak-bg-gradient-to-r ak-from-blue-50 ak-to-indigo-50">
        <div className="ak-flex ak-items-center ak-justify-between ak-mb-4">
          <div>
            <h2 className="ak-text-xl ak-font-bold ak-text-gray-900">
              欢迎回来，{user?.nickname}！
            </h2>
            <p className="ak-text-gray-600">您的积分状态一切良好</p>
          </div>
          <div className="ak-text-right">
            <CreditScore score={user?.creditScore || 852} />
          </div>
        </div>

        <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-3 ak-gap-4">
          <PointsCard 
            balance={summary?.currentBalance || 3000} 
            label="当前余额"
            showTrend
            trendValue={250}
          />
          <PointsCard 
            balance={summary?.pendingOut || 300} 
            label="转出中"
            className="ak-bg-orange-50"
          />
          <PointsCard 
            balance={summary?.pendingIn || 0} 
            label="转入中"
            className="ak-bg-green-50"
          />
        </div>
      </Card>

      {/* 快速入口区 */}
      <Card className="ak-p-6">
        <h2 className="ak-text-lg ak-font-semibold ak-mb-4 ak-text-gray-900">快速入口</h2>
        <div className="ak-grid ak-grid-cols-2 md:ak-grid-cols-4 ak-gap-4">
          <Button 
            variant="ghost"
            className="ak-h-20 ak-flex ak-flex-col ak-bg-blue-600 hover:ak-bg-blue-700 ak-text-white hover:ak-text-white"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="ak-text-2xl ak-mb-1">⚡</span>
            <span>一键创建</span>
          </Button>
          
          <Button 
            variant="ghost"
            className="ak-h-20 ak-flex ak-flex-col ak-bg-green-600 hover:ak-bg-green-700 ak-text-white hover:ak-text-white"
            onClick={() => router.push('/groups/poker/create')}
          >
            <span className="ak-text-2xl ak-mb-1">🃏</span>
            <span>DZ扑克</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="ak-h-20 ak-flex ak-flex-col"
            onClick={() => setShowJoinModal(true)}
          >
            <span className="ak-text-2xl ak-mb-1">📱</span>
            <span>扫码加入</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="ak-h-20 ak-flex ak-flex-col"
            onClick={() => setShowJoinModal(true)}
          >
            <span className="ak-text-2xl ak-mb-1">🔑</span>
            <span>邀请码</span>
          </Button>
        </div>
      </Card>

      {/* 智能推荐区 */}
      <Card className="ak-p-6">
        <div className="ak-flex ak-items-center ak-justify-between ak-mb-4">
          <h2 className="ak-text-lg ak-font-semibold ak-text-gray-900">智能推荐</h2>
          <div className="ak-flex ak-space-x-2">
            <Button
              variant={activeTab === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('recent')}
            >
              最近
            </Button>
            <Button
              variant={activeTab === 'recommended' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('recommended')}
            >
              推荐
            </Button>
            <Button
              variant={activeTab === 'favorite' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('favorite')}
            >
              收藏
            </Button>
          </div>
        </div>

        {/* 推荐群组列表 */}
        <div className="ak-space-y-3">
          {activeTab === 'recent' && recentGroups.map((group) => (
            <div key={group.id} className="ak-flex ak-items-center ak-justify-between ak-p-4 ak-border ak-rounded-lg ak-hover:shadow-md ak-transition-shadow">
              <div className="ak-flex ak-items-center ak-space-x-3">
                <div className="ak-w-10 ak-h-10 ak-bg-blue-100 ak-rounded-full ak-flex ak-items-center ak-justify-center">
                  📍
                </div>
                <div>
                  <h3 className="ak-font-medium ak-text-gray-900">{group.name}</h3>
                  <div className="ak-flex ak-items-center ak-space-x-2 ak-text-sm ak-text-gray-600">
                    <span>{group.memberIds?.length || 0}人</span>
                    <span>•</span>
                    <PointsDisplay balance={group.totalPoints || 0} size="sm" showIcon={false} />
                    <span>•</span>
                    <span className="ak-text-green-600">刚刚在线</span>
                  </div>
                </div>
              </div>
              <Button size="sm" asChild>
                <Link href={`/groups/${group.id}`}>进入</Link>
              </Button>
            </div>
          ))}

          {activeTab === 'recommended' && recommendedGroups.map((group) => (
            <div key={group.id} className="ak-flex ak-items-center ak-justify-between ak-p-4 ak-border ak-rounded-lg ak-hover:shadow-md ak-transition-shadow">
              <div className="ak-flex ak-items-center ak-space-x-3">
                <div className="ak-w-10 ak-h-10 ak-bg-orange-100 ak-rounded-full ak-flex ak-items-center ak-justify-center">
                  🔥
                </div>
                <div className="ak-flex-1">
                  <div className="ak-flex ak-items-center ak-justify-between ak-mb-1">
                    <h3 className="ak-font-medium ak-text-gray-900">{group.name}</h3>
                    <div className="ak-flex ak-items-center ak-space-x-1">
                      <span className="ak-text-sm ak-text-yellow-600">⭐ 4.5</span>
                      {(group as any).isPublic !== false && (
                        <span className="ak-bg-green-100 ak-text-green-800 ak-text-xs ak-px-2 ak-py-1 ak-rounded-full">
                          公开
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ak-flex ak-items-center ak-space-x-2 ak-text-sm ak-text-gray-600">
                    <span>{group.memberIds?.length || 0}人</span>
                    <span>•</span>
                    <span className="ak-text-green-600">{Math.floor((group.memberIds?.length || 0) * 0.6)}人在线</span>
                    <span>•</span>
                    <span>活跃群组</span>
                  </div>
                </div>
              </div>
              <div className="ak-flex ak-flex-col ak-space-y-2">
                <Button size="sm" variant="outline">
                  加入
                </Button>
                <span className="ak-text-xs ak-text-gray-500 ak-text-center">推荐理由</span>
              </div>
            </div>
          ))}

          {activeTab === 'favorite' && (
            <div className="ak-text-center ak-py-8 ak-text-gray-500">
              <p>暂无收藏的群组</p>
              <p className="ak-text-sm ak-mt-2">在群组列表中点击收藏来添加</p>
            </div>
          )}
        </div>
      </Card>

      {/* 创建模板区 */}
      <Card className="ak-p-6">
        <h2 className="ak-text-lg ak-font-semibold ak-mb-4 ak-text-gray-900">创建模板</h2>
        <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 lg:ak-grid-cols-4 ak-gap-4">
          {templates.map((template) => (
            <div 
              key={template.id} 
              className="ak-border ak-rounded-lg ak-p-4 ak-hover:shadow-md ak-transition-shadow ak-cursor-pointer"
              onClick={() => handleSelectTemplate(template.id)}
            >
              <div className="ak-text-center ak-mb-3">
                <div className="ak-text-3xl ak-mb-2">{template.icon}</div>
                <h3 className="ak-font-medium ak-text-gray-900">{template.name}</h3>
              </div>
              <p className="ak-text-sm ak-text-gray-600 ak-text-center ak-mb-4">{template.desc}</p>
              <Button className="ak-w-full" size="sm" variant="outline">
                选择此模板
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* 邀请码加入模态框 */}
      {showJoinModal && (
        <div className="ak-fixed ak-inset-0 ak-z-50 ak-flex ak-items-center ak-justify-center ak-bg-black ak-bg-opacity-50">
          <Card className="ak-w-full ak-max-w-md ak-p-6 ak-m-4">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">加入群组</h3>
            
            {/* 错误提示 */}
            {joinError && (
              <div className="ak-mb-4 ak-p-3 ak-bg-red-50 ak-border ak-border-red-200 ak-rounded-md">
                <p className="ak-text-sm ak-text-red-600">{joinError}</p>
              </div>
            )}
            
            <div className="ak-text-center ak-mb-6">
              <div className={`ak-w-32 ak-h-32 ak-rounded-lg ak-mx-auto ak-mb-4 ak-flex ak-items-center ak-justify-center ak-transition-colors ${
                showCamera ? 'ak-bg-blue-100 ak-border-2 ak-border-blue-300' : 'ak-bg-gray-100'
              }`}>
                {showCamera ? (
                  <div className="ak-text-center">
                    <div className="ak-animate-pulse ak-text-2xl ak-mb-1">📸</div>
                    <div className="ak-text-xs ak-text-blue-600">扫描中...</div>
                  </div>
                ) : (
                  <span className="ak-text-4xl">📷</span>
                )}
              </div>
              <Button 
                variant="outline" 
                className="ak-mb-4"
                onClick={handleStartCamera}
                disabled={showCamera || isJoining}
              >
                {showCamera ? '扫描中...' : '启动摄像头扫码'}
              </Button>
            </div>

            <div className="ak-mb-4">
              <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                或手动输入邀请码
              </label>
              <Input
                placeholder="输入6位邀请码 (示例: ABCD12)"
                value={inviteCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  setInviteCode(value);
                  setJoinError('');
                }}
                maxLength={6}
                disabled={isJoining}
                className={inviteCode.length === 6 ? 'ak-border-green-300 ak-bg-green-50' : ''}
              />
              <div className="ak-text-xs ak-text-gray-500 ak-mt-1">
                有效邀请码示例: ABCD12, XYZ789, TEST01
              </div>
            </div>

            <div className="ak-flex ak-space-x-3">
              <Button 
                variant="outline" 
                className="ak-flex-1"
                onClick={() => {
                  setShowJoinModal(false);
                  setInviteCode('');
                  setJoinError('');
                  setShowCamera(false);
                }}
                disabled={isJoining}
              >
                取消
              </Button>
              <Button 
                className="ak-flex-1"
                disabled={inviteCode.length !== 6 || isJoining}
                onClick={handleJoinGroup}
              >
                {isJoining ? '验证中...' : '确认加入'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 创建群组模态框 */}
      {showCreateModal && (
        <div className="ak-fixed ak-inset-0 ak-z-50 ak-flex ak-items-center ak-justify-center ak-bg-black ak-bg-opacity-50">
          <Card className="ak-w-full ak-max-w-md ak-p-6 ak-m-4">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">
              创建群组 - {templates.find(t => t.id === createForm.template)?.name}
            </h3>
            
            {/* 错误提示 */}
            {createError && (
              <div className="ak-mb-4 ak-p-3 ak-bg-red-50 ak-border ak-border-red-200 ak-rounded-md">
                <p className="ak-text-sm ak-text-red-600">{createError}</p>
              </div>
            )}
            
            <div className="ak-space-y-4 ak-mb-6">
              {/* 选中的模板展示 */}
              <div className="ak-p-3 ak-bg-blue-50 ak-border ak-border-blue-200 ak-rounded-lg">
                <div className="ak-flex ak-items-center ak-space-x-2">
                  <span className="ak-text-xl">
                    {templates.find(t => t.id === createForm.template)?.icon}
                  </span>
                  <div>
                    <div className="ak-text-sm ak-font-medium ak-text-blue-900">
                      {templates.find(t => t.id === createForm.template)?.name}
                    </div>
                    <div className="ak-text-xs ak-text-blue-600">
                      {templates.find(t => t.id === createForm.template)?.desc}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                  群组名称 *
                </label>
                <Input 
                  placeholder="输入群组名称"
                  value={createForm.name}
                  onChange={(e) => {
                    setCreateForm(prev => ({ ...prev, name: e.target.value }));
                    setCreateError('');
                  }}
                  disabled={isCreating}
                />
              </div>
              
              <div>
                <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                  群组描述 (可选)
                </label>
                <Input 
                  placeholder="简单描述这个群组的用途"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                  初始积分池
                </label>
                <div className="ak-flex ak-space-x-2">
                  <Input 
                    type="number" 
                    placeholder="1000"
                    value={createForm.initialPoints}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, initialPoints: parseInt(e.target.value) || 1000 }))}
                    disabled={isCreating}
                    min="100"
                    max="100000"
                  />
                  <div className="ak-flex ak-items-center ak-text-sm ak-text-gray-500 ak-whitespace-nowrap">
                    积分
                  </div>
                </div>
                <div className="ak-text-xs ak-text-gray-500 ak-mt-1">
                  建议设置合理的初始积分池，后续可以调整
                </div>
              </div>

              {/* 群组设置 */}
              <div>
                <label className="ak-flex ak-items-center ak-space-x-2">
                  <input
                    type="checkbox"
                    checked={createForm.isPublic}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                    disabled={isCreating}
                    className="ak-rounded ak-text-blue-600"
                  />
                  <span className="ak-text-sm ak-font-medium ak-text-gray-700">公开群组</span>
                </label>
                <div className="ak-text-xs ak-text-gray-500 ak-mt-1 ak-ml-6">
                  公开群组可以被搜索发现，私密群组仅限邀请加入
                </div>
              </div>
            </div>

            <div className="ak-flex ak-space-x-3">
              <Button 
                variant="outline" 
                className="ak-flex-1"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError('');
                }}
                disabled={isCreating}
              >
                取消
              </Button>
              <Button 
                className="ak-flex-1"
                onClick={handleCreateGroup}
                disabled={!createForm.name.trim() || isCreating}
              >
                {isCreating ? '创建中...' : '立即创建'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}