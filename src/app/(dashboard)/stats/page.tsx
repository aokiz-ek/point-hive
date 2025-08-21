'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PointsDisplay, PointsCard } from '@/components/ui';
import { useAuth } from '@/lib/hooks';

interface StatsData {
  totalTransfers: number;
  totalAmount: number;
  successRate: number;
  avgReturnTime: number;
  monthlyData: Array<{
    month: string;
    transfers: number;
    amount: number;
  }>;
  groupStats: Array<{
    groupName: string;
    transfers: number;
    amount: number;
  }>;
}

export default function StatsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly' | 'groups' | 'trends'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  
  // 模拟统计数据
  const statsData: StatsData = {
    totalTransfers: 47,
    totalAmount: 28500,
    successRate: 96.8,
    avgReturnTime: 5.2,
    monthlyData: [
      { month: '2024-09', transfers: 8, amount: 4200 },
      { month: '2024-10', transfers: 12, amount: 6800 },
      { month: '2024-11', transfers: 15, amount: 9200 },
      { month: '2024-12', transfers: 18, amount: 11500 },
      { month: '2025-01', transfers: 14, amount: 8800 }
    ],
    groupStats: [
      { groupName: '项目协作组', transfers: 25, amount: 15600 },
      { groupName: '学习交流群', transfers: 12, amount: 7200 },
      { groupName: '积分互助社', transfers: 10, amount: 5700 }
    ]
  };

  return (
    <div className="ak-space-y-6 ak-p-4">
      {/* 页面标题和时间筛选 */}
      <div className="ak-flex ak-items-center ak-justify-between">
        <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">数据统计</h1>
        <div className="ak-flex ak-space-x-2">
          {[
            { value: '7d', label: '7天' },
            { value: '30d', label: '30天' },
            { value: '90d', label: '90天' },
            { value: '1y', label: '1年' }
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

      {/* 核心指标概览 */}
      <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 lg:ak-grid-cols-4 ak-gap-6">
        <PointsCard 
          balance={statsData.totalTransfers}
          label="总交易次数"
          showTrend
          trendValue={8}
          className="ak-bg-blue-50"
        />
        <PointsCard 
          balance={statsData.totalAmount}
          label="累计转移积分"
          showTrend
          trendValue={2800}
          className="ak-bg-green-50"
        />
        <PointsCard 
          balance={Math.round(statsData.successRate * 10)}
          label="成功率 (%)"
          className="ak-bg-purple-50"
        />
        <PointsCard 
          balance={Math.round(statsData.avgReturnTime * 10)}
          label="平均归还时间 (天)"
          className="ak-bg-orange-50"
        />
      </div>

      {/* 选项卡导航 */}
      <div className="ak-border-b">
        <div className="ak-flex ak-space-x-8">
          {[
            { id: 'overview', name: '总览' },
            { id: 'monthly', name: '月度趋势' },
            { id: 'groups', name: '群组分析' },
            { id: 'trends', name: '趋势预测' }
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
          {/* 交易分布 */}
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">交易分布</h3>
            <div className="ak-space-y-4">
              <div className="ak-flex ak-items-center ak-justify-between">
                <span className="ak-text-gray-600">转出交易</span>
                <div className="ak-flex ak-items-center ak-space-x-2">
                  <div className="ak-w-20 ak-bg-gray-200 ak-rounded-full ak-h-2">
                    <div className="ak-bg-blue-600 ak-h-2 ak-rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="ak-font-medium">28 次</span>
                </div>
              </div>
              
              <div className="ak-flex ak-items-center ak-justify-between">
                <span className="ak-text-gray-600">转入交易</span>
                <div className="ak-flex ak-items-center ak-space-x-2">
                  <div className="ak-w-20 ak-bg-gray-200 ak-rounded-full ak-h-2">
                    <div className="ak-bg-green-600 ak-h-2 ak-rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <span className="ak-font-medium">19 次</span>
                </div>
              </div>
            </div>
          </Card>

          {/* 金额分布 */}
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">金额分布</h3>
            <div className="ak-space-y-4">
              <div className="ak-flex ak-items-center ak-justify-between">
                <span className="ak-text-gray-600">100-500积分</span>
                <div className="ak-flex ak-items-center ak-space-x-2">
                  <div className="ak-w-20 ak-bg-gray-200 ak-rounded-full ak-h-2">
                    <div className="ak-bg-blue-600 ak-h-2 ak-rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <span className="ak-font-medium">18 次</span>
                </div>
              </div>
              
              <div className="ak-flex ak-items-center ak-justify-between">
                <span className="ak-text-gray-600">500-1000积分</span>
                <div className="ak-flex ak-items-center ak-space-x-2">
                  <div className="ak-w-20 ak-bg-gray-200 ak-rounded-full ak-h-2">
                    <div className="ak-bg-green-600 ak-h-2 ak-rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <span className="ak-font-medium">16 次</span>
                </div>
              </div>
              
              <div className="ak-flex ak-items-center ak-justify-between">
                <span className="ak-text-gray-600">1000+积分</span>
                <div className="ak-flex ak-items-center ak-space-x-2">
                  <div className="ak-w-20 ak-bg-gray-200 ak-rounded-full ak-h-2">
                    <div className="ak-bg-purple-600 ak-h-2 ak-rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <span className="ak-font-medium">13 次</span>
                </div>
              </div>
            </div>
          </Card>

          {/* 时间分布 */}
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">归还时间分析</h3>
            <div className="ak-space-y-4">
              <div className="ak-flex ak-items-center ak-justify-between">
                <span className="ak-text-gray-600">提前归还</span>
                <div className="ak-flex ak-items-center ak-space-x-2">
                  <div className="ak-w-20 ak-bg-gray-200 ak-rounded-full ak-h-2">
                    <div className="ak-bg-green-600 ak-h-2 ak-rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <span className="ak-font-medium ak-text-green-600">28 次</span>
                </div>
              </div>
              
              <div className="ak-flex ak-items-center ak-justify-between">
                <span className="ak-text-gray-600">按时归还</span>
                <div className="ak-flex ak-items-center ak-space-x-2">
                  <div className="ak-w-20 ak-bg-gray-200 ak-rounded-full ak-h-2">
                    <div className="ak-bg-blue-600 ak-h-2 ak-rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <span className="ak-font-medium ak-text-blue-600">17 次</span>
                </div>
              </div>
              
              <div className="ak-flex ak-items-center ak-justify-between">
                <span className="ak-text-gray-600">逾期归还</span>
                <div className="ak-flex ak-items-center ak-space-x-2">
                  <div className="ak-w-20 ak-bg-gray-200 ak-rounded-full ak-h-2">
                    <div className="ak-bg-red-600 ak-h-2 ak-rounded-full" style={{ width: '5%' }}></div>
                  </div>
                  <span className="ak-font-medium ak-text-red-600">2 次</span>
                </div>
              </div>
            </div>
          </Card>

          {/* 个人排名 */}
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">个人排名</h3>
            <div className="ak-space-y-4">
              <div className="ak-text-center ak-p-4 ak-bg-gradient-to-r ak-from-yellow-50 ak-to-orange-50 ak-rounded-lg">
                <div className="ak-text-3xl ak-mb-2">🏆</div>
                <div className="ak-text-lg ak-font-bold ak-text-gray-900">积分达人</div>
                <div className="ak-text-sm ak-text-gray-600">在所有用户中排名前15%</div>
              </div>
              
              <div className="ak-space-y-2">
                <div className="ak-flex ak-justify-between ak-text-sm">
                  <span className="ak-text-gray-600">交易活跃度排名</span>
                  <span className="ak-font-medium">#12</span>
                </div>
                <div className="ak-flex ak-justify-between ak-text-sm">
                  <span className="ak-text-gray-600">信用分数排名</span>
                  <span className="ak-font-medium">#8</span>
                </div>
                <div className="ak-flex ak-justify-between ak-text-sm">
                  <span className="ak-text-gray-600">归还及时率排名</span>
                  <span className="ak-font-medium">#6</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'monthly' && (
        <Card className="ak-p-6">
          <h3 className="ak-text-lg ak-font-semibold ak-mb-4">月度趋势分析</h3>
          <div className="ak-grid ak-grid-cols-1 lg:ak-grid-cols-2 ak-gap-6 ak-mb-6">
            <div>
              <h4 className="ak-font-medium ak-mb-3">交易次数趋势</h4>
              <div className="ak-space-y-2">
                {statsData.monthlyData?.map((data, index) => (
                  <div key={index} className="ak-flex ak-items-center ak-justify-between">
                    <span className="ak-text-sm ak-text-gray-600">{data.month}</span>
                    <div className="ak-flex ak-items-center ak-space-x-2">
                      <div className="ak-w-24 ak-bg-gray-200 ak-rounded-full ak-h-2">
                        <div 
                          className="ak-bg-blue-600 ak-h-2 ak-rounded-full" 
                          style={{ width: `${(data.transfers / 20) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ak-text-sm ak-font-medium ak-w-8">{data.transfers}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="ak-font-medium ak-mb-3">转移金额趋势</h4>
              <div className="ak-space-y-2">
                {statsData.monthlyData?.map((data, index) => (
                  <div key={index} className="ak-flex ak-items-center ak-justify-between">
                    <span className="ak-text-sm ak-text-gray-600">{data.month}</span>
                    <div className="ak-flex ak-items-center ak-space-x-2">
                      <div className="ak-w-24 ak-bg-gray-200 ak-rounded-full ak-h-2">
                        <div 
                          className="ak-bg-green-600 ak-h-2 ak-rounded-full" 
                          style={{ width: `${(data.amount / 12000) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ak-text-sm ak-font-medium ak-w-16">{(data.amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'groups' && (
        <Card className="ak-p-6">
          <h3 className="ak-text-lg ak-font-semibold ak-mb-4">群组分析</h3>
          <div className="ak-space-y-4">
            {statsData.groupStats?.map((group, index) => (
              <div key={index} className="ak-flex ak-items-center ak-justify-between ak-p-4 ak-border ak-rounded-lg">
                <div className="ak-flex ak-items-center ak-space-x-3">
                  <div className="ak-w-8 ak-h-8 ak-bg-blue-100 ak-rounded-full ak-flex ak-items-center ak-justify-center">
                    <span className="ak-text-sm ak-font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <div className="ak-font-medium ak-text-gray-900">{group.groupName}</div>
                    <div className="ak-text-sm ak-text-gray-600">{group.transfers} 次交易</div>
                  </div>
                </div>
                <div className="ak-text-right">
                  <div className="ak-font-medium ak-text-gray-900">
                    {(group.amount || 0).toLocaleString()} 积分
                  </div>
                  <div className="ak-text-sm ak-text-gray-600">
                    {Math.round((group.amount / statsData.totalAmount) * 100)}% 占比
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'trends' && (
        <div className="ak-grid ak-grid-cols-1 lg:ak-grid-cols-2 ak-gap-6">
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">趋势预测</h3>
            <div className="ak-text-center ak-py-8">
              <div className="ak-text-4xl ak-mb-2">📊</div>
              <p className="ak-text-gray-600">智能预测功能</p>
              <p className="ak-text-sm ak-text-gray-500 ak-mt-2">基于历史数据预测未来趋势</p>
            </div>
          </Card>
          
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">行为分析</h3>
            <div className="ak-text-center ak-py-8">
              <div className="ak-text-4xl ak-mb-2">🧠</div>
              <p className="ak-text-gray-600">用户行为分析</p>
              <p className="ak-text-sm ak-text-gray-500 ak-mt-2">深度分析交易模式和偏好</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}