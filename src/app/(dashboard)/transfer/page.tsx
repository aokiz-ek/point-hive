'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CreditScore, PointsDisplay } from '@/components/ui';
import { useAuth, useGroups, useTransactionMutations } from '@/lib/hooks';
import { groupService } from '@/lib/services/group-service';
import { useQuery } from '@tanstack/react-query';

interface Member {
  id: string;
  name: string;
  avatar?: string;
  balance: number;
  creditScore: number;
  cooperationCount: number;
  lastOnline: string;
  isOnline: boolean;
  successRate: number;
}

export default function TransferPage() {
  const [step, setStep] = useState<'select' | 'amount' | 'confirm' | 'result'>('select');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [returnPeriod, setReturnPeriod] = useState(1);
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();
  const { groups } = useGroups();
  const { createTransferMutation } = useTransactionMutations();

  // 获取用户所在群组的成员数据
  const activeGroup = groups?.[0]; // 使用用户的第一个活跃群组
  
  const { data: groupMembersResponse, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['group-members', activeGroup?.id],
    queryFn: async () => {
      if (!activeGroup?.id) return { success: false, data: [] };
      return await groupService.getGroupMembers(activeGroup.id);
    },
    enabled: !!activeGroup?.id
  });

  // 转换群组成员数据为转移界面所需格式
  const members: Member[] = groupMembersResponse?.success && Array.isArray(groupMembersResponse.data) 
    ? groupMembersResponse.data.map((member: any) => ({
        id: member.userId,
        name: member.user.fullName || member.user.username,
        balance: member.user.balance || 0,
        creditScore: member.user.creditScore || 600,
        cooperationCount: Math.floor(Math.random() * 20) + 5, // 暂时使用随机数，后续从交易历史计算
        lastOnline: member.user.isOnline ? '在线' : '1小时前',
        isOnline: member.user.isOnline || false,
        successRate: Math.floor(Math.random() * 20) + 80 // 暂时使用随机数，后续从交易历史计算
      }))
      .filter((member: Member) => member.id !== user?.id) // 排除当前用户
    : [];

  // 智能推荐算法
  const getRecommendedMembers = () => {
    const transferAmountNum = parseFloat(transferAmount) || 300;
    
    return members
      .filter(member => member.balance >= transferAmountNum * 2) // 余额充足度筛选
      .map(member => {
        // 计算推荐分数 (余额40% + 信用30% + 合作20% + 在线10%)
        const balanceScore = Math.min((member.balance / transferAmountNum) / 5, 1) * 40;
        const creditScore = (member.creditScore / 1000) * 30;
        const cooperationScore = Math.min(member.cooperationCount / 20, 1) * 20;
        const onlineScore = member.isOnline ? 10 : 5;
        
        const totalScore = balanceScore + creditScore + cooperationScore + onlineScore;
        
        return {
          ...member,
          recommendScore: totalScore,
          recommendReason: [
            member.balance >= transferAmountNum * 3 ? '余额充足' : '',
            member.creditScore >= 850 ? '信用优秀' : member.creditScore >= 750 ? '信用良好' : '',
            member.cooperationCount >= 10 ? `历史合作${member.cooperationCount}次` : '',
            member.isOnline ? '在线中' : ''
          ].filter(Boolean).join('，')
        };
      })
      .sort((a, b) => b.recommendScore - a.recommendScore);
  };

  const filteredMembers = getRecommendedMembers().filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitTransfer = async () => {
    if (!selectedMember || !activeGroup) return;

    try {
      await createTransferMutation.mutateAsync({
        groupId: activeGroup.id, // 使用实际的群组ID
        toUserId: selectedMember.id,
        amount: parseFloat(transferAmount),
        description: description || '积分转移',
        dueDate: new Date(Date.now() + returnPeriod * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'normal'
      });
      setStep('result');
    } catch (error) {
      console.error('转移申请失败:', error);
    }
  };

  // 步骤1：选择转出方
  if (step === 'select') {
    return (
      <div className="ak-space-y-6 ak-p-4">
        <div className="ak-flex ak-items-center ak-justify-between">
          <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">发起积分转移</h1>
          <div className="ak-text-right">
            <div className="ak-text-sm ak-text-gray-600">我的余额</div>
            <PointsDisplay balance={user?.balance || 0} size="lg" />
          </div>
        </div>

        {/* 搜索框 */}
        <Card className="ak-p-4">
          <Input
            placeholder="搜索成员或扫码"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ak-mb-4"
          />
          <div className="ak-text-sm ak-text-gray-600">
            💡 推荐基于余额充足度、信用等级、合作历史和在线状态计算
          </div>
        </Card>

        {/* 智能推荐成员列表 */}
        <Card className="ak-p-6">
          <h2 className="ak-text-lg ak-font-semibold ak-mb-4">智能推荐 (按匹配度排序)</h2>
          <div className="ak-space-y-3">
            {/* 加载状态 */}
            {isLoadingMembers && (
              <div className="ak-text-center ak-py-8">
                <div className="ak-animate-spin ak-h-8 ak-w-8 ak-border-2 ak-border-blue-600 ak-border-t-transparent ak-rounded-full ak-mx-auto ak-mb-2"></div>
                <p className="ak-text-gray-600">正在加载群组成员...</p>
              </div>
            )}
            
            {/* 无群组状态 */}
            {!isLoadingMembers && !activeGroup && (
              <div className="ak-text-center ak-py-8 ak-text-gray-500">
                <p>您还没有加入任何群组</p>
                <p className="ak-text-sm ak-mt-2">请先创建或加入群组再进行积分转移</p>
                <Button className="ak-mt-4" asChild>
                  <a href="/hall">前往积分大厅</a>
                </Button>
              </div>
            )}
            
            {/* 无成员状态 */}
            {!isLoadingMembers && activeGroup && filteredMembers.length === 0 && (
              <div className="ak-text-center ak-py-8 ak-text-gray-500">
                <p>群组中暂无其他成员</p>
                <p className="ak-text-sm ak-mt-2">邀请更多朋友加入群组吧</p>
              </div>
            )}
            
            {/* 成员列表 */}
            {!isLoadingMembers && filteredMembers.map((member) => (
              <div
                key={member.id}
                className="ak-flex ak-items-center ak-justify-between ak-p-4 ak-border ak-rounded-lg ak-hover:shadow-md ak-transition-shadow ak-cursor-pointer"
                onClick={() => {
                  setSelectedMember(member);
                  setStep('amount');
                }}
              >
                <div className="ak-flex ak-items-center ak-space-x-4">
                  <div className="ak-w-12 ak-h-12 ak-bg-gray-200 ak-rounded-full ak-flex ak-items-center ak-justify-center">
                    {member.isOnline && (
                      <div className="ak-absolute ak-w-3 ak-h-3 ak-bg-green-500 ak-rounded-full ak-border-2 ak-border-white ak--top-1 ak--right-1"></div>
                    )}
                    <span className="ak-font-semibold ak-text-gray-700">
                      {member.name[0]}
                    </span>
                  </div>
                  
                  <div className="ak-flex-1">
                    <div className="ak-flex ak-items-center ak-space-x-2 ak-mb-1">
                      <h3 className="ak-font-medium ak-text-gray-900">{member.name}</h3>
                      <CreditScore score={member.creditScore} size="sm" />
                      {member.isOnline && (
                        <span className="ak-bg-green-100 ak-text-green-800 ak-text-xs ak-px-2 ak-py-1 ak-rounded-full">
                          在线
                        </span>
                      )}
                    </div>
                    
                    <div className="ak-flex ak-items-center ak-space-x-4 ak-text-sm ak-text-gray-600">
                      <PointsDisplay balance={member.balance} size="sm" />
                      <span>成功率 {member.successRate}%</span>
                      <span>合作 {member.cooperationCount} 次</span>
                      <span>{member.lastOnline}</span>
                    </div>
                    
                    {member.recommendReason && (
                      <div className="ak-text-xs ak-text-blue-600 ak-mt-1">
                        推荐理由: {member.recommendReason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ak-text-center">
                  <Button size="sm">
                    选择此人
                  </Button>
                  <div className="ak-text-xs ak-text-gray-500 ak-mt-1">
                    匹配度 {Math.round(member.recommendScore)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // 步骤2：输入转移金额
  if (step === 'amount') {
    return (
      <div className="ak-space-y-6 ak-p-4">
        <div className="ak-flex ak-items-center ak-space-x-4">
          <Button variant="outline" onClick={() => setStep('select')}>
            ← 返回
          </Button>
          <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">转移金额</h1>
        </div>

        {/* 选中的用户信息 */}
        {selectedMember && (
          <Card className="ak-p-4 ak-bg-blue-50">
            <div className="ak-flex ak-items-center ak-space-x-3">
              <div className="ak-w-10 ak-h-10 ak-bg-gray-200 ak-rounded-full ak-flex ak-items-center ak-justify-center">
                <span className="ak-font-semibold ak-text-gray-700">
                  {selectedMember.name[0]}
                </span>
              </div>
              <div>
                <div className="ak-flex ak-items-center ak-space-x-2">
                  <h3 className="ak-font-medium ak-text-gray-900">{selectedMember.name}</h3>
                  <CreditScore score={selectedMember.creditScore} size="sm" />
                </div>
                <div className="ak-text-sm ak-text-gray-600">
                  <PointsDisplay balance={selectedMember.balance} size="sm" />
                  · 成功率 {selectedMember.successRate}%
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="ak-p-6">
          <div className="ak-space-y-6">
            {/* 当前余额显示 */}
            <div className="ak-text-center ak-p-4 ak-bg-gray-50 ak-rounded-lg">
              <div className="ak-text-sm ak-text-gray-600 ak-mb-1">当前余额</div>
              <PointsDisplay balance={user?.balance || 0} size="lg" />
            </div>

            {/* 转移金额输入 */}
            <div>
              <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                转移金额
              </label>
              <Input
                type="number"
                placeholder="请输入转移金额"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="ak-text-center ak-text-2xl ak-h-16"
              />
              <div className="ak-grid ak-grid-cols-4 ak-gap-2 ak-mt-4">
                {[100, 300, 500, 1000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setTransferAmount(amount.toString())}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </div>

            {/* 归还期限 */}
            <div>
              <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                归还期限 (可选)
              </label>
              <select
                value={returnPeriod}
                onChange={(e) => setReturnPeriod(parseInt(e.target.value))}
                className="ak-w-full ak-p-3 ak-border ak-rounded-md ak-bg-white"
              >
                <option value={1}>1天 (推荐)</option>
                <option value={3}>3天</option>
                <option value={7}>7天</option>
                <option value={14}>14天</option>
                <option value={30}>30天</option>
              </select>
            </div>

            {/* 转移备注 */}
            <div>
              <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                转移备注 (可选)
              </label>
              <Input
                placeholder="简单说明转移原因"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={50}
              />
            </div>

            {/* 转移后余额预览 */}
            {transferAmount && (
              <div className="ak-p-4 ak-bg-yellow-50 ak-rounded-lg ak-border ak-border-yellow-200">
                <div className="ak-text-sm ak-text-yellow-800">
                  转移后余额: <span className="ak-font-bold">
                    {((user?.balance || 0) - parseFloat(transferAmount || '0')).toLocaleString()} 积分
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="ak-flex ak-space-x-3 ak-mt-6">
            <Button variant="outline" className="ak-flex-1" onClick={() => setStep('select')}>
              取消
            </Button>
            <Button 
              className="ak-flex-1" 
              onClick={() => setStep('confirm')}
              disabled={!transferAmount || parseFloat(transferAmount) <= 0}
            >
              确认申请
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 步骤3：确认转移
  if (step === 'confirm') {
    return (
      <div className="ak-space-y-6 ak-p-4">
        <div className="ak-flex ak-items-center ak-space-x-4">
          <Button variant="outline" onClick={() => setStep('amount')}>
            ← 返回
          </Button>
          <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">确认转移</h1>
        </div>

        <Card className="ak-p-6">
          <div className="ak-text-center ak-mb-6">
            <div className="ak-text-4xl ak-mb-4">📤</div>
            <h2 className="ak-text-xl ak-font-bold ak-text-gray-900 ak-mb-2">
              确认积分转移申请
            </h2>
            <p className="ak-text-gray-600">
              请仔细核对转移信息，确认后将发送申请
            </p>
          </div>

          {/* 转移详情 */}
          <div className="ak-space-y-4 ak-border ak-rounded-lg ak-p-4 ak-bg-gray-50">
            <div className="ak-flex ak-justify-between">
              <span className="ak-text-gray-600">转移对象</span>
              <span className="ak-font-medium">{selectedMember?.name}</span>
            </div>
            <div className="ak-flex ak-justify-between">
              <span className="ak-text-gray-600">转移金额</span>
              <span className="ak-font-bold ak-text-xl ak-text-blue-600">
                {parseFloat(transferAmount).toLocaleString()} 积分
              </span>
            </div>
            <div className="ak-flex ak-justify-between">
              <span className="ak-text-gray-600">归还期限</span>
              <span className="ak-font-medium">{returnPeriod}天</span>
            </div>
            {description && (
              <div className="ak-flex ak-justify-between">
                <span className="ak-text-gray-600">转移备注</span>
                <span className="ak-font-medium">{description}</span>
              </div>
            )}
            <div className="ak-border-t ak-pt-2">
              <div className="ak-flex ak-justify-between">
                <span className="ak-text-gray-600">转移后余额</span>
                <span className="ak-font-medium">
                  {((user?.balance || 0) - parseFloat(transferAmount)).toLocaleString()} 积分
                </span>
              </div>
            </div>
          </div>

          {/* 重要提示 */}
          <div className="ak-bg-blue-50 ak-border ak-border-blue-200 ak-rounded-lg ak-p-4 ak-mt-6">
            <div className="ak-flex ak-space-x-2">
              <span className="ak-text-blue-600">ℹ️</span>
              <div className="ak-text-sm ak-text-blue-800">
                <p className="ak-font-medium ak-mb-1">申请说明:</p>
                <ul className="ak-list-disc ak-list-inside ak-space-y-1">
                  <li>对方将收到实时通知</li>
                  <li>24小时内未处理将自动取消</li>
                  <li>成功转移后立即到账</li>
                  <li>到期未归还将影响双方信用记录</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="ak-flex ak-space-x-3 ak-mt-6">
            <Button variant="outline" className="ak-flex-1" onClick={() => setStep('amount')}>
              修改
            </Button>
            <Button 
              className="ak-flex-1" 
              onClick={handleSubmitTransfer}
              disabled={createTransferMutation.isPending}
            >
              {createTransferMutation.isPending ? '发送中...' : '确认发送'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 步骤4：申请结果
  if (step === 'result') {
    return (
      <div className="ak-space-y-6 ak-p-4">
        <Card className="ak-p-8 ak-text-center">
          <div className="ak-text-6xl ak-mb-4">✨</div>
          <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900 ak-mb-2">
            申请发送成功！
          </h1>
          <p className="ak-text-gray-600 ak-mb-6">
            已向 {selectedMember?.name} 发送 {transferAmount} 积分转移申请
          </p>

          <div className="ak-bg-green-50 ak-border ak-border-green-200 ak-rounded-lg ak-p-4 ak-mb-6">
            <div className="ak-flex ak-items-start ak-space-x-2">
              <span className="ak-text-green-600">📱</span>
              <div className="ak-text-sm ak-text-green-800 ak-text-left">
                <p className="ak-font-medium ak-mb-1">接下来会发生什么:</p>
                <ul className="ak-space-y-1">
                  <li>• 对方将收到实时通知</li>
                  <li>• 您可以在"交易记录"中查看申请状态</li>
                  <li>• 24小时内未处理将自动取消</li>
                  <li>• 对方同意后积分将立即到账</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="ak-space-y-3">
            <Button className="ak-w-full" asChild>
              <a href="/transactions">查看申请状态</a>
            </Button>
            <Button variant="outline" className="ak-w-full" asChild>
              <a href="/hall">返回首页</a>
            </Button>
            <Button 
              variant="ghost" 
              className="ak-w-full" 
              onClick={() => {
                setStep('select');
                setSelectedMember(null);
                setTransferAmount('');
                setDescription('');
              }}
            >
              继续申请
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}