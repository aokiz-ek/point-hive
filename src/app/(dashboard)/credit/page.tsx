'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CreditScore, PointsDisplay } from '@/components/ui';
import { useAuth } from '@/lib/hooks';

interface CreditHistory {
  id: string;
  date: string;
  type: 'transfer' | 'return' | 'overdue' | 'bonus';
  description: string;
  amount: number;
  creditChange: number;
  newCreditScore: number;
}

export default function CreditCenterPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'improve'>('overview');
  
  // 模拟信用历史数据
  const creditHistory: CreditHistory[] = [
    {
      id: '1',
      date: '2025-01-10',
      type: 'transfer',
      description: '成功完成积分转移',
      amount: 500,
      creditChange: +5,
      newCreditScore: 852
    },
    {
      id: '2',
      date: '2025-01-08',
      type: 'return',
      description: '按时归还积分',
      amount: 800,
      creditChange: +8,
      newCreditScore: 847
    },
    {
      id: '3',
      date: '2025-01-05',
      type: 'bonus',
      description: '连续30天无逾期奖励',
      amount: 0,
      creditChange: +20,
      newCreditScore: 839
    },
    {
      id: '4',
      date: '2025-01-02',
      type: 'overdue',
      description: '积分归还逾期1天',
      amount: 300,
      creditChange: -10,
      newCreditScore: 819
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transfer': return '📤';
      case 'return': return '✅';
      case 'overdue': return '⚠️';
      case 'bonus': return '🎉';
      default: return '📊';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'transfer': return 'ak-text-blue-600';
      case 'return': return 'ak-text-green-600';
      case 'overdue': return 'ak-text-red-600';
      case 'bonus': return 'ak-text-purple-600';
      default: return 'ak-text-gray-600';
    }
  };

  return (
    <div className="ak-space-y-6 ak-p-4">
      {/* 页面标题 */}
      <div className="ak-flex ak-items-center ak-justify-between">
        <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">信用中心</h1>
        <Button variant="outline" size="sm">
          信用报告
        </Button>
      </div>

      {/* 信用概览卡片 */}
      <Card className="ak-p-6 ak-bg-gradient-to-r ak-from-purple-50 ak-to-blue-50">
        <div className="ak-grid ak-grid-cols-1 lg:ak-grid-cols-2 ak-gap-6">
          {/* 信用评分详情 */}
          <div>
            <CreditScore score={user?.creditScore || 852} size="lg" showDetails />
          </div>
          
          {/* 信用权益 */}
          <div className="ak-space-y-4">
            <h3 className="ak-text-lg ak-font-semibold ak-text-gray-900">当前信用权益</h3>
            <div className="ak-space-y-3">
              <div className="ak-flex ak-items-center ak-justify-between ak-p-3 ak-bg-white ak-rounded-lg">
                <div className="ak-flex ak-items-center ak-space-x-3">
                  <span className="ak-text-xl">💎</span>
                  <span className="ak-text-sm ak-font-medium">单次最大转移</span>
                </div>
                <span className="ak-text-sm ak-font-bold ak-text-blue-600">5,000 积分</span>
              </div>
              
              <div className="ak-flex ak-items-center ak-justify-between ak-p-3 ak-bg-white ak-rounded-lg">
                <div className="ak-flex ak-items-center ak-space-x-3">
                  <span className="ak-text-xl">⭐</span>
                  <span className="ak-text-sm ak-font-medium">智能推荐权重</span>
                </div>
                <span className="ak-text-sm ak-font-bold ak-text-green-600">+50%</span>
              </div>
              
              <div className="ak-flex ak-items-center ak-justify-between ak-p-3 ak-bg-white ak-rounded-lg">
                <div className="ak-flex ak-items-center ak-space-x-3">
                  <span className="ak-text-xl">🎯</span>
                  <span className="ak-text-sm ak-font-medium">优先展示</span>
                </div>
                <span className="ak-text-sm ak-font-bold ak-text-purple-600">已开启</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 选项卡导航 */}
      <div className="ak-border-b">
        <div className="ak-flex ak-space-x-8">
          {[
            { id: 'overview', name: '信用概览' },
            { id: 'history', name: '信用历史' },
            { id: 'improve', name: '提升建议' }
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
          {/* 信用统计 */}
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">信用统计</h3>
            <div className="ak-space-y-4">
              <div className="ak-flex ak-justify-between ak-items-center">
                <span className="ak-text-gray-600">历史交易次数</span>
                <span className="ak-font-bold ak-text-xl">47</span>
              </div>
              <div className="ak-flex ak-justify-between ak-items-center">
                <span className="ak-text-gray-600">按时归还率</span>
                <span className="ak-font-bold ak-text-xl ak-text-green-600">96.8%</span>
              </div>
              <div className="ak-flex ak-justify-between ak-items-center">
                <span className="ak-text-gray-600">平均归还时长</span>
                <span className="ak-font-bold ak-text-xl">5.2天</span>
              </div>
              <div className="ak-flex ak-justify-between ak-items-center">
                <span className="ak-text-gray-600">累计转移积分</span>
                <span className="ak-font-bold ak-text-xl">28,500</span>
              </div>
            </div>
          </Card>

          {/* 信用趋势 */}
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">信用趋势</h3>
            <div className="ak-space-y-4">
              <div className="ak-text-center ak-py-8">
                <div className="ak-text-4xl ak-mb-2">📈</div>
                <p className="ak-text-gray-600">信用趋势图表</p>
                <p className="ak-text-sm ak-text-gray-500 ak-mt-2">近30天信用得分变化趋势</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <Card className="ak-p-6">
          <h3 className="ak-text-lg ak-font-semibold ak-mb-4">信用历史记录</h3>
          <div className="ak-space-y-3">
            {creditHistory.map((record) => (
              <div key={record.id} className="ak-flex ak-items-center ak-justify-between ak-p-4 ak-border ak-rounded-lg">
                <div className="ak-flex ak-items-center ak-space-x-4">
                  <div className="ak-text-2xl">{getTypeIcon(record.type)}</div>
                  <div>
                    <div className="ak-font-medium ak-text-gray-900">{record.description}</div>
                    <div className="ak-text-sm ak-text-gray-600">
                      {new Date(record.date).toLocaleDateString('zh-CN')}
                      {record.amount > 0 && ` · ${record.amount.toLocaleString()} 积分`}
                    </div>
                  </div>
                </div>
                
                <div className="ak-text-right">
                  <div className={`ak-text-sm ak-font-medium ${
                    record.creditChange > 0 ? 'ak-text-green-600' : 'ak-text-red-600'
                  }`}>
                    {record.creditChange > 0 ? '+' : ''}{record.creditChange} 分
                  </div>
                  <div className="ak-text-xs ak-text-gray-500">
                    总分: {record.newCreditScore}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'improve' && (
        <div className="ak-grid ak-grid-cols-1 lg:ak-grid-cols-2 ak-gap-6">
          {/* 提升建议 */}
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">信用提升建议</h3>
            <div className="ak-space-y-4">
              <div className="ak-p-4 ak-bg-blue-50 ak-border ak-border-blue-200 ak-rounded-lg">
                <div className="ak-flex ak-items-start ak-space-x-3">
                  <span className="ak-text-xl">📝</span>
                  <div>
                    <div className="ak-font-medium ak-text-blue-900">完善个人信息</div>
                    <div className="ak-text-sm ak-text-blue-700 ak-mt-1">
                      完整填写个人资料可获得额外信用加分
                    </div>
                    <Button size="sm" className="ak-mt-2">立即完善</Button>
                  </div>
                </div>
              </div>
              
              <div className="ak-p-4 ak-bg-green-50 ak-border ak-border-green-200 ak-rounded-lg">
                <div className="ak-flex ak-items-start ak-space-x-3">
                  <span className="ak-text-xl">⚡</span>
                  <div>
                    <div className="ak-font-medium ak-text-green-900">提前归还积分</div>
                    <div className="ak-text-sm ak-text-green-700 ak-mt-1">
                      提前归还可获得额外信用奖励
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="ak-p-4 ak-bg-purple-50 ak-border ak-border-purple-200 ak-rounded-lg">
                <div className="ak-flex ak-items-start ak-space-x-3">
                  <span className="ak-text-xl">🤝</span>
                  <div>
                    <div className="ak-font-medium ak-text-purple-900">增加交易频次</div>
                    <div className="ak-text-sm ak-text-purple-700 ak-mt-1">
                      活跃的交易记录有助于提升信用评级
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 下一等级 */}
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">升级进度</h3>
            <div className="ak-text-center ak-mb-4">
              <div className="ak-text-3xl ak-mb-2">🌟🌟🌟🌟🌟</div>
              <div className="ak-text-lg ak-font-medium ak-text-gray-900">钻石信用</div>
              <div className="ak-text-sm ak-text-gray-600">还差 98 分即可达到</div>
            </div>
            
            <div className="ak-w-full ak-bg-gray-200 ak-rounded-full ak-h-3 ak-mb-4">
              <div 
                className="ak-bg-purple-600 ak-h-3 ak-rounded-full ak-transition-all ak-duration-300"
                style={{ width: `${((user?.creditScore || 852) / 950) * 100}%` }}
              />
            </div>
            
            <div className="ak-space-y-3 ak-text-sm">
              <div className="ak-flex ak-justify-between">
                <span>当前得分</span>
                <span className="ak-font-medium">{user?.creditScore || 852}</span>
              </div>
              <div className="ak-flex ak-justify-between">
                <span>目标得分</span>
                <span className="ak-font-medium">950</span>
              </div>
              <div className="ak-flex ak-justify-between">
                <span>完成进度</span>
                <span className="ak-font-medium ak-text-purple-600">
                  {Math.round(((user?.creditScore || 852) / 950) * 100)}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}