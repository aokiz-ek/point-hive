'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PointsDisplay, PointsCard } from '@/components/ui';
import { useAuth, useTransactions, useTransactionSummary } from '@/lib/hooks';
import { LocalStorage, generateId, formatDate } from '@/lib/utils/local-storage';

interface BalanceDetail {
  id: string;
  type: 'income' | 'expense' | 'return' | 'system';
  amount: number;
  balance: number;
  description: string;
  fromUserId?: string;
  toUserId?: string;
  groupId?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export default function BalancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balanceDetails, setBalanceDetails] = useState<BalanceDetail[]>([]);
  const [summary, setSummary] = useState({
    currentBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    totalReturned: 0,
    pendingOut: 0,
    pendingIn: 0,
    overdueCount: 0,
    overdueAmount: 0
  });
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'return' | 'system'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  useEffect(() => {
    loadBalanceData();
  }, [user]);

  const loadBalanceData = () => {
    if (!user) return;

    setLoading(true);
    try {
      const transactions = LocalStorage.getTransactions();
      const userTransactions = transactions.filter(t => 
        t.fromUserId === user.id || t.toUserId === user.id
      );

      // 按时间排序
      const sortedTransactions = userTransactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // 计算余额明细
      let currentBalance = 0;
      const details: BalanceDetail[] = [];

      sortedTransactions.forEach(transaction => {
        let amount = 0;
        let type: BalanceDetail['type'] = 'system';
        let description = transaction.description;

        if (transaction.toUserId === user.id) {
          // 收入
          amount = transaction.amount;
          type = transaction.type === 'system' ? 'system' : 'income';
          currentBalance += amount;
        } else if (transaction.fromUserId === user.id) {
          // 支出
          amount = -transaction.amount;
          type = transaction.type === 'return' ? 'return' : 'expense';
          currentBalance += amount;
        }

        details.push({
          id: transaction.id,
          type,
          amount,
          balance: currentBalance,
          description,
          fromUserId: transaction.fromUserId,
          toUserId: transaction.toUserId,
          groupId: transaction.groupId,
          createdAt: transaction.createdAt,
          metadata: transaction.metadata
        });
      });

      // 计算统计信息
      const income = details.filter(d => d.type === 'income').reduce((sum, d) => sum + d.amount, 0);
      const expense = details.filter(d => d.type === 'expense').reduce((sum, d) => sum + Math.abs(d.amount), 0);
      const returned = details.filter(d => d.type === 'return').reduce((sum, d) => sum + Math.abs(d.amount), 0);
      const pendingOut = userTransactions
        .filter(t => t.fromUserId === user.id && t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);
      const pendingIn = userTransactions
        .filter(t => t.toUserId === user.id && t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);

      // 计算逾期
      const now = new Date();
      const overdueTransactions = userTransactions.filter(t => 
        t.fromUserId === user.id && 
        t.status !== 'completed' && 
        t.dueDate && 
        new Date(t.dueDate) < now
      );
      const overdueCount = overdueTransactions.length;
      const overdueAmount = overdueTransactions.reduce((sum, t) => sum + t.amount, 0);

      setBalanceDetails(details);
      setSummary({
        currentBalance,
        totalIncome: income,
        totalExpense: expense,
        totalReturned: returned,
        pendingOut,
        pendingIn,
        overdueCount,
        overdueAmount
      });

    } catch (error) {
      console.error('加载余额数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByTimeRange = (details: BalanceDetail[]) => {
    if (timeRange === 'all') return details;
    
    const now = new Date();
    const days = parseInt(timeRange.replace('d', ''));
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return details.filter(d => new Date(d.createdAt) >= cutoffDate);
  };

  const filteredDetails = balanceDetails
    .filter(detail => {
      const matchesFilter = filter === 'all' || detail.type === filter;
      const matchesSearch = searchTerm === '' || 
        detail.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .filter(detail => filterByTimeRange([detail]).length > 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return '📈';
      case 'expense': return '📉';
      case 'return': return '↩️';
      case 'system': return '⚙️';
      default: return '💰';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income': return 'ak-text-green-600';
      case 'expense': return 'ak-text-red-600';
      case 'return': return 'ak-text-blue-600';
      case 'system': return 'ak-text-purple-600';
      default: return 'ak-text-gray-600';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'income': return '收入';
      case 'expense': return '支出';
      case 'return': return '归还';
      case 'system': return '系统';
      default: return '其他';
    }
  };

  const exportBalanceData = () => {
    const csvContent = [
      ['时间', '类型', '描述', '金额', '余额'].join(','),
      ...filteredDetails.map(detail => [
        formatDate(detail.createdAt),
        getTypeText(detail.type),
        `"${detail.description}"`,
        detail.amount,
        detail.balance
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `余额明细_${new Date().toLocaleDateString()}.csv`;
    link.click();
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
      <div className="ak-flex ak-items-center ak-justify-between">
        <div>
          <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">余额中心</h1>
          <p className="ak-text-gray-600">查看您的积分余额和交易明细</p>
        </div>
        <Button onClick={exportBalanceData} variant="outline">
          导出明细
        </Button>
      </div>

      {/* 余额概览 */}
      <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 lg:ak-grid-cols-4 ak-gap-6">
        <PointsCard 
          balance={summary.currentBalance}
          label="当前余额"
          showTrend
          trendValue={summary.currentBalance - (summary.totalIncome - summary.totalExpense)}
          className="ak-bg-green-50"
        />
        <PointsCard 
          balance={summary.totalIncome}
          label="总收入"
          showTrend
          trendValue={Math.round(summary.totalIncome * 0.1)}
          className="ak-bg-blue-50"
        />
        <PointsCard 
          balance={summary.totalExpense}
          label="总支出"
          showTrend
          trendValue={Math.round(summary.totalExpense * 0.05)}
          className="ak-bg-red-50"
        />
        <PointsCard 
          balance={summary.totalReturned}
          label="已归还"
          showTrend
          trendValue={Math.round(summary.totalReturned * 0.08)}
          className="ak-bg-purple-50"
        />
      </div>

      {/* 待处理和逾期提醒 */}
      {(summary.pendingOut > 0 || summary.pendingIn > 0 || summary.overdueCount > 0) && (
        <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-3 ak-gap-6">
          {summary.pendingOut > 0 && (
            <Card className="ak-p-4 ak-bg-orange-50">
              <div className="ak-text-center">
                <p className="ak-text-sm ak-text-gray-600">待支付</p>
                <p className="ak-text-2xl ak-font-bold ak-text-orange-600">
                  {summary.pendingOut.toLocaleString()}
                </p>
              </div>
            </Card>
          )}
          {summary.pendingIn > 0 && (
            <Card className="ak-p-4 ak-bg-blue-50">
              <div className="ak-text-center">
                <p className="ak-text-sm ak-text-gray-600">待收款</p>
                <p className="ak-text-2xl ak-font-bold ak-text-blue-600">
                  {summary.pendingIn.toLocaleString()}
                </p>
              </div>
            </Card>
          )}
          {summary.overdueCount > 0 && (
            <Card className="ak-p-4 ak-bg-red-50">
              <div className="ak-text-center">
                <p className="ak-text-sm ak-text-gray-600">逾期</p>
                <p className="ak-text-2xl ak-font-bold ak-text-red-600">
                  {summary.overdueCount} 笔
                </p>
                <p className="ak-text-sm ak-text-red-600">
                  {summary.overdueAmount.toLocaleString()} 积分
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 筛选和搜索 */}
      <Card className="ak-p-4">
        <div className="ak-flex ak-flex-col ak-space-y-4 md:ak-flex-row md:ak-space-y-0 md:ak-space-x-4 ak-items-center">
          <div className="ak-flex-1 ak-w-full">
            <Input
              placeholder="搜索交易描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="ak-flex ak-space-x-2">
            {[
              { value: 'all', label: '全部' },
              { value: 'income', label: '收入' },
              { value: 'expense', label: '支出' },
              { value: 'return', label: '归还' },
              { value: 'system', label: '系统' }
            ].map((item) => (
              <Button
                key={item.value}
                variant={filter === item.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(item.value as any)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="ak-flex ak-space-x-2">
            {[
              { value: '7d', label: '7天' },
              { value: '30d', label: '30天' },
              { value: '90d', label: '90天' },
              { value: '1y', label: '1年' },
              { value: 'all', label: '全部' }
            ].map((item) => (
              <Button
                key={item.value}
                variant={timeRange === item.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(item.value as any)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* 余额明细 */}
      <Card className="ak-p-6">
        <div className="ak-flex ak-items-center ak-justify-between ak-mb-4">
          <h3 className="ak-text-lg ak-font-semibold">余额明细</h3>
          <p className="ak-text-sm ak-text-gray-600">
            共 {filteredDetails.length} 条记录
          </p>
        </div>

        {filteredDetails.length > 0 ? (
          <div className="ak-space-y-4">
            {filteredDetails.map((detail) => (
              <div key={detail.id} className="ak-flex ak-items-center ak-justify-between ak-p-4 ak-border ak-rounded-lg">
                <div className="ak-flex ak-items-center ak-space-x-4">
                  <div className="ak-text-2xl">{getTypeIcon(detail.type)}</div>
                  <div className="ak-flex-1">
                    <div className="ak-font-medium ak-text-gray-900 ak-mb-1">
                      {detail.description}
                    </div>
                    <div className="ak-flex ak-items-center ak-space-x-4 ak-text-sm ak-text-gray-600">
                      <span className={`ak-font-medium ${getTypeColor(detail.type)}`}>
                        {getTypeText(detail.type)}
                      </span>
                      <span>{formatDate(detail.createdAt)}</span>
                      {detail.groupId && (
                        <span className="ak-bg-gray-100 ak-text-gray-700 ak-text-xs ak-px-2 ak-py-1 ak-rounded">
                          群组
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="ak-text-right">
                  <div className={`ak-text-lg ak-font-bold ${
                    detail.amount > 0 ? 'ak-text-green-600' : 'ak-text-red-600'
                  }`}>
                    {detail.amount > 0 ? '+' : ''}{detail.amount.toLocaleString()}
                  </div>
                  <div className="ak-text-sm ak-text-gray-600">
                    余额: {detail.balance.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ak-text-center ak-py-8 ak-text-gray-500">
            <div className="ak-text-6xl ak-mb-4">📊</div>
            <p className="ak-text-lg ak-font-medium ak-text-gray-900 ak-mb-2">
              {searchTerm ? '未找到匹配的记录' : '暂无余额明细'}
            </p>
            <p className="ak-text-gray-600">
              {searchTerm ? '请调整搜索条件' : '开始交易后将显示明细记录'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}