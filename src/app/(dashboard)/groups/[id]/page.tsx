'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CreditScore, PointsDisplay, PointsCard } from '@/components/ui';
import { useAuth, useGroups } from '@/lib/hooks';

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  balance: number;
  creditScore: number;
  lastOnline: string;
  isOnline: boolean;
  joinedAt: string;
  role: 'admin' | 'member';
}

interface GroupDetails {
  id: string;
  name: string;
  description: string;
  totalPoints: number;
  memberIds: string[];
  createdAt: string;
  isPublic: boolean;
  inviteCode: string;
  rules: {
    maxTransferAmount: number;
    defaultReturnPeriod: number;
    creditRequirement: number;
  };
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { groups } = useGroups();
  
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'transactions' | 'settings'>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [params.id]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      
      // 模拟获取群组详情
      const mockGroup: GroupDetails = {
        id: params.id as string,
        name: '项目协作组',
        description: '专为项目开发团队设计的积分管理群组',
        totalPoints: 15000,
        memberIds: ['user1', 'user2', 'user3', 'user4'],
        createdAt: '2025-01-15T10:00:00Z',
        isPublic: false,
        inviteCode: 'ABC123',
        rules: {
          maxTransferAmount: 2000,
          defaultReturnPeriod: 7,
          creditRequirement: 600
        }
      };

      // 模拟获取群组成员
      const mockMembers: GroupMember[] = [
        {
          id: 'user1',
          name: '张三',
          balance: 2500,
          creditScore: 920,
          lastOnline: '在线',
          isOnline: true,
          joinedAt: '2025-01-15T10:00:00Z',
          role: 'admin'
        },
        {
          id: 'user2',
          name: '李四',
          balance: 1800,
          creditScore: 850,
          lastOnline: '5分钟前',
          isOnline: false,
          joinedAt: '2025-01-16T14:30:00Z',
          role: 'member'
        },
        {
          id: 'user3',
          name: '王五',
          balance: 3200,
          creditScore: 780,
          lastOnline: '1小时前',
          isOnline: false,
          joinedAt: '2025-01-17T09:15:00Z',
          role: 'member'
        },
        {
          id: 'user4',
          name: '赵六',
          balance: 1500,
          creditScore: 720,
          lastOnline: '昨天',
          isOnline: false,
          joinedAt: '2025-01-18T16:45:00Z',
          role: 'member'
        }
      ];

      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGroup(mockGroup);
      setMembers(mockMembers);
    } catch (error) {
      console.error('加载群组数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = () => {
    setShowInviteModal(true);
  };

  const handleLeaveGroup = () => {
    if (confirm('确定要离开这个群组吗？')) {
      router.push('/hall');
    }
  };

  if (loading) {
    return (
      <div className="ak-flex ak-items-center ak-justify-center ak-min-h-screen">
        <div className="ak-text-center">
          <div className="ak-animate-spin ak-rounded-full ak-h-8 ak-w-8 ak-border-b-2 ak-border-blue-600 ak-mx-auto"></div>
          <p className="ak-mt-4 ak-text-gray-600">正在加载群组信息...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="ak-flex ak-items-center ak-justify-center ak-min-h-screen">
        <div className="ak-text-center">
          <div className="ak-text-6xl ak-mb-4">🔍</div>
          <h2 className="ak-text-xl ak-font-bold ak-text-gray-900 ak-mb-2">群组未找到</h2>
          <p className="ak-text-gray-600 ak-mb-4">您访问的群组不存在或已被删除</p>
          <Button onClick={() => router.push('/hall')}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="ak-space-y-6 ak-p-4">
      {/* 群组头部信息 */}
      <Card className="ak-p-6">
        <div className="ak-flex ak-items-start ak-justify-between ak-mb-4">
          <div className="ak-flex-1">
            <div className="ak-flex ak-items-center ak-space-x-3 ak-mb-3">
              <div className="ak-w-12 ak-h-12 ak-bg-blue-100 ak-rounded-full ak-flex ak-items-center ak-justify-center">
                📊
              </div>
              <div>
                <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">{group.name}</h1>
                <p className="ak-text-gray-600">{group.description}</p>
              </div>
            </div>
            
            <div className="ak-flex ak-items-center ak-space-x-4 ak-text-sm ak-text-gray-600">
              <span>{members.length} 名成员</span>
              <span>•</span>
              <span>创建于 {new Date(group.createdAt).toLocaleDateString('zh-CN')}</span>
              <span>•</span>
              <span className={group.isPublic ? 'ak-text-green-600' : 'ak-text-orange-600'}>
                {group.isPublic ? '公开群组' : '私密群组'}
              </span>
            </div>
          </div>
          
          <div className="ak-flex ak-space-x-2">
            <Button variant="outline" onClick={handleInviteMember}>
              邀请成员
            </Button>
            <Button variant="outline" onClick={handleLeaveGroup}>
              离开群组
            </Button>
          </div>
        </div>

        {/* 群组统计 */}
        <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-3 ak-gap-4">
          <PointsCard 
            balance={group.totalPoints}
            label="总积分池"
            showTrend
            trendValue={1200}
          />
          <PointsCard 
            balance={members.filter(m => m.isOnline).length}
            label="在线成员"
            className="ak-bg-green-50"
          />
          <PointsCard 
            balance={Math.round(members.reduce((sum, m) => sum + m.creditScore, 0) / members.length)}
            label="平均信用"
            className="ak-bg-purple-50"
          />
        </div>
      </Card>

      {/* 选项卡导航 */}
      <div className="ak-border-b">
        <div className="ak-flex ak-space-x-8">
          {[
            { id: 'overview', name: '概览' },
            { id: 'members', name: '成员' },
            { id: 'transactions', name: '交易记录' },
            { id: 'settings', name: '设置' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`ak-py-2 ak-px-1 ak-border-b-2 ak-font-medium ak-text-sm ${
                activeTab === tab.id
                  ? 'ak-border-blue-500 ak-text-blue-600'
                  : 'ak-border-transparent ak-text-gray-500 hover:ak-text-gray-700 hover:ak-border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* 选项卡内容 */}
      {activeTab === 'overview' && (
        <div className="ak-grid ak-grid-cols-1 lg:ak-grid-cols-2 ak-gap-6">
          {/* 群组规则 */}
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">群组规则</h3>
            <div className="ak-space-y-3">
              <div className="ak-flex ak-justify-between ak-text-sm">
                <span className="ak-text-gray-600">最大转移金额</span>
                <span className="ak-font-medium">{(group.rules?.maxTransferAmount || 0).toLocaleString()} 积分</span>
              </div>
              <div className="ak-flex ak-justify-between ak-text-sm">
                <span className="ak-text-gray-600">默认归还期限</span>
                <span className="ak-font-medium">{group.rules?.defaultReturnPeriod || 7} 天</span>
              </div>
              <div className="ak-flex ak-justify-between ak-text-sm">
                <span className="ak-text-gray-600">信用要求</span>
                <span className="ak-font-medium">{group.rules?.creditRequirement || 600}+ 分</span>
              </div>
            </div>
          </Card>

          {/* 邀请码 */}
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">邀请码</h3>
            <div className="ak-flex ak-items-center ak-space-x-3">
              <div className="ak-bg-gray-100 ak-px-4 ak-py-2 ak-rounded ak-font-mono ak-text-lg ak-font-bold">
                {group.inviteCode}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigator.clipboard.writeText(group.inviteCode)}
              >
                复制
              </Button>
            </div>
            <p className="ak-text-sm ak-text-gray-600 ak-mt-2">
              分享此邀请码，邀请其他用户加入群组
            </p>
          </Card>
        </div>
      )}

      {activeTab === 'members' && (
        <Card className="ak-p-6">
          <h3 className="ak-text-lg ak-font-semibold ak-mb-4">群组成员 ({members.length})</h3>
          <div className="ak-space-y-3">
            {members.map((member) => (
              <div key={member.id} className="ak-flex ak-items-center ak-justify-between ak-p-4 ak-border ak-rounded-lg">
                <div className="ak-flex ak-items-center ak-space-x-4">
                  <div className="ak-relative">
                    <div className="ak-w-10 ak-h-10 ak-bg-gray-200 ak-rounded-full ak-flex ak-items-center ak-justify-center">
                      <span className="ak-font-semibold ak-text-gray-700">{member.name[0]}</span>
                    </div>
                    {member.isOnline && (
                      <div className="ak-absolute ak--top-1 ak--right-1 ak-w-3 ak-h-3 ak-bg-green-500 ak-rounded-full ak-border-2 ak-border-white"></div>
                    )}
                  </div>
                  
                  <div className="ak-flex-1">
                    <div className="ak-flex ak-items-center ak-space-x-2 ak-mb-1">
                      <h4 className="ak-font-medium ak-text-gray-900">{member.name}</h4>
                      {member.role === 'admin' && (
                        <span className="ak-bg-blue-100 ak-text-blue-800 ak-text-xs ak-px-2 ak-py-1 ak-rounded-full">
                          管理员
                        </span>
                      )}
                      <CreditScore score={member.creditScore} size="sm" />
                    </div>
                    
                    <div className="ak-flex ak-items-center ak-space-x-4 ak-text-sm ak-text-gray-600">
                      <PointsDisplay balance={member.balance} size="sm" />
                      <span>加入于 {new Date(member.joinedAt).toLocaleDateString('zh-CN')}</span>
                      <span className={member.isOnline ? 'ak-text-green-600' : 'ak-text-gray-500'}>
                        {member.lastOnline}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" size="sm">
                  发起转移
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'transactions' && (
        <Card className="ak-p-6">
          <h3 className="ak-text-lg ak-font-semibold ak-mb-4">交易记录</h3>
          <div className="ak-text-center ak-py-8 ak-text-gray-500">
            <div className="ak-text-4xl ak-mb-2">📄</div>
            <p>暂无交易记录</p>
            <p className="ak-text-sm ak-mt-2">群组内的转移记录将在此处显示</p>
          </div>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card className="ak-p-6">
          <h3 className="ak-text-lg ak-font-semibold ak-mb-4">群组设置</h3>
          <div className="ak-text-center ak-py-8 ak-text-gray-500">
            <div className="ak-text-4xl ak-mb-2">⚙️</div>
            <p>群组设置功能开发中</p>
            <p className="ak-text-sm ak-mt-2">管理员可以在此修改群组规则和权限</p>
          </div>
        </Card>
      )}

      {/* 邀请成员模态框 */}
      {showInviteModal && (
        <div className="ak-fixed ak-inset-0 ak-z-50 ak-flex ak-items-center ak-justify-center ak-bg-black ak-bg-opacity-50">
          <Card className="ak-w-full ak-max-w-md ak-p-6 ak-m-4">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">邀请新成员</h3>
            
            <div className="ak-space-y-4 ak-mb-6">
              <div className="ak-text-center ak-p-4 ak-bg-gray-50 ak-rounded-lg">
                <div className="ak-text-2xl ak-mb-2">📋</div>
                <div className="ak-font-mono ak-text-xl ak-font-bold ak-mb-2">{group.inviteCode}</div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(group.inviteCode)}
                >
                  复制邀请码
                </Button>
              </div>
              
              <div className="ak-text-center ak-text-sm ak-text-gray-600">
                或者分享以下链接：
              </div>
              
              <div className="ak-p-3 ak-bg-gray-50 ak-rounded ak-text-sm ak-font-mono">
                {window.location.origin}/join/{group.inviteCode}
              </div>
            </div>

            <div className="ak-flex ak-space-x-3">
              <Button 
                variant="outline" 
                className="ak-flex-1"
                onClick={() => setShowInviteModal(false)}
              >
                关闭
              </Button>
              <Button 
                className="ak-flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/join/${group.inviteCode}`);
                  setShowInviteModal(false);
                }}
              >
                复制链接
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}