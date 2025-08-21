'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTransactions, useTransactionSummary } from '@/lib/hooks';

export default function TransactionsPage() {
  const [filter, setFilter] = useState<'all' | 'transfer' | 'return'>('all');
  const [status, setStatus] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 使用真实的 API 数据
  const { data: transactionsData, isLoading: isLoadingTransactions, error: transactionsError } = useTransactions();
  const { data: summaryData, isLoading: isLoadingSummary, error: summaryError } = useTransactionSummary();
  
  const transactions = transactionsData || [];
  const summary = summaryData || {
    currentBalance: 0,
    totalTransferred: 0,
    totalReceived: 0,
    pendingOut: 0,
    pendingIn: 0
  };
  
  const loading = isLoadingTransactions || isLoadingSummary;
  const error = transactionsError || summaryError;

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm === '' || transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filter === 'all' || transaction.type === filter;
    const matchesStatus = status === 'all' || transaction.status === status;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'ak-text-green-600 ak-bg-green-50';
      case 'pending':
        return 'ak-text-orange-600 ak-bg-orange-50';
      case 'rejected':
        return 'ak-text-red-600 ak-bg-red-50';
      default:
        return 'ak-text-gray-600 ak-bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'pending':
        return '待处理';
      case 'rejected':
        return '已拒绝';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'transfer':
        return '转账';
      case 'return':
        return '归还';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="ak-flex ak-items-center ak-justify-center ak-py-12">
        <div className="ak-animate-spin ak-rounded-full ak-h-8 ak-w-8 ak-border-b-2 ak-border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ak-text-center ak-py-12">
        <p className="ak-text-red-600">{error}</p>
        <Button className="ak-mt-4" onClick={() => window.location.reload()}>
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="ak-space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">交易记录</h1>
        <p className="ak-text-gray-600">查看您的积分交易历史</p>
      </div>

      {/* 交易汇总 */}
      {summary && (
        <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-4 ak-gap-6">
          <Card className="ak-p-4 ak-bg-green-50">
            <div className="ak-text-center">
              <p className="ak-text-sm ak-text-gray-600">当前余额</p>
              <p className="ak-text-2xl ak-font-bold ak-text-green-600">
                {summary.currentBalance.toLocaleString()}
              </p>
            </div>
          </Card>
          <Card className="ak-p-4 ak-bg-blue-50">
            <div className="ak-text-center">
              <p className="ak-text-sm ak-text-gray-600">总转出</p>
              <p className="ak-text-2xl ak-font-bold ak-text-blue-600">
                {summary.totalTransferred.toLocaleString()}
              </p>
            </div>
          </Card>
          <Card className="ak-p-4 ak-bg-purple-50">
            <div className="ak-text-center">
              <p className="ak-text-sm ak-text-gray-600">总收入</p>
              <p className="ak-text-2xl ak-font-bold ak-text-purple-600">
                {summary.totalReceived.toLocaleString()}
              </p>
            </div>
          </Card>
          <Card className="ak-p-4 ak-bg-orange-50">
            <div className="ak-text-center">
              <p className="ak-text-sm ak-text-gray-600">待处理</p>
              <p className="ak-text-2xl ak-font-bold ak-text-orange-600">
                {summary.pendingOut.toLocaleString()}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* 搜索和筛选 */}
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
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              全部类型
            </Button>
            <Button
              variant={filter === 'transfer' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('transfer')}
            >
              转账
            </Button>
            <Button
              variant={filter === 'return' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('return')}
            >
              归还
            </Button>
          </div>

          <div className="ak-flex ak-space-x-2">
            <Button
              variant={status === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus('all')}
            >
              全部状态
            </Button>
            <Button
              variant={status === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus('pending')}
            >
              待处理
            </Button>
            <Button
              variant={status === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus('completed')}
            >
              已完成
            </Button>
          </div>
        </div>
      </Card>

      {/* 交易列表 */}
      {filteredTransactions.length > 0 ? (
        <div className="ak-space-y-4">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="ak-p-6">
              <div className="ak-flex ak-items-center ak-justify-between ak-mb-4">
                <div className="ak-flex ak-items-center ak-space-x-4">
                  <div className={`ak-px-3 ak-py-1 ak-rounded-full ak-text-sm ak-font-medium ${getStatusColor(transaction.status)}`}>
                    {getStatusText(transaction.status)}
                  </div>
                  <div className="ak-flex ak-items-center ak-space-x-2">
                    <span className="ak-text-sm ak-text-gray-500">{getTypeText(transaction.type)}</span>
                    <span className="ak-text-sm ak-text-gray-400">•</span>
                    <span className="ak-text-sm ak-text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className={`ak-text-xl ak-font-bold ${
                  transaction.fromUserId === '1' ? 'ak-text-red-600' : 'ak-text-green-600'
                }`}>
                  {transaction.fromUserId === '1' ? '-' : '+'}
                  {transaction.amount.toLocaleString()}
                </div>
              </div>

              <div className="ak-mb-4">
                <h3 className="ak-font-semibold ak-text-gray-900 ak-mb-2">
                  {transaction.description}
                </h3>
                <div className="ak-grid ak-grid-cols-2 md:ak-grid-cols-4 ak-gap-4 ak-text-sm">
                  <div>
                    <p className="ak-text-gray-500">交易ID</p>
                    <p className="ak-font-mono">{transaction.id}</p>
                  </div>
                  <div>
                    <p className="ak-text-gray-500">对方</p>
                    <p>{transaction.fromUserId === '1' ? `用户${transaction.toUserId}` : `用户${transaction.fromUserId}`}</p>
                  </div>
                  {transaction.dueDate && (
                    <div>
                      <p className="ak-text-gray-500">到期时间</p>
                      <p>{new Date(transaction.dueDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {transaction.returnedAt && (
                    <div>
                      <p className="ak-text-gray-500">归还时间</p>
                      <p>{new Date(transaction.returnedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="ak-flex ak-items-center ak-justify-between">
                <div className="ak-flex-1">
                  {transaction.metadata?.tags && transaction.metadata.tags.length > 0 && (
                    <div className="ak-flex ak-flex-wrap ak-gap-2">
                      {transaction.metadata.tags.map((tag) => (
                        <span
                          key={tag}
                          className="ak-bg-gray-100 ak-text-gray-700 ak-text-xs ak-px-2 ak-py-1 ak-rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {transaction.metadata?.rejectionReason && (
                    <div className="ak-bg-red-50 ak-text-red-700 ak-text-sm ak-px-3 ak-py-2 ak-rounded ak-mt-2">
                      拒绝原因: {transaction.metadata.rejectionReason}
                    </div>
                  )}
                </div>
                
                <div className="ak-flex ak-space-x-2 ak-ml-4">
                  {transaction.status === 'pending' && transaction.fromUserId === '1' && (
                    <>
                      <Button size="sm" variant="outline">
                        撤销申请
                      </Button>
                      <Button size="sm">
                        催促处理
                      </Button>
                    </>
                  )}
                  {transaction.status === 'pending' && transaction.toUserId === '1' && (
                    <>
                      <Button size="sm" variant="outline" className="ak-text-red-600 ak-border-red-200 hover:ak-bg-red-50">
                        拒绝
                      </Button>
                      <Button size="sm" className="ak-bg-green-600 hover:ak-bg-green-700">
                        同意
                      </Button>
                    </>
                  )}
                  {transaction.status === 'completed' && (
                    <Button size="sm" variant="outline">
                      查看详情
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="ak-p-12 ak-text-center">
          <div className="ak-text-gray-400 ak-mb-4">
            <span className="ak-text-6xl">💰</span>
          </div>
          <h3 className="ak-text-lg ak-font-semibold ak-text-gray-900 ak-mb-2">
            {searchTerm ? '未找到匹配的交易' : '暂无交易记录'}
          </h3>
          <p className="ak-text-gray-600 ak-mb-6">
            {searchTerm 
              ? '请尝试调整搜索条件'
              : '开始您的第一笔积分交易'
            }
          </p>
          {!searchTerm && (
            <Button>
              发起转账
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}