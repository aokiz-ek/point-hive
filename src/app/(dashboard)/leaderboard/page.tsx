'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks';
import { LocalStorage } from '@/lib/utils/local-storage';
import type { Group, Transaction } from '@/lib/types';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  value: number;
  change?: number;
  avatar?: string;
}

interface LeaderboardData {
  points: LeaderboardEntry[];
  credit: LeaderboardEntry[];
  activity: LeaderboardEntry[];
  generosity: LeaderboardEntry[];
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>({
    points: [],
    credit: [],
    activity: [],
    generosity: []
  });
  const [activeTab, setActiveTab] = useState<'points' | 'credit' | 'activity' | 'generosity'>('points');
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly' | 'all_time'>('monthly');

  useEffect(() => {
    loadLeaderboardData();
  }, [timeRange]);

  const loadLeaderboardData = () => {
    setLoading(true);
    try {
      const transactions = LocalStorage.getTransactions();
      const groups = LocalStorage.getGroups();
      const allUsers = new Set<string>();

      // 收集所有用户ID
      transactions.forEach(t => {
        allUsers.add(t.fromUserId);
        allUsers.add(t.toUserId);
      });

      // 计算各种排行榜数据
      const pointsData: LeaderboardEntry[] = [];
      const creditData: LeaderboardEntry[] = [];
      const activityData: LeaderboardEntry[] = [];
      const generosityData: LeaderboardEntry[] = [];

      Array.from(allUsers).forEach(userId => {
        const userTransactions = transactions.filter(t => 
          t.fromUserId === userId || t.toUserId === userId
        );

        // 积分排行榜 - 当前余额
        const currentBalance = userTransactions.reduce((balance, t) => {
          if (t.toUserId === userId) balance += t.amount;
          if (t.fromUserId === userId) balance -= t.amount;
          return balance;
        }, 0);

        if (currentBalance > 0) {
          pointsData.push({
            rank: 0,
            userId,
            userName: `用户${userId}`,
            value: currentBalance
          });
        }

        // 信用排行榜 - 模拟信用分数
        const creditScore = 600 + Math.floor(Math.random() * 400); // 600-1000
        creditData.push({
          rank: 0,
          userId,
          userName: `用户${userId}`,
          value: creditScore
        });

        // 活跃度排行榜 - 交易次数
        const transactionCount = userTransactions.length;
        if (transactionCount > 0) {
          activityData.push({
            rank: 0,
            userId,
            userName: `用户${userId}`,
            value: transactionCount
          });
        }

        // 慷慨度排行榜 - 转出积分总数
        const totalGiven = userTransactions
          .filter(t => t.fromUserId === userId && t.type === 'transfer')
          .reduce((sum, t) => sum + t.amount, 0);

        if (totalGiven > 0) {
          generosityData.push({
            rank: 0,
            userId,
            userName: `用户${userId}`,
            value: totalGiven
          });
        }
      });

      // 排序并设置排名
      const sortAndRank = (data: LeaderboardEntry[]) => {
        return data
          .sort((a, b) => b.value - a.value)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1
          }))
          .slice(0, 20); // 只显示前20名
      };

      setLeaderboard({
        points: sortAndRank(pointsData),
        credit: sortAndRank(creditData),
        activity: sortAndRank(activityData),
        generosity: sortAndRank(generosityData)
      });

    } catch (error) {
      console.error('加载排行榜数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'points': return leaderboard.points;
      case 'credit': return leaderboard.credit;
      case 'activity': return leaderboard.activity;
      case 'generosity': return leaderboard.generosity;
      default: return [];
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'ak-bg-yellow-100 ak-text-yellow-800';
      case 2: return 'ak-bg-gray-100 ak-text-gray-800';
      case 3: return 'ak-bg-orange-100 ak-text-orange-800';
      default: return 'ak-bg-gray-50 ak-text-gray-700';
    }
  };

  const getValueLabel = () => {
    switch (activeTab) {
      case 'points': return '积分';
      case 'credit': return '信用分';
      case 'activity': return '交易次数';
      case 'generosity': return '转出积分';
      default: return '数值';
    }
  };

  const getValueColor = () => {
    switch (activeTab) {
      case 'points': return 'ak-text-green-600';
      case 'credit': return 'ak-text-blue-600';
      case 'activity': return 'ak-text-purple-600';
      case 'generosity': return 'ak-text-orange-600';
      default: return 'ak-text-gray-900';
    }
  };

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
      <div>
        <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">排行榜</h1>
        <p className="ak-text-gray-600">查看用户在各个维度的排名情况</p>
      </div>

      {/* 选项卡 */}
      <div className="ak-border-b">
        <div className="ak-flex ak-space-x-8">
          {[
            { id: 'points', name: '积分榜', icon: '💰' },
            { id: 'credit', name: '信用榜', icon: '⭐' },
            { id: 'activity', name: '活跃榜', icon: '📈' },
            { id: 'generosity', name: '慷慨榜', icon: '💝' }
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
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 时间范围选择 */}
      <Card className="ak-p-4">
        <div className="ak-flex ak-items-center ak-justify-between">
          <h3 className="ak-font-medium ak-text-gray-900">时间范围</h3>
          <div className="ak-flex ak-space-x-2">
            {[
              { value: 'weekly', label: '本周' },
              { value: 'monthly', label: '本月' },
              { value: 'all_time', label: '总榜' }
            ].map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range.value as any)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* 排行榜内容 */}
      <div className="ak-grid ak-grid-cols-1 lg:ak-grid-cols-3 ak-gap-6">
        {/* 排行榜列表 */}
        <div className="lg:ak-col-span-2">
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">
              {activeTab === 'points' && '积分排行榜'}
              {activeTab === 'credit' && '信用排行榜'}
              {activeTab === 'activity' && '活跃度排行榜'}
              {activeTab === 'generosity' && '慷慨度排行榜'}
            </h3>
            
            {getCurrentData().length > 0 ? (
              <div className="ak-space-y-3">
                {getCurrentData().map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`ak-flex ak-items-center ak-justify-between ak-p-4 ak-border ak-rounded-lg ak-transition-colors ${
                      entry.userId === user?.id
                        ? 'ak-border-blue-500 ak-bg-blue-50'
                        : 'ak-border-gray-200 hover:ak-border-gray-300'
                    }`}
                  >
                    <div className="ak-flex ak-items-center ak-space-x-4">
                      {/* 排名 */}
                      <div className={`ak-w-8 ak-h-8 ak-rounded-full ak-flex ak-items-center ak-justify-center ak-text-sm ak-font-bold ${getRankColor(entry.rank)}`}>
                        {getRankIcon(entry.rank)}
                      </div>
                      
                      {/* 用户信息 */}
                      <div>
                        <div className="ak-font-medium ak-text-gray-900">
                          {entry.userName}
                          {entry.userId === user?.id && (
                            <span className="ak-ml-2 ak-bg-blue-100 ak-text-blue-800 ak-text-xs ak-px-2 ak-py-1 ak-rounded-full">
                              您
                            </span>
                          )}
                        </div>
                        <div className="ak-text-sm ak-text-gray-600">
                          ID: {entry.userId}
                        </div>
                      </div>
                    </div>
                    
                    {/* 数值 */}
                    <div className="ak-text-right">
                      <div className={`ak-text-xl ak-font-bold ${getValueColor()}`}>
                        {entry.value.toLocaleString()}
                      </div>
                      <div className="ak-text-sm ak-text-gray-600">
                        {getValueLabel()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ak-text-center ak-py-8 ak-text-gray-500">
                <div className="ak-text-6xl ak-mb-4">📊</div>
                <p className="ak-text-lg ak-font-medium ak-text-gray-900 ak-mb-2">
                  暂无排行数据
                </p>
                <p className="ak-text-gray-600">
                  开始交易后将显示排行榜
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* 个人排名 */}
        <div className="ak-space-y-6">
          {/* 当前用户排名 */}
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">我的排名</h3>
            
            {user && getCurrentData().length > 0 ? (
              <div>
                {(() => {
                  const userEntry = getCurrentData().find(entry => entry.userId === user.id);
                  if (userEntry) {
                    return (
                      <div className="ak-space-y-4">
                        <div className="ak-flex ak-items-center ak-justify-between">
                          <span className="ak-text-gray-600">当前排名</span>
                          <div className={`ak-w-12 ak-h-12 ak-rounded-full ak-flex ak-items-center ak-justify-center ak-text-lg ak-font-bold ${getRankColor(userEntry.rank)}`}>
                            {getRankIcon(userEntry.rank)}
                          </div>
                        </div>
                        
                        <div className="ak-flex ak-items-center ak-justify-between">
                          <span className="ak-text-gray-600">{getValueLabel()}</span>
                          <span className={`ak-text-xl ak-font-bold ${getValueColor()}`}>
                            {userEntry.value.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="ak-flex ak-items-center ak-justify-between">
                          <span className="ak-text-gray-600">超越用户</span>
                          <span className="ak-font-bold ak-text-green-600">
                            {Math.round((1 - userEntry.rank / getCurrentData().length) * 100)}%
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="ak-text-center ak-py-4 ak-text-gray-500">
                      <p>您尚未进入排行榜</p>
                      <p className="ak-text-sm ak-mt-2">
                        多参与交易来提升排名吧！
                      </p>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="ak-text-center ak-py-4 ak-text-gray-500">
                <p>暂无排行数据</p>
              </div>
            )}
          </Card>

          {/* 排行榜说明 */}
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">排行榜说明</h3>
            <div className="ak-space-y-4">
              <div className="ak-flex ak-items-start ak-space-x-3">
                <span className="ak-text-lg">💰</span>
                <div>
                  <div className="ak-font-medium ak-text-gray-900">积分榜</div>
                  <div className="ak-text-sm ak-text-gray-600">
                    根据用户当前积分余额排名
                  </div>
                </div>
              </div>
              
              <div className="ak-flex ak-items-start ak-space-x-3">
                <span className="ak-text-lg">⭐</span>
                <div>
                  <div className="ak-font-medium ak-text-gray-900">信用榜</div>
                  <div className="ak-text-sm ak-text-gray-600">
                    根据用户信用评分排名
                  </div>
                </div>
              </div>
              
              <div className="ak-flex ak-items-start ak-space-x-3">
                <span className="ak-text-lg">📈</span>
                <div>
                  <div className="ak-font-medium ak-text-gray-900">活跃榜</div>
                  <div className="ak-text-sm ak-text-gray-600">
                    根据用户交易次数排名
                  </div>
                </div>
              </div>
              
              <div className="ak-flex ak-items-start ak-space-x-3">
                <span className="ak-text-lg">💝</span>
                <div>
                  <div className="ak-font-medium ak-text-gray-900">慷慨榜</div>
                  <div className="ak-text-sm ak-text-gray-600">
                    根据用户转出积分总数排名
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}