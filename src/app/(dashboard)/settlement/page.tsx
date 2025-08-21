'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/hooks';
import { LocalStorage, generateId, formatDate } from '@/lib/utils/local-storage';
import type { Transaction, Group } from '@/lib/types';

interface SettlementNode {
  userId: string;
  userName: string;
  balance: number; // 正数表示应收，负数表示应付
}

interface SettlementEdge {
  from: string;
  to: string;
  amount: number;
}

interface SettlementResult {
  nodes: SettlementNode[];
  edges: SettlementEdge[];
  totalTransactions: number;
  simplifiedCount: number;
  reductionRate: number;
}

export default function SettlementPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [settlementResult, setSettlementResult] = useState<SettlementResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [settlementHistory, setSettlementHistory] = useState<any[]>([]);

  useEffect(() => {
    loadGroups();
    loadSettlementHistory();
  }, []);

  const loadGroups = () => {
    try {
      const allGroups = LocalStorage.getGroups();
      const userGroups = allGroups.filter(group => 
        group.memberIds.includes(user?.id || '') && 
        group.adminIds.includes(user?.id || '')
      );
      setGroups(userGroups);
    } catch (error) {
      console.error('加载群组失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettlementHistory = () => {
    try {
      const history = LocalStorage.getItem<any[]>('point-hive-settlement-history') || [];
      setSettlementHistory(history);
    } catch (error) {
      console.error('加载结算历史失败:', error);
    }
  };

  const calculateSettlement = (groupId: string) => {
    const transactions = LocalStorage.getTransactions();
    const groupTransactions = transactions.filter(t => 
      t.groupId === groupId && 
      t.status === 'completed' &&
      t.type !== 'system' &&
      t.type !== 'return'
    );

    // 计算每个用户的净余额
    const balances: Record<string, number> = {};
    const userNames: Record<string, string> = {};

    groupTransactions.forEach(transaction => {
      // 初始化用户余额
      if (!balances[transaction.fromUserId]) {
        balances[transaction.fromUserId] = 0;
        userNames[transaction.fromUserId] = `用户${transaction.fromUserId}`;
      }
      if (!balances[transaction.toUserId]) {
        balances[transaction.toUserId] = 0;
        userNames[transaction.toUserId] = `用户${transaction.toUserId}`;
      }

      // 转出方减少余额，转入方增加余额
      balances[transaction.fromUserId] -= transaction.amount;
      balances[transaction.toUserId] += transaction.amount;
    });

    // 构建节点
    const nodes: SettlementNode[] = Object.entries(balances)
      .filter(([_, balance]) => Math.abs(balance) > 0.01) // 忽略小额余额
      .map(([userId, balance]) => ({
        userId,
        userName: userNames[userId],
        balance: Math.round(balance * 100) / 100 // 保留两位小数
      }));

    // 简化算法：将债务关系最小化
    const edges: SettlementEdge[] = [];
    const creditors = nodes.filter(n => n.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = nodes.filter(n => n.balance < 0).sort((a, b) => a.balance - b.balance);

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      const amount = Math.min(creditor.balance, -debtor.balance);

      if (amount > 0.01) {
        edges.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: Math.round(amount * 100) / 100
        });

        // 更新余额
        creditor.balance -= amount;
        debtor.balance += amount;

        // 如果余额接近0，移动到下一个
        if (creditor.balance < 0.01) creditorIndex++;
        if (debtor.balance > -0.01) debtorIndex++;
      } else {
        // 余额接近0，移动到下一个
        creditorIndex++;
        debtorIndex++;
      }
    }

    const originalTransactions = groupTransactions.length;
    const simplifiedCount = edges.length;
    const reductionRate = originalTransactions > 0 ? ((originalTransactions - simplifiedCount) / originalTransactions * 100) : 0;

    return {
      nodes,
      edges,
      totalTransactions: originalTransactions,
      simplifiedCount,
      reductionRate: Math.round(reductionRate * 100) / 100
    };
  };

  const handleAnalyze = () => {
    if (!selectedGroup) return;

    const result = calculateSettlement(selectedGroup.id);
    setSettlementResult(result);
  };

  const handleSettle = async () => {
    if (!selectedGroup || !settlementResult || !user) return;

    setProcessing(true);
    try {
      // 创建结算记录
      const settlement = {
        id: generateId(),
        groupId: selectedGroup.id,
        groupName: selectedGroup.name,
        initiatorId: user.id,
        initiatorName: user.nickname || user.name,
        description: `群组 "${selectedGroup.name}" 统一结算`,
        status: 'completed' as const,
        transactions: settlementResult.edges.map(edge => ({
          id: generateId(),
          fromUserId: edge.from,
          toUserId: edge.to,
          amount: edge.amount,
          description: `统一结算`,
          status: 'completed' as const,
          createdAt: new Date().toISOString()
        })),
        summary: {
          totalTransactions: settlementResult.totalTransactions,
          simplifiedCount: settlementResult.simplifiedCount,
          reductionRate: settlementResult.reductionRate,
          netAmounts: settlementResult.nodes.reduce((acc, node) => {
            acc[node.userId] = node.balance;
            return acc;
          }, {} as Record<string, number>)
        },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };

      // 保存结算记录
      const history = LocalStorage.getItem<any[]>('point-hive-settlement-history') || [];
      history.unshift(settlement);
      LocalStorage.setItem('point-hive-settlement-history', history);

      // 创建结算交易记录
      settlementResult.edges.forEach(edge => {
        const transaction: Transaction = {
          id: generateId(),
          type: 'transfer',
          fromUserId: edge.from,
          toUserId: edge.to,
          amount: edge.amount,
          status: 'completed',
          description: `统一结算 - ${selectedGroup.name}`,
          createdAt: new Date().toISOString(),
          groupId: selectedGroup.id,
          metadata: {
            type: 'settlement',
            settlementId: settlement.id,
            originalTransactions: settlementResult.totalTransactions
          }
        };
        LocalStorage.addTransaction(transaction);
      });

      // 发送通知给所有参与者
      settlementResult.nodes.forEach(node => {
        if (node.userId !== user.id) {
          const notification = {
            id: generateId(),
            type: 'settlement_completed' as const,
            title: '统一结算完成',
            message: `群组 "${selectedGroup.name}" 已完成统一结算`,
            userId: node.userId,
            read: false,
            createdAt: new Date().toISOString(),
            metadata: {
              groupId: selectedGroup.id,
              settlementId: settlement.id,
              userBalance: node.balance
            }
          };
          LocalStorage.addNotification(notification);
        }
      });

      // 重置状态
      setSelectedGroup(null);
      setSettlementResult(null);
      
      // 重新加载历史
      loadSettlementHistory();

      alert('结算完成！');

    } catch (error) {
      console.error('结算失败:', error);
      alert('结算失败，请重试');
    } finally {
      setProcessing(false);
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
        <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">统一结算</h1>
        <p className="ak-text-gray-600">简化群组内的复杂债务关系，实现最优结算方案</p>
      </div>

      {/* 群组选择 */}
      <Card className="ak-p-6">
        <h3 className="ak-text-lg ak-font-semibold ak-mb-4">选择群组</h3>
        
        {groups.length > 0 ? (
          <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 lg:ak-grid-cols-3 ak-gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className={`ak-p-4 ak-border ak-rounded-lg ak-cursor-pointer ak-transition-colors ${
                  selectedGroup?.id === group.id
                    ? 'ak-border-blue-500 ak-bg-blue-50'
                    : 'ak-border-gray-200 hover:ak-border-gray-300'
                }`}
                onClick={() => setSelectedGroup(group)}
              >
                <div className="ak-font-medium ak-text-gray-900 ak-mb-2">
                  {group.name}
                </div>
                <div className="ak-text-sm ak-text-gray-600">
                  {group.memberIds?.length || 0} 成员 · {(group.totalPoints || 0).toLocaleString()} 积分
                </div>
                {selectedGroup?.id === group.id && (
                  <div className="ak-mt-2">
                    <Button size="sm" onClick={handleAnalyze}>
                      分析债务
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="ak-text-center ak-py-8 ak-text-gray-500">
            <p>您没有可管理的群组</p>
            <Button className="ak-mt-4" asChild>
              <a href="/groups/create">创建群组</a>
            </Button>
          </div>
        )}
      </Card>

      {/* 结算结果 */}
      {settlementResult && (
        <div className="ak-grid ak-grid-cols-1 lg:ak-grid-cols-2 ak-gap-6">
          {/* 结算概览 */}
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">结算概览</h3>
            
            <div className="ak-grid ak-grid-cols-2 ak-gap-4 ak-mb-6">
              <div className="ak-text-center">
                <div className="ak-text-2xl ak-font-bold ak-text-blue-600">
                  {settlementResult.totalTransactions}
                </div>
                <div className="ak-text-sm ak-text-gray-600">原始交易</div>
              </div>
              <div className="ak-text-center">
                <div className="ak-text-2xl ak-font-bold ak-text-green-600">
                  {settlementResult.simplifiedCount}
                </div>
                <div className="ak-text-sm ak-text-gray-600">简化后</div>
              </div>
            </div>

            <div className="ak-space-y-4">
              <div className="ak-flex ak-items-center ak-justify-between">
                <span className="ak-text-gray-600">简化率</span>
                <span className="ak-font-bold ak-text-purple-600">
                  {settlementResult.reductionRate}%
                </span>
              </div>
              <div className="ak-w-full ak-bg-gray-200 ak-rounded-full ak-h-2">
                <div 
                  className="ak-bg-purple-600 ak-h-2 ak-rounded-full ak-transition-all ak-duration-300"
                  style={{ width: `${settlementResult.reductionRate}%` }}
                />
              </div>
            </div>

            <div className="ak-mt-6">
              <Button 
                onClick={handleSettle}
                disabled={processing}
                className="ak-w-full ak-bg-green-600 hover:ak-bg-green-700"
              >
                {processing ? '结算中...' : '执行结算'}
              </Button>
            </div>
          </Card>

          {/* 债务关系 */}
          <Card className="ak-p-6">
            <h3 className="ak-text-lg ak-font-semibold ak-mb-4">债务关系</h3>
            
            <div className="ak-space-y-4">
              {/* 用户余额 */}
              <div>
                <h4 className="ak-font-medium ak-text-gray-900 ak-mb-3">用户余额</h4>
                <div className="ak-space-y-2">
                  {settlementResult.nodes.map((node) => (
                    <div key={node.userId} className="ak-flex ak-items-center ak-justify-between">
                      <span className="ak-text-sm">{node.userName}</span>
                      <span className={`ak-font-medium ${
                        node.balance > 0 ? 'ak-text-green-600' : 'ak-text-red-600'
                      }`}>
                        {node.balance > 0 ? '+' : ''}{node.balance.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 简化后的交易 */}
              {settlementResult.edges.length > 0 && (
                <div>
                  <h4 className="ak-font-medium ak-text-gray-900 ak-mb-3">结算方案</h4>
                  <div className="ak-space-y-2">
                    {settlementResult.edges.map((edge, index) => {
                      const fromUser = settlementResult.nodes.find(n => n.userId === edge.from);
                      const toUser = settlementResult.nodes.find(n => n.userId === edge.to);
                      return (
                        <div key={index} className="ak-flex ak-items-center ak-justify-between ak-p-2 ak-bg-gray-50 ak-rounded">
                          <span className="ak-text-sm">
                            {fromUser?.userName} → {toUser?.userName}
                          </span>
                          <span className="ak-font-medium ak-text-blue-600">
                            {edge.amount.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 结算历史 */}
      <Card className="ak-p-6">
        <h3 className="ak-text-lg ak-font-semibold ak-mb-4">结算历史</h3>
        
        {settlementHistory.length > 0 ? (
          <div className="ak-space-y-4">
            {settlementHistory.map((record) => (
              <div key={record.id} className="ak-flex ak-items-center ak-justify-between ak-p-4 ak-border ak-rounded-lg">
                <div className="ak-flex-1">
                  <div className="ak-font-medium ak-text-gray-900 ak-mb-1">
                    {record.groupName}
                  </div>
                  <div className="ak-text-sm ak-text-gray-600">
                    {record.description} · {formatDate(record.createdAt)}
                  </div>
                  <div className="ak-flex ak-items-center ak-space-x-4 ak-mt-2 ak-text-sm">
                    <span className="ak-text-gray-600">
                      原始: {record.summary.totalTransactions} 笔
                    </span>
                    <span className="ak-text-green-600">
                      简化: {record.summary.simplifiedCount} 笔
                    </span>
                    <span className="ak-text-purple-600">
                      简化率: {record.summary.reductionRate}%
                    </span>
                  </div>
                </div>
                <div className="ak-text-right">
                  <div className="ak-text-sm ak-font-medium ak-text-green-600">
                    已完成
                  </div>
                  <div className="ak-text-xs ak-text-gray-500">
                    {record.initiatorName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ak-text-center ak-py-8 ak-text-gray-500">
            <div className="ak-text-6xl ak-mb-4">📊</div>
            <p className="ak-text-lg ak-font-medium ak-text-gray-900 ak-mb-2">
              暂无结算记录
            </p>
            <p className="ak-text-gray-600">
              选择群组进行统一结算后将显示历史记录
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}