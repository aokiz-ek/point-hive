'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PointsDisplay } from '@/components/ui';
import { useAuth } from '@/lib/hooks';
import { LocalStorage, generateId, formatDate } from '@/lib/utils/local-storage';
import type { Transaction } from '@/lib/types';

interface ReturnTransaction {
  id: string;
  originalTransactionId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  description: string;
  dueDate: string;
  createdAt: string;
  groupId?: string;
  isOverdue: boolean;
  daysOverdue?: number;
}

export default function ReturnPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [returnTransactions, setReturnTransactions] = useState<ReturnTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<ReturnTransaction | null>(null);
  const [returnAmount, setReturnAmount] = useState('');
  const [returnNote, setReturnNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');

  useEffect(() => {
    loadReturnData();
  }, [user]);

  const loadReturnData = () => {
    if (!user) return;

    setLoading(true);
    try {
      const transactions = LocalStorage.getTransactions();
      const now = new Date();

      // 获取需要归还的交易（用户是接收方，且未归还）
      const pendingReturns = transactions
        .filter(t => 
          t.toUserId === user.id && 
          t.status === 'completed' && 
          t.type === 'transfer' &&
          !t.returnedAt
        )
        .map(t => {
          const dueDate = new Date(t.dueDate || t.createdAt);
          dueDate.setDate(dueDate.getDate() + 7); // 默认7天后归还
          const isOverdue = dueDate < now;
          const daysOverdue = isOverdue ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

          return {
            id: t.id,
            originalTransactionId: t.id,
            fromUserId: t.fromUserId,
            toUserId: t.toUserId,
            amount: t.amount,
            description: t.description,
            dueDate: dueDate.toISOString(),
            createdAt: t.createdAt,
            groupId: t.groupId,
            isOverdue,
            daysOverdue
          };
        });

      // 获取已归还的交易
      const completedReturns = transactions
        .filter(t => 
          t.fromUserId === user.id && 
          t.type === 'return' && 
          t.status === 'completed'
        )
        .map(t => {
          const originalTransaction = transactions.find(orig => orig.id === t.metadata?.originalTransactionId);
          return {
            id: t.id,
            originalTransactionId: t.metadata?.originalTransactionId || '',
            fromUserId: t.fromUserId,
            toUserId: t.toUserId,
            amount: originalTransaction?.amount || 0,
            description: originalTransaction?.description || '',
            dueDate: originalTransaction?.dueDate || '',
            createdAt: originalTransaction?.createdAt || '',
            groupId: t.groupId,
            isOverdue: false,
            returnedAt: t.returnedAt,
            returnAmount: t.amount
          };
        });

      const allReturns = [...pendingReturns, ...completedReturns as any];
      setReturnTransactions(allReturns);

    } catch (error) {
      console.error('加载归还数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = returnTransactions.filter(transaction => {
    if (activeTab === 'pending') {
      return !transaction.returnedAt;
    } else if (activeTab === 'completed') {
      return transaction.returnedAt;
    }
    return true;
  });

  const handleReturn = async () => {
    if (!selectedTransaction || !returnAmount || !user) return;

    const amount = parseFloat(returnAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('请输入有效的归还金额');
      return;
    }

    if (amount > selectedTransaction.amount) {
      alert('归还金额不能超过原交易金额');
      return;
    }

    setProcessing(true);
    try {
      // 创建归还交易
      const returnTransaction: Transaction = {
        id: generateId(),
        type: 'return',
        fromUserId: user.id,
        toUserId: selectedTransaction.fromUserId,
        amount: amount,
        status: 'completed',
        description: returnNote || `归还 - ${selectedTransaction.description}`,
        createdAt: new Date().toISOString(),
        returnedAt: new Date().toISOString(),
        groupId: selectedTransaction.groupId,
        metadata: {
          originalTransactionId: selectedTransaction.originalTransactionId,
          isPartialReturn: amount < selectedTransaction.amount,
          originalAmount: selectedTransaction.amount
        }
      };

      LocalStorage.addTransaction(returnTransaction);

      // 如果是全额归还，标记原交易为已归还
      if (amount === selectedTransaction.amount) {
        LocalStorage.updateTransaction(selectedTransaction.originalTransactionId, {
          returnedAt: new Date().toISOString()
        });
      }

      // 发送通知给原转账人
      const notification = {
        id: generateId(),
        type: 'return_completed' as const,
        title: '积分已归还',
        message: `${user.nickname || user.name} 归还了 ${amount} 积分`,
        userId: selectedTransaction.fromUserId,
        read: false,
        createdAt: new Date().toISOString(),
        metadata: {
          transactionId: returnTransaction.id,
          originalTransactionId: selectedTransaction.originalTransactionId,
          amount: amount
        }
      };
      LocalStorage.addNotification(notification);

      // 重置表单
      setSelectedTransaction(null);
      setReturnAmount('');
      setReturnNote('');
      
      // 重新加载数据
      loadReturnData();

      alert('归还成功！');

    } catch (error) {
      console.error('归还失败:', error);
      alert('归还失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  const getOverdueStatus = (transaction: ReturnTransaction) => {
    if (!transaction.isOverdue) return null;
    
    return (
      <div className="ak-bg-red-100 ak-text-red-800 ak-text-xs ak-px-2 ak-py-1 ak-rounded-full">
        逾期 {transaction.daysOverdue} 天
      </div>
    );
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
        <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">积分归还</h1>
        <p className="ak-text-gray-600">管理和归还您的积分借款</p>
      </div>

      {/* 统计信息 */}
      <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-3 ak-gap-6">
        <Card className="ak-p-4 ak-bg-orange-50">
          <div className="ak-text-center">
            <p className="ak-text-sm ak-text-gray-600">待归还</p>
            <p className="ak-text-2xl ak-font-bold ak-text-orange-600">
              {filteredTransactions.filter(t => !t.returnedAt).length} 笔
            </p>
          </div>
        </Card>
        <Card className="ak-p-4 ak-bg-red-50">
          <div className="ak-text-center">
            <p className="ak-text-sm ak-text-gray-600">逾期</p>
            <p className="ak-text-2xl ak-font-bold ak-text-red-600">
              {filteredTransactions.filter(t => !t.returnedAt && t.isOverdue).length} 笔
            </p>
          </div>
        </Card>
        <Card className="ak-p-4 ak-bg-green-50">
          <div className="ak-text-center">
            <p className="ak-text-sm ak-text-gray-600">已归还</p>
            <p className="ak-text-2xl ak-font-bold ak-text-green-600">
              {filteredTransactions.filter(t => t.returnedAt).length} 笔
            </p>
          </div>
        </Card>
      </div>

      {/* 选项卡 */}
      <div className="ak-border-b">
        <div className="ak-flex ak-space-x-8">
          {[
            { id: 'pending', name: '待归还', count: filteredTransactions.filter(t => !t.returnedAt).length },
            { id: 'completed', name: '已归还', count: filteredTransactions.filter(t => t.returnedAt).length },
            { id: 'all', name: '全部', count: filteredTransactions.length }
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
              <span>{tab.name}</span>
              <span className="ak-bg-gray-100 ak-text-gray-600 ak-text-xs ak-px-2 ak-py-1 ak-rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="ak-grid ak-grid-cols-1 lg:ak-grid-cols-2 ak-gap-6">
        {/* 归还列表 */}
        <div className="ak-space-y-4">
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">
              {activeTab === 'pending' ? '待归还交易' : activeTab === 'completed' ? '已归还交易' : '所有交易'}
            </h3>
            
            {filteredTransactions.length > 0 ? (
              <div className="ak-space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className={`ak-p-4 ak-border ak-rounded-lg ak-cursor-pointer ak-transition-colors ${
                      selectedTransaction?.id === transaction.id 
                        ? 'ak-border-blue-500 ak-bg-blue-50' 
                        : 'ak-border-gray-200 hover:ak-border-gray-300'
                    }`}
                    onClick={() => {
                      if (!transaction.returnedAt) {
                        setSelectedTransaction(transaction);
                        setReturnAmount(transaction.amount.toString());
                      }
                    }}
                  >
                    <div className="ak-flex ak-items-center ak-justify-between ak-mb-2">
                      <div className="ak-flex ak-items-center ak-space-x-2">
                        <span className="ak-text-lg">💰</span>
                        <div>
                          <div className="ak-font-medium ak-text-gray-900">
                            {transaction.description}
                          </div>
                          <div className="ak-text-sm ak-text-gray-600">
                            借款时间: {formatDate(transaction.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="ak-text-right">
                        <div className="ak-font-bold ak-text-gray-900">
                          {transaction.amount.toLocaleString()} 积分
                        </div>
                        {getOverdueStatus(transaction)}
                      </div>
                    </div>
                    
                    {transaction.returnedAt && (
                      <div className="ak-flex ak-items-center ak-justify-between ak-text-sm ak-text-green-600">
                        <span>已归还</span>
                        <span>{formatDate(transaction.returnedAt)}</span>
                      </div>
                    )}
                    
                    {!transaction.returnedAt && (
                      <div className="ak-flex ak-items-center ak-justify-between ak-text-sm">
                        <span className="ak-text-orange-600">
                          到期时间: {formatDate(transaction.dueDate)}
                        </span>
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransaction(transaction);
                            setReturnAmount(transaction.amount.toString());
                          }}
                        >
                          立即归还
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="ak-text-center ak-py-8 ak-text-gray-500">
                <div className="ak-text-6xl ak-mb-4">📋</div>
                <p className="ak-text-lg ak-font-medium ak-text-gray-900 ak-mb-2">
                  暂无{activeTab === 'pending' ? '待归还' : activeTab === 'completed' ? '已归还' : ''}交易
                </p>
                <p className="ak-text-gray-600">
                  {activeTab === 'pending' ? '您没有需要归还的积分' : '暂无相关记录'}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* 归还表单 */}
        <div className="ak-space-y-4">
          {selectedTransaction && !selectedTransaction.returnedAt && (
            <Card className="ak-p-6">
              <h3 className="ak-text-lg ak-font-semibold ak-mb-4">归还积分</h3>
              
              <div className="ak-space-y-4">
                <div className="ak-bg-gray-50 ak-p-4 ak-rounded-lg">
                  <div className="ak-flex ak-items-center ak-justify-between ak-mb-2">
                    <span className="ak-text-sm ak-text-gray-600">原交易</span>
                    <span className="ak-font-medium">{selectedTransaction.description}</span>
                  </div>
                  <div className="ak-flex ak-items-center ak-justify-between ak-mb-2">
                    <span className="ak-text-sm ak-text-gray-600">借款金额</span>
                    <span className="ak-font-bold ak-text-red-600">
                      {selectedTransaction.amount.toLocaleString()} 积分
                    </span>
                  </div>
                  <div className="ak-flex ak-items-center ak-justify-between">
                    <span className="ak-text-sm ak-text-gray-600">到期时间</span>
                    <span className={`ak-font-medium ${
                      selectedTransaction.isOverdue ? 'ak-text-red-600' : 'ak-text-gray-900'
                    }`}>
                      {formatDate(selectedTransaction.dueDate)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                    归还金额 <span className="ak-text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={returnAmount}
                    onChange={(e) => setReturnAmount(e.target.value)}
                    placeholder="请输入归还金额"
                    max={selectedTransaction.amount}
                    min={1}
                  />
                  <p className="ak-text-sm ak-text-gray-500 ak-mt-1">
                    最大可归还: {selectedTransaction.amount.toLocaleString()} 积分
                  </p>
                </div>

                <div>
                  <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                    归还说明
                  </label>
                  <textarea
                    value={returnNote}
                    onChange={(e) => setReturnNote(e.target.value)}
                    placeholder="可选：添加归还说明..."
                    rows={3}
                    className="ak-w-full ak-px-3 ak-py-2 ak-border ak-border-gray-300 ak-rounded-md ak-focus:outline-none ak-focus:ring-2 ak-focus:ring-blue-500 ak-focus:border-transparent"
                  />
                </div>

                {selectedTransaction.isOverdue && (
                  <div className="ak-bg-red-50 ak-border ak-border-red-200 ak-rounded-md ak-p-3">
                    <p className="ak-text-sm ak-text-red-600">
                      ⚠️ 该交易已逾期 {selectedTransaction.daysOverdue} 天，请尽快归还以免影响信用评分
                    </p>
                  </div>
                )}

                <div className="ak-flex ak-space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedTransaction(null);
                      setReturnAmount('');
                      setReturnNote('');
                    }}
                    className="ak-flex-1"
                  >
                    取消
                  </Button>
                  <Button 
                    onClick={handleReturn}
                    disabled={processing || !returnAmount}
                    className="ak-flex-1 ak-bg-green-600 hover:ak-bg-green-700"
                  >
                    {processing ? '处理中...' : '确认归还'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* 归还提示 */}
          {!selectedTransaction && (
            <Card className="ak-p-6">
              <h3 className="ak-text-lg ak-font-semibold ak-mb-4">归还说明</h3>
              <div className="ak-space-y-4">
                <div className="ak-flex ak-items-start ak-space-x-3">
                  <span className="ak-text-lg">💡</span>
                  <div>
                    <div className="ak-font-medium ak-text-gray-900">及时归还</div>
                    <div className="ak-text-sm ak-text-gray-600">
                      按时归还积分有助于保持良好的信用记录
                    </div>
                  </div>
                </div>
                
                <div className="ak-flex ak-items-start ak-space-x-3">
                  <span className="ak-text-lg">⚠️</span>
                  <div>
                    <div className="ak-font-medium ak-text-gray-900">避免逾期</div>
                    <div className="ak-text-sm ak-text-gray-600">
                      逾期归还会影响您的信用评分，请务必按时归还
                    </div>
                  </div>
                </div>
                
                <div className="ak-flex ak-items-start ak-space-x-3">
                  <span className="ak-text-lg">📝</span>
                  <div>
                    <div className="ak-font-medium ak-text-gray-900">部分归还</div>
                    <div className="ak-text-sm ak-text-gray-600">
                      支持部分归还，剩余金额仍需按时归还
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}