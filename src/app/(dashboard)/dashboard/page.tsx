'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth, useTransactionSummary, usePendingRequests, useGroups } from '@/lib/hooks';

export default function DashboardPage() {
  const { user } = useAuth();
  const { summary } = useTransactionSummary();
  const { pendingRequests } = usePendingRequests();
  const { groups } = useGroups();

  const stats = [
    {
      label: '当前余额',
      value: summary?.currentBalance || 0,
      unit: '积分',
      color: 'ak-text-green-600',
      bg: 'ak-bg-green-50',
    },
    {
      label: '信用评分',
      value: user?.creditScore || 0,
      unit: '分',
      color: 'ak-text-blue-600',
      bg: 'ak-bg-blue-50',
    },
    {
      label: '待处理请求',
      value: pendingRequests?.length || 0,
      unit: '个',
      color: 'ak-text-orange-600',
      bg: 'ak-bg-orange-50',
    },
    {
      label: '参与群组',
      value: groups?.length || 0,
      unit: '个',
      color: 'ak-text-purple-600',
      bg: 'ak-bg-purple-50',
    },
  ];

  const recentTransactions = [
    { id: '1', type: '转出', amount: -300, user: '张三', date: '2024-01-25' },
    { id: '2', type: '收入', amount: 500, user: '李四', date: '2024-01-24' },
    { id: '3', type: '归还', amount: 200, user: '王五', date: '2024-01-23' },
  ];

  return (
    <div className="ak-space-y-6">
      {/* 欢迎信息 */}
      <div className="ak-bg-gradient-to-r ak-from-blue-600 ak-to-indigo-600 ak-text-white ak-rounded-lg ak-p-6">
        <h1 className="ak-text-2xl ak-font-bold ak-mb-2">
          欢迎回来，{user?.nickname}！
        </h1>
        <p className="ak-text-blue-100">
          今天是管理积分的好日子，查看您的最新动态
        </p>
      </div>

      {/* 关键指标卡片 */}
      <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 lg:ak-grid-cols-4 ak-gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className={`ak-p-6 ${stat.bg}`}>
            <div className="ak-flex ak-items-center ak-justify-between">
              <div>
                <p className="ak-text-sm ak-text-gray-600 ak-mb-1">{stat.label}</p>
                <p className={`ak-text-2xl ak-font-bold ${stat.color}`}>
                  {stat.value.toLocaleString()}
                  <span className="ak-text-sm ak-font-normal ak-ml-1">{stat.unit}</span>
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="ak-grid ak-grid-cols-1 lg:ak-grid-cols-2 ak-gap-6">
        {/* 待处理请求 */}
        <Card className="ak-p-6">
          <div className="ak-flex ak-items-center ak-justify-between ak-mb-4">
            <h2 className="ak-text-lg ak-font-semibold">待处理请求</h2>
            <Button variant="outline" size="sm">
              查看全部
            </Button>
          </div>
          
          {pendingRequests && pendingRequests.length > 0 ? (
            <div className="ak-space-y-3">
              {pendingRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="ak-flex ak-items-center ak-justify-between ak-p-3 ak-bg-orange-50 ak-rounded-lg">
                  <div>
                    <p className="ak-font-medium">{request.description}</p>
                    <p className="ak-text-sm ak-text-gray-600">
                      {request.amount} 积分 · 过期时间: {new Date(request.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ak-flex ak-space-x-2">
                    <Button size="sm" variant="outline">
                      拒绝
                    </Button>
                    <Button size="sm">
                      同意
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ak-text-center ak-py-8 ak-text-gray-500">
              <p>暂无待处理请求</p>
            </div>
          )}
        </Card>

        {/* 最近交易 */}
        <Card className="ak-p-6">
          <div className="ak-flex ak-items-center ak-justify-between ak-mb-4">
            <h2 className="ak-text-lg ak-font-semibold">最近交易</h2>
            <Button variant="outline" size="sm">
              查看全部
            </Button>
          </div>
          
          <div className="ak-space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="ak-flex ak-items-center ak-justify-between ak-p-3 ak-border ak-rounded-lg">
                <div>
                  <p className="ak-font-medium">{transaction.type}</p>
                  <p className="ak-text-sm ak-text-gray-600">
                    {transaction.user} · {transaction.date}
                  </p>
                </div>
                <div className={`ak-font-semibold ${
                  transaction.amount > 0 ? 'ak-text-green-600' : 'ak-text-red-600'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 快速操作 */}
      <Card className="ak-p-6">
        <h2 className="ak-text-lg ak-font-semibold ak-mb-4">快速操作</h2>
        <div className="ak-grid ak-grid-cols-2 md:ak-grid-cols-4 ak-gap-4">
          <Button variant="outline" className="ak-h-20 ak-flex-col">
            <span className="ak-text-2xl ak-mb-1">💰</span>
            <span>发起转账</span>
          </Button>
          <Button variant="outline" className="ak-h-20 ak-flex-col">
            <span className="ak-text-2xl ak-mb-1">👥</span>
            <span>创建群组</span>
          </Button>
          <Button variant="outline" className="ak-h-20 ak-flex-col">
            <span className="ak-text-2xl ak-mb-1">🔗</span>
            <span>加入群组</span>
          </Button>
          <Button variant="outline" className="ak-h-20 ak-flex-col">
            <span className="ak-text-2xl ak-mb-1">📊</span>
            <span>查看报表</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}