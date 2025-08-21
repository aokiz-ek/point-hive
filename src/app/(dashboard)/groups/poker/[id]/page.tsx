'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal, FormItem, Select, InputNumber, TextArea } from '@/components/ui/modal';
import { useAuth, useTransactions } from '@/lib/hooks';
import { LocalStorage, generateId } from '@/lib/utils/local-storage';
import type { Group, Transaction } from '@/lib/types';

interface PokerPlayer {
  id: string;
  name: string;
  currentChips: number;
  isCreator: boolean;
  totalBought: number;   // 从系统买入的筹码
  totalWon: number;      // 通过转移获得的筹码
  totalLost: number;     // 通过转移失去的筹码
  netResult: number;     // 当前筹码 - 初始买入筹码
}

export default function PokerGroupPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [players, setPlayers] = useState<PokerPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [gameStatus, setGameStatus] = useState<'active' | 'paused' | 'finished'>('active');
  
  // 筹码转移相关状态
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFrom, setTransferFrom] = useState<string>('');
  const [transferTo, setTransferTo] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<number>(2000);
  const [transferReason, setTransferReason] = useState<string>('');
  
  // 买入相关状态
  const [showBuyInModal, setShowBuyInModal] = useState(false);
  const [buyInTo, setBuyInTo] = useState<string>('');
  const [buyInFrom, setBuyInFrom] = useState<string>('');
  const [buyInAmount, setBuyInAmount] = useState<number>(2000);
  const [buyInReason, setBuyInReason] = useState<string>('');
  
  // 结算相关状态
  const [showSettlement, setShowSettlement] = useState(false);
  const [settlementData, setSettlementData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ranking' | 'battle' | 'records'>('ranking');

  const { transactions } = useTransactions({ groupId });

  // 加载群组数据
  useEffect(() => {
    const loadGroup = () => {
      const groups = LocalStorage.getGroups();
      const currentGroup = groups.find(g => g.id === groupId);
      
      if (!currentGroup) {
        router.push('/groups');
        return;
      }
      
      setGroup(currentGroup);
      
      // 计算每个玩家的当前筹码
      const pokerSettings = (currentGroup as any).pokerSettings;
      if (pokerSettings?.playerNames) {
        calculatePlayerChips(currentGroup, pokerSettings.playerNames);
      }
    };

    loadGroup();
  }, [groupId, router, transactions]);

  const calculatePlayerChips = (group: Group, playerNames: any[]) => {
    const allTransactions = LocalStorage.getTransactions().filter(t => t.groupId === groupId);
    
    const playersData: PokerPlayer[] = playerNames.map(player => {
      // 计算该玩家的所有交易
      const playerTransactions = allTransactions.filter(t => 
        (t.toUserId === (player.isCreator ? user?.id : player.id)) ||
        (t.fromUserId === (player.isCreator ? user?.id : player.id))
      );
      
      let currentChips = 0;
      let totalBought = 0;  // 只统计从系统的真正买入
      let totalWon = 0;     // 通过转移获得的筹码
      let totalLost = 0;    // 通过转移失去的筹码
      let winIncome = 0;    // 通过"赢得"获得的筹码
      let winExpense = 0;   // 通过"赢得"失去的筹码
      
      playerTransactions.forEach(transaction => {
        const isSystemTransaction = transaction.type === 'system' && transaction.fromUserId === 'system';
        const isReceivedTransaction = transaction.toUserId === (player.isCreator ? user?.id : player.id);
        const isSentTransaction = transaction.fromUserId === (player.isCreator ? user?.id : player.id);
        const transferType = transaction.metadata?.transferType;
        
        if (isSystemTransaction) {
          // 真正的买入：从系统获得的初始筹码
          currentChips += transaction.amount;
          totalBought += transaction.amount;
        } else if (isReceivedTransaction) {
          // 通过转移获得筹码（包括之前标记为buy_in的交易）
          currentChips += transaction.amount;
          totalWon += transaction.amount;
          
          // 只统计"win"类型的收入到净利润
          if (transferType === 'win') {
            winIncome += transaction.amount;
          }
        } else if (isSentTransaction) {
          // 通过转移失去筹码
          currentChips -= transaction.amount;
          totalLost += transaction.amount;
          
          // 只统计"win"类型的支出到净利润
          if (transferType === 'win') {
            winExpense += transaction.amount;
          }
        }
      });
      
      return {
        id: player.id,
        name: player.name,
        currentChips,
        isCreator: player.isCreator || false,
        totalBought,
        totalWon,
        totalLost,
        netResult: winIncome - winExpense // 净利润 = 赢得的筹码 - 输掉的筹码（只计算win类型）
      };
    });
    
    // 筹码守恒验证
    const totalCurrentChips = playersData.reduce((sum, p) => sum + p.currentChips, 0);
    const totalSystemBought = playersData.reduce((sum, p) => sum + p.totalBought, 0);
    
    // 在开发环境中验证筹码守恒
    if (process.env.NODE_ENV === 'development') {
      if (totalCurrentChips !== totalSystemBought) {
        console.warn('筹码不守恒警告:', {
          totalCurrentChips,
          totalSystemBought,
          difference: totalCurrentChips - totalSystemBought
        });
      }
    }
    
    setPlayers(playersData);
  };

  // 测试工具函数
  const runTestScenario = (scenario: string) => {
    if (!user || !groupId) return;
    
    const wadePlayer = players.find(p => p.name.toLowerCase().includes('wade') || p.isCreator);
    const tomasPlayer = players.find(p => p.name.toLowerCase().includes('tomas'));
    
    if (!wadePlayer || !tomasPlayer) {
      alert('找不到Wade或Tomas玩家，无法运行测试场景');
      return;
    }

    const wadeId = wadePlayer.isCreator ? user.id : wadePlayer.id;
    const tomasId = tomasPlayer.isCreator ? user.id : tomasPlayer.id;
    
    switch (scenario) {
      case 'win_lose':
        // Wade赢得Tomas 2000筹码
        createTestTransaction(tomasId, wadeId, 2000, '测试：Wade赢得筹码', 'win');
        setTimeout(() => {
          // Wade借出1000筹码给Tomas
          createTestTransaction(wadeId, tomasId, 1000, '测试：Wade借出筹码', 'loan');
        }, 500);
        break;
        
      case 'multi_transfer':
        // 创建循环借贷场景
        if (players.length >= 3) {
          const player3 = players[2];
          const player3Id = player3.isCreator ? user.id : player3.id;
          
          createTestTransaction(wadeId, tomasId, 500, '测试：Wade→Tomas', 'loan');
          setTimeout(() => {
            createTestTransaction(tomasId, player3Id, 300, '测试：Tomas→第三人', 'loan');
          }, 300);
          setTimeout(() => {
            createTestTransaction(player3Id, wadeId, 800, '测试：第三人→Wade', 'win');
          }, 600);
        }
        break;
        
      case 'big_game':
        // 创建大量随机交易
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            const randomFrom = players[Math.floor(Math.random() * players.length)];
            const randomTo = players[Math.floor(Math.random() * players.length)];
            if (randomFrom.id !== randomTo.id) {
              const fromId = randomFrom.isCreator ? user.id : randomFrom.id;
              const toId = randomTo.isCreator ? user.id : randomTo.id;
              const amount = Math.floor(Math.random() * 1000) + 100;
              const type = Math.random() > 0.5 ? 'win' : 'loan';
              createTestTransaction(fromId, toId, amount, `测试交易${i+1}`, type);
            }
          }, i * 200);
        }
        break;
    }
  };

  const createTestTransaction = (fromUserId: string, toUserId: string, amount: number, description: string, transferType: 'win' | 'loan') => {
    const transaction = {
      id: generateId(),
      type: 'transfer' as const,
      fromUserId,
      toUserId,
      amount,
      status: 'completed' as const,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      groupId,
      metadata: {
        tags: ['chip_transfer', 'test_data'],
        priority: 'normal' as const,
        transferType
      }
    };
    
    LocalStorage.addTransaction(transaction);
    
    // 重新计算玩家筹码
    if (group) {
      const pokerSettings = (group as any).pokerSettings;
      if (pokerSettings?.playerNames) {
        calculatePlayerChips(group, pokerSettings.playerNames);
      }
    }
  };

  const validateChipConservation = () => {
    const totalCurrent = players.reduce((sum, p) => sum + p.currentChips, 0);
    const totalBought = players.reduce((sum, p) => sum + p.totalBought, 0);
    const allTransactions = LocalStorage.getTransactions().filter(t => t.groupId === groupId);
    
    const result = {
      isValid: totalCurrent === totalBought,
      totalCurrent,
      totalBought,
      difference: totalCurrent - totalBought,
      transactionCount: allTransactions.length,
      systemTransactions: allTransactions.filter(t => t.type === 'system').length,
      transferTransactions: allTransactions.filter(t => t.type === 'transfer').length
    };
    
    alert(`筹码守恒验证结果:\n${JSON.stringify(result, null, 2)}`);
  };

  const showDetailedStats = () => {
    const stats = players.map(player => ({
      name: player.name,
      currentChips: player.currentChips,
      totalBought: player.totalBought,
      totalWon: player.totalWon,
      totalLost: player.totalLost,
      netResult: player.netResult
    }));
    
    console.table(stats);
    alert('详细统计已输出到控制台，请按F12查看');
  };

  const exportTestData = () => {
    const allTransactions = LocalStorage.getTransactions().filter(t => t.groupId === groupId);
    const exportData = {
      players,
      transactions: allTransactions,
      summary: {
        totalPlayers: players.length,
        totalChips: players.reduce((sum, p) => sum + p.currentChips, 0),
        totalBought: players.reduce((sum, p) => sum + p.totalBought, 0),
        totalTransactions: allTransactions.length
      }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `poker_test_data_${new Date().toISOString().slice(0, 16)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetAllTransactions = () => {
    if (confirm('确定要重置所有交易记录吗？此操作不可撤销。')) {
      const allTransactions = LocalStorage.getTransactions();
      const otherTransactions = allTransactions.filter(t => t.groupId !== groupId);
      localStorage.setItem('pointHive_transactions', JSON.stringify(otherTransactions));
      
      // 重新计算玩家筹码
      if (group) {
        const pokerSettings = (group as any).pokerSettings;
        if (pokerSettings?.playerNames) {
          calculatePlayerChips(group, pokerSettings.playerNames);
        }
      }
      
      alert('所有交易记录已重置');
    }
  };

  const resetToInitialState = () => {
    if (confirm('确定要恢复到游戏初始状态吗？这将删除所有转移记录，只保留初始筹码。')) {
      const allTransactions = LocalStorage.getTransactions();
      const otherTransactions = allTransactions.filter(t => t.groupId !== groupId);
      const initialTransactions = allTransactions.filter(t => 
        t.groupId === groupId && t.type === 'system' && t.fromUserId === 'system'
      );
      
      localStorage.setItem('pointHive_transactions', JSON.stringify([...otherTransactions, ...initialTransactions]));
      
      // 重新计算玩家筹码
      if (group) {
        const pokerSettings = (group as any).pokerSettings;
        if (pokerSettings?.playerNames) {
          calculatePlayerChips(group, pokerSettings.playerNames);
        }
      }
      
      alert('游戏已恢复到初始状态');
    }
  };

  // 快速筹码转移
  const handleQuickTransfer = (fromPlayer: string, toPlayer: string, amount: number, reason: string = '') => {
    if (!user || amount <= 0) return;
    
    setLoading(true);
    
    try {
      const fromPlayerData = players.find(p => p.id === fromPlayer);
      const toPlayerData = players.find(p => p.id === toPlayer);
      
      if (!fromPlayerData || !toPlayerData) {
        throw new Error('玩家不存在');
      }
      
      if (fromPlayerData.currentChips < amount) {
        throw new Error('筹码不足');
      }
      
      const transaction: Transaction = {
        id: generateId(),
        type: 'transfer',
        fromUserId: fromPlayerData.isCreator ? user.id : fromPlayer,
        toUserId: toPlayerData.isCreator ? user.id : toPlayer,
        amount,
        status: 'completed',
        description: reason || `筹码借出: ${fromPlayerData.name} 借给 ${toPlayerData.name}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        groupId,
        metadata: {
          tags: ['poker', 'chip_transfer', 'loan'],
          priority: 'normal',
          transferType: 'loan' // 标识为借出
        }
      };
      
      LocalStorage.addTransaction(transaction);
      
      // 重新计算玩家筹码
      if (group) {
        const pokerSettings = (group as any).pokerSettings;
        if (pokerSettings?.playerNames) {
          calculatePlayerChips(group, pokerSettings.playerNames);
        }
      }
      
      // 关闭转移模态框
      setShowTransferModal(false);
      resetTransferForm();
      
    } catch (error) {
      console.error('筹码转移失败:', error);
      alert('筹码转移失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetTransferForm = () => {
    setTransferFrom('');
    setTransferTo('');
    setTransferAmount(2000);
    setTransferReason('');
  };

  // 买入更多筹码 (从其他玩家买入)
  const handleBuyIn = (toPlayerId: string, fromPlayerId: string, amount: number, reason: string = '') => {
    if (!user || amount <= 0) return;
    
    setLoading(true);
    
    try {
      const toPlayer = players.find(p => p.id === toPlayerId);
      const fromPlayer = players.find(p => p.id === fromPlayerId);
      
      if (!toPlayer || !fromPlayer) {
        throw new Error('玩家不存在');
      }
      
      if (fromPlayer.currentChips < amount) {
        throw new Error('卖出玩家筹码不足');
      }
      
      const transaction: Transaction = {
        id: generateId(),
        type: 'transfer',
        fromUserId: fromPlayer.isCreator ? user.id : fromPlayerId,
        toUserId: toPlayer.isCreator ? user.id : toPlayerId,
        amount,
        status: 'completed',
        description: reason || `筹码赢得: ${toPlayer.name} 从 ${fromPlayer.name} 赢得筹码`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        groupId,
        metadata: {
          tags: ['poker', 'buy_in', 'win'],
          priority: 'normal',
          transferType: 'win' // 标识为赢得
        }
      };
      
      LocalStorage.addTransaction(transaction);
      
      // 重新计算玩家筹码
      if (group) {
        const pokerSettings = (group as any).pokerSettings;
        if (pokerSettings?.playerNames) {
          calculatePlayerChips(group, pokerSettings.playerNames);
        }
      }
      
      // 关闭买入模态框
      setShowBuyInModal(false);
      resetBuyInForm();
      
    } catch (error) {
      console.error('筹码转移失败:', error);
      alert('筹码转移失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetBuyInForm = () => {
    setBuyInTo('');
    setBuyInFrom('');
    setBuyInAmount(2000);
    setBuyInReason('');
  };

  // 计算玩家对战统计（只统计赢得交易，忽略借出交易）
  const calculatePlayerVsPlayerStats = () => {
    const allTransactions = LocalStorage.getTransactions().filter(t => t.groupId === groupId);
    const winTransactions = allTransactions.filter(t => 
      t.type === 'transfer' && 
      t.fromUserId !== 'system' && 
      t.toUserId !== 'system' &&
      t.metadata?.transferType === 'win' // 只统计赢得类型的交易
    );
    
    // 创建玩家对战矩阵
    const playerVsPlayer: Record<string, Record<string, number>> = {};
    
    // 初始化矩阵
    players.forEach(fromPlayer => {
      const fromId = fromPlayer.isCreator ? user?.id : fromPlayer.id;
      if (!fromId) return;
      
      playerVsPlayer[fromId] = {};
      players.forEach(toPlayer => {
        const toId = toPlayer.isCreator ? user?.id : toPlayer.id;
        if (toId && fromId !== toId) {
          playerVsPlayer[fromId][toId] = 0;
        }
      });
    });
    
    // 统计赢得记录（只统计赢得类型的交易）
    winTransactions.forEach(transaction => {
      const fromId = transaction.fromUserId;
      const toId = transaction.toUserId;
      
      if (playerVsPlayer[fromId] && playerVsPlayer[fromId][toId] !== undefined) {
        playerVsPlayer[fromId][toId] += transaction.amount;
      }
    });
    
    // 计算净胜负
    const playerStats = players.map(player => {
      const playerId = player.isCreator ? user?.id : player.id;
      if (!playerId) return null;
      
      let totalWonFromOthers = 0;
      let totalLostToOthers = 0;
      const opponents: Array<{name: string, netAmount: number}> = [];
      
      players.forEach(opponent => {
        const opponentId = opponent.isCreator ? user?.id : opponent.id;
        if (!opponentId || playerId === opponentId) return;
        
        const wonFromOpponent = playerVsPlayer[opponentId]?.[playerId] || 0;
        const lostToOpponent = playerVsPlayer[playerId]?.[opponentId] || 0;
        const netAmount = wonFromOpponent - lostToOpponent;
        
        totalWonFromOthers += wonFromOpponent;
        totalLostToOthers += lostToOpponent;
        
        if (netAmount !== 0) {
          opponents.push({
            name: opponent.name,
            netAmount
          });
        }
      });
      
      return {
        ...player,
        totalWonFromOthers,
        totalLostToOthers,
        netTransferResult: totalWonFromOthers - totalLostToOthers,
        netResult: player.netResult, // 添加最终净利润
        opponents: opponents.sort((a, b) => b.netAmount - a.netAmount)
      };
    }).filter(Boolean);
    
    // 按最终净利润排序，而不是按转移净收益排序
    return playerStats.sort((a, b) => b.netResult - a.netResult);
  };

  // 计算结算数据
  const calculateSettlement = () => {
    const pokerSettings = group ? (group as any).pokerSettings : null;
    if (!pokerSettings) return;
    
    const initialChips = pokerSettings.initialChips;
    const settlement = players.map(player => ({
      ...player,
      netResult: player.netResult, // 使用已经正确计算的净利润（只包含win类型交易）
      finalAmount: player.currentChips
    }));
    
    const totalChips = settlement.reduce((sum, p) => sum + p.currentChips, 0);
    const totalBought = settlement.reduce((sum, p) => sum + p.totalBought, 0);
    const playerVsPlayerStats = calculatePlayerVsPlayerStats();
    
    setSettlementData({
      players: settlement,
      totalChips,
      totalBought,
      gameStartTime: pokerSettings.sessionStartTime,
      gameEndTime: new Date().toISOString(),
      playerVsPlayerStats
    });
    
    setShowSettlement(true);
  };

  const finishGame = () => {
    setGameStatus('finished');
    calculateSettlement();
    
    // 更新群组状态
    if (group) {
      const updatedGroup = {
        ...group,
        status: 'archived' as const,
        updatedAt: new Date().toISOString()
      };
      
      const groups = LocalStorage.getGroups();
      const updatedGroups = groups.map(g => g.id === groupId ? updatedGroup : g);
      LocalStorage.setGroups(updatedGroups);
    }
  };

  if (!group) {
    return (
      <div className="ak-flex ak-justify-center ak-items-center ak-min-h-64">
        <div className="ak-text-gray-500">加载中...</div>
      </div>
    );
  }

  const pokerSettings = (group as any).pokerSettings;
  const totalChips = players.reduce((sum, p) => sum + p.currentChips, 0);
  const totalBought = players.reduce((sum, p) => sum + p.totalBought, 0);
  const totalWon = players.reduce((sum, p) => sum + p.totalWon, 0);
  const totalLost = players.reduce((sum, p) => sum + p.totalLost, 0);
  const isChipsConserved = totalChips === totalBought;

  return (
    <div className="ak-space-y-6 ak-max-w-6xl ak-mx-auto">
      {/* 游戏头部信息 */}
      <Card className="ak-p-6 ak-bg-gradient-to-r ak-from-blue-50 ak-to-purple-50">
        <div className="ak-flex ak-justify-between ak-items-start ak-mb-4">
          <div>
            <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">{group.name}</h1>
            <p className="ak-text-gray-600">{group.description}</p>
            <div className="ak-flex ak-items-center ak-space-x-4 ak-mt-2 ak-text-sm ak-text-gray-500">
              <span>🎲 {pokerSettings?.gameType === 'cash' ? '现金桌' : '锦标赛'}</span>
              <span>🃏 盲注: {pokerSettings?.smallBlind}/{pokerSettings?.bigBlind}</span>
              <span>👥 {players.length} 玩家</span>
              <span className={`ak-px-2 ak-py-1 ak-rounded ak-text-xs ak-font-medium ${
                gameStatus === 'active' ? 'ak-bg-green-100 ak-text-green-800' :
                gameStatus === 'paused' ? 'ak-bg-yellow-100 ak-text-yellow-800' :
                'ak-bg-gray-100 ak-text-gray-800'
              }`}>
                {gameStatus === 'active' ? '游戏中' : gameStatus === 'paused' ? '暂停' : '已结束'}
              </span>
            </div>
          </div>
          
          <div className="ak-grid ak-grid-cols-2 ak-gap-4 ak-text-center">
            <div>
              <div className="ak-text-sm ak-text-gray-600 ak-mb-1">总筹码池</div>
              <div className={`ak-text-xl ak-font-bold ${isChipsConserved ? 'ak-text-blue-600' : 'ak-text-red-600'}`}>
                {totalChips.toLocaleString()}
              </div>
              <div className="ak-text-xs ak-text-gray-500">
                初始: {totalBought.toLocaleString()}
              </div>
            </div>
            
            <div>
              <div className="ak-text-sm ak-text-gray-600 ak-mb-1">筹码流动</div>
              <div className="ak-text-xs ak-text-gray-500 ak-space-y-1">
                <div>转移: {totalWon.toLocaleString()}</div>
                <div>守恒: {isChipsConserved ? '✅' : '❌'}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="ak-flex ak-space-x-3">
          <Button
            onClick={() => setShowTransferModal(true)}
            disabled={gameStatus === 'finished'}
            size="sm"
          >
            💸 转移筹码
          </Button>
          <Button
            variant="outline"
            onClick={calculateSettlement}
            size="sm"
          >
            📊 查看结算
          </Button>
          <Button
            variant="outline"
            onClick={() => setGameStatus(gameStatus === 'active' ? 'paused' : 'active')}
            disabled={gameStatus === 'finished'}
            size="sm"
          >
            {gameStatus === 'active' ? '⏸️ 暂停' : '▶️ 继续'}
          </Button>
          <Button
            variant="destructive"
            onClick={finishGame}
            disabled={gameStatus === 'finished'}
            size="sm"
          >
            🏁 结束游戏
          </Button>
        </div>
      </Card>

      {/* 玩家筹码显示 */}
      <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 lg:ak-grid-cols-3 ak-gap-4">
        {players.map((player, index) => (
          <Card key={player.id} className={`ak-p-4 ak-relative ${
            index === 0 ? 'ak-border-yellow-300 ak-bg-yellow-50' : ''
          }`}>
            {index === 0 && (
              <div className="ak-absolute ak-top-2 ak-right-2">
                👑
              </div>
            )}
            
            <div className="ak-flex ak-items-center ak-justify-between ak-mb-3">
              <div className="ak-flex ak-items-center ak-space-x-2">
                <span className="ak-text-lg">
                  {player.isCreator ? '👑' : '🎭'}
                </span>
                <h3 className="ak-font-semibold ak-text-gray-900">
                  {player.name}
                  {player.isCreator && <span className="ak-text-xs ak-text-blue-500 ak-ml-1">(你)</span>}
                </h3>
              </div>
              <div className="ak-text-xs ak-px-2 ak-py-1 ak-rounded ak-bg-blue-100 ak-text-blue-800">
                在场
              </div>
            </div>
            
            <div className="ak-space-y-2">
              <div className="ak-flex ak-justify-between">
                <span className="ak-text-sm ak-text-gray-600">当前筹码</span>
                <span className={`ak-font-bold ${
                  player.currentChips > pokerSettings?.initialChips ? 'ak-text-green-600' :
                  player.currentChips < pokerSettings?.initialChips ? 'ak-text-red-600' :
                  'ak-text-gray-900'
                }`}>
                  {player.currentChips.toLocaleString()}
                </span>
              </div>
              
              <div className="ak-flex ak-justify-between">
                <span className="ak-text-sm ak-text-gray-600">初始筹码</span>
                <span className="ak-text-sm ak-text-gray-800">
                  {player.totalBought.toLocaleString()}
                </span>
              </div>
              
              <div className="ak-flex ak-justify-between">
                <span className="ak-text-sm ak-text-gray-600">损益</span>
                <span className={`ak-text-sm ak-font-medium ${
                  player.netResult > 0 ? 'ak-text-green-600' :
                  player.netResult < 0 ? 'ak-text-red-600' :
                  'ak-text-gray-600'
                }`}>
                  {player.netResult > 0 ? '+' : ''}{player.netResult.toLocaleString()}
                </span>
              </div>
              
              <div className="ak-w-full ak-bg-gray-200 ak-rounded-full ak-h-2 ak-mt-2">
                <div
                  className={`ak-h-2 ak-rounded-full ${
                    player.currentChips > pokerSettings?.initialChips ? 'ak-bg-green-500' :
                    player.currentChips < pokerSettings?.initialChips / 2 ? 'ak-bg-red-500' :
                    'ak-bg-yellow-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(5, (player.currentChips / (pokerSettings?.initialChips * 2)) * 100))}%`
                  }}
                />
              </div>
            </div>
            
            {gameStatus === 'active' && (
              <div className="ak-flex ak-space-x-2 ak-mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBuyInTo(player.id);
                    setShowBuyInModal(true);
                  }}
                  className="ak-flex-1 ak-text-xs ak-bg-green-50 ak-text-green-700 ak-border-green-200 hover:ak-bg-green-100"
                >
                  💰 赢得
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTransferFrom(player.id);
                    setShowTransferModal(true);
                  }}
                  className="ak-flex-1 ak-text-xs ak-bg-orange-50 ak-text-orange-700 ak-border-orange-200 hover:ak-bg-orange-100"
                >
                  📤 借出
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* 游戏规则说明 */}
      <Card className="ak-p-4 ak-bg-gradient-to-r ak-from-blue-50 ak-to-indigo-50 ak-border-blue-200">
        <h3 className="ak-text-sm ak-font-semibold ak-text-blue-800 ak-mb-2 ak-flex ak-items-center ak-gap-2">
          📋 筹码操作规则
        </h3>
        <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 ak-gap-4 ak-text-xs ak-text-blue-700">
          <div className="ak-flex ak-items-center ak-space-x-2">
            <span className="ak-bg-green-100 ak-text-green-700 ak-px-2 ak-py-1 ak-rounded">💰 获取</span>
            <span>= 赢得筹码（计入净利润）</span>
          </div>
          <div className="ak-flex ak-items-center ak-space-x-2">
            <span className="ak-bg-orange-100 ak-text-orange-700 ak-px-2 ak-py-1 ak-rounded">📤 转出</span>
            <span>= 借出筹码（不影响净利润）</span>
          </div>
          <div className="ak-col-span-1 md:ak-col-span-2 ak-text-blue-600 ak-bg-blue-100 ak-px-3 ak-py-2 ak-rounded ak-text-center">
            <strong>示例：</strong> Wade赢得Tomas 2000 → Wade净利润+2000；Wade借出给Tomas 2000 → Wade净利润仍为+2000（借出不算输掉）
          </div>
        </div>
      </Card>

      {/* 对战统计排名 */}
      <Card className="ak-p-6">
        <h3 className="ak-text-lg ak-font-semibold ak-mb-4 ak-flex ak-items-center ak-gap-2">
          ⚔️ 净利润排名
        </h3>
        <div className="ak-space-y-3">
          {(() => {
            const playerStats = calculatePlayerVsPlayerStats();
            return playerStats.slice(0, 5).map((playerStat: any, index: number) => (
              <div 
                key={playerStat.id}
                className={`ak-flex ak-justify-between ak-items-center ak-p-3 ak-rounded-lg ak-border ak-transition-all ak-duration-200 ${
                  index === 0 ? 'ak-bg-gradient-to-r ak-from-green-50 ak-to-emerald-50 ak-border-green-200' :
                  playerStat.netResult > 0 ? 'ak-bg-green-50 ak-border-green-200' :
                  playerStat.netResult < 0 ? 'ak-bg-red-50 ak-border-red-200' :
                  'ak-bg-gray-50 ak-border-gray-200'
                }`}
              >
                <div className="ak-flex ak-items-center ak-space-x-3">
                  <span className={`ak-text-lg ak-font-bold ak-w-8 ak-text-center ${
                    index === 0 ? 'ak-text-green-600' : 'ak-text-gray-600'
                  }`}>
                    {index === 0 ? '👑' : `#${index + 1}`}
                  </span>
                  <div>
                    <div className="ak-font-semibold ak-text-gray-900">{playerStat.name}</div>
                    <div className="ak-text-xs ak-text-gray-500">
                      获得 {playerStat.totalWonFromOthers.toLocaleString()} | 
                      失去 {playerStat.totalLostToOthers.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="ak-text-right">
                  <div className={`ak-font-bold ak-text-lg ${
                    playerStat.netResult > 0 ? 'ak-text-green-600' :
                    playerStat.netResult < 0 ? 'ak-text-red-600' :
                    'ak-text-gray-600'
                  }`}>
                    {playerStat.netResult > 0 ? '+' : ''}{playerStat.netResult.toLocaleString()}
                  </div>
                  <div className="ak-text-xs ak-text-gray-500">净利润</div>
                </div>
              </div>
            ));
          })()}
          
          {players.length > 5 && (
            <div className="ak-text-center ak-py-2">
              <button
                className="ak-text-sm ak-text-blue-600 ak-hover:text-blue-800 ak-transition-colors"
                onClick={calculateSettlement}
              >
                查看完整排名 →
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* 筹码转移模态框 - Ant Design Style */}
      <Modal
        open={showTransferModal}
        onCancel={() => {
          setShowTransferModal(false);
          resetTransferForm();
        }}
        title="📤 借出筹码"
        width={480}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowTransferModal(false);
                resetTransferForm();
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => handleQuickTransfer(transferFrom, transferTo, transferAmount, transferReason)}
              disabled={!transferFrom || !transferTo || transferAmount <= 0 || loading}
              className="ak-bg-blue-600 ak-hover:bg-blue-700 ak-text-white"
            >
              {loading ? '借出中...' : '确认借出'}
            </Button>
          </>
        }
      >
        <FormItem label="借出玩家" required>
          <Select
            value={transferFrom}
            onChange={setTransferFrom}
            placeholder="请选择借出玩家"
            options={players.map(p => ({
              value: p.id,
              label: `${p.name} (筹码: ${p.currentChips.toLocaleString()})`
            }))}
          />
        </FormItem>
        
        <FormItem label="借入玩家" required>
          <Select
            value={transferTo}
            onChange={setTransferTo}
            placeholder="请选择借入玩家"
            options={players
              .filter(p => p.id !== transferFrom)
              .map(p => ({ value: p.id, label: p.name }))}
          />
        </FormItem>
        
        <FormItem label="借出金额" required>
          <InputNumber
            value={transferAmount}
            onChange={setTransferAmount}
            min={1}
            max={transferFrom ? players.find(p => p.id === transferFrom)?.currentChips || 0 : 0}
          />
          {transferFrom && (
            <div className="ak-flex ak-flex-wrap ak-gap-2 ak-mt-3">
              {[1000, 2000, 3000, 5000, 10000, 20000].map(amount => (
                <Button
                  key={amount}
                  size="sm"
                  variant="outline"
                  onClick={() => setTransferAmount(amount)}
                  className="ak-text-xs"
                >
                  {amount.toLocaleString()}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const player = players.find(p => p.id === transferFrom);
                  if (player) setTransferAmount(player.currentChips);
                }}
                className="ak-text-xs"
              >
                全部
              </Button>
            </div>
          )}
        </FormItem>
        
        <FormItem label="备注 (可选)">
          <TextArea
            value={transferReason}
            onChange={setTransferReason}
            placeholder="例如：借给朋友继续游戏"
            rows={2}
          />
        </FormItem>
      </Modal>

      {/* 买入模态框 - Ant Design Style */}
      <Modal
        open={showBuyInModal}
        onCancel={() => {
          setShowBuyInModal(false);
          resetBuyInForm();
        }}
        title="💰 赢得筹码"
        width={480}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowBuyInModal(false);
                resetBuyInForm();
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => handleBuyIn(buyInTo, buyInFrom, buyInAmount, buyInReason)}
              disabled={!buyInTo || !buyInFrom || buyInAmount <= 0 || loading}
              className="ak-bg-green-600 ak-hover:bg-green-700 ak-text-white"
            >
              {loading ? '记录中...' : '确认赢得'}
            </Button>
          </>
        }
      >
        <FormItem label="赢家玩家" required>
          <Select
            value={buyInTo}
            onChange={setBuyInTo}
            placeholder="请选择赢家"
            options={players.map(p => ({ value: p.id, label: p.name }))}
          />
        </FormItem>
        
        <FormItem label="输家玩家" required>
          <Select
            value={buyInFrom}
            onChange={setBuyInFrom}
            placeholder="请选择输家"
            options={players
              .filter(p => p.id !== buyInTo && p.currentChips > 0)
              .map(p => ({
                value: p.id,
                label: `${p.name} (筹码: ${p.currentChips.toLocaleString()})`
              }))}
          />
        </FormItem>
        
        <FormItem label="赢得金额" required>
          <InputNumber
            value={buyInAmount}
            onChange={setBuyInAmount}
            min={1}
            max={buyInFrom ? players.find(p => p.id === buyInFrom)?.currentChips || 0 : 0}
          />
          {buyInFrom && (
            <div className="ak-flex ak-flex-wrap ak-gap-2 ak-mt-3">
              {[1000, 2000, 3000, 5000, 10000, 20000].map(amount => (
                <Button
                  key={amount}
                  size="sm"
                  variant="outline"
                  onClick={() => setBuyInAmount(amount)}
                  className="ak-text-xs"
                >
                  {amount.toLocaleString()}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const player = players.find(p => p.id === buyInFrom);
                  if (player) setBuyInAmount(player.currentChips);
                }}
                className="ak-text-xs"
              >
                全部
              </Button>
            </div>
          )}
        </FormItem>
        
        <FormItem label="备注 (可选)">
          <TextArea
            value={buyInReason}
            onChange={setBuyInReason}
            placeholder="例如：All-in赢得对手筹码"
            rows={2}
          />
        </FormItem>
      </Modal>

      {/* Settlement Modal - Ant Design Style */}
      {showSettlement && settlementData && (
        <div className="ak-fixed ak-inset-0 ak-z-50">
          {/* Modal Mask */}
          <div 
            className="ak-fixed ak-inset-0 ak-bg-black ak-bg-opacity-45 ak-transition-all ak-duration-200"
            onClick={() => setShowSettlement(false)}
          />
          
          {/* Modal Container */}
          <div className="ak-fixed ak-inset-0 ak-flex ak-items-center ak-justify-center ak-p-4">
            <div className="ak-bg-white ak-rounded-lg ak-shadow-2xl ak-max-w-4xl ak-w-full ak-max-h-[90vh] ak-overflow-hidden ak-animate-fade-in">
              
              {/* Modal Header */}
              <div className="ak-flex ak-items-center ak-justify-between ak-px-6 ak-py-4 ak-border-b ak-border-gray-200">
                <h3 className="ak-text-lg ak-font-semibold ak-text-gray-900 ak-flex ak-items-center ak-gap-2">
                  📊 游戏结算
                </h3>
                <button
                  className="ak-text-gray-400 ak-hover:text-gray-600 ak-transition-colors ak-duration-200"
                  onClick={() => setShowSettlement(false)}
                >
                  <svg className="ak-w-6 ak-h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="ak-max-h-[calc(90vh-120px)] ak-overflow-hidden ak-flex ak-flex-col">
                
                {/* Statistics Grid */}
                <div className="ak-px-6 ak-py-4 ak-border-b ak-border-gray-200 ak-bg-gray-50">
                  <div className="ak-grid ak-grid-cols-3 ak-gap-4">
                    <div className="ak-bg-blue-50 ak-p-4 ak-rounded-lg ak-text-center ak-border ak-border-blue-100">
                      <div className="ak-text-sm ak-text-blue-600 ak-font-medium ak-mb-1">总筹码</div>
                      <div className="ak-text-2xl ak-font-bold ak-text-blue-900">
                        {settlementData.totalChips.toLocaleString()}
                      </div>
                    </div>
                    <div className="ak-bg-green-50 ak-p-4 ak-rounded-lg ak-text-center ak-border ak-border-green-100">
                      <div className="ak-text-sm ak-text-green-600 ak-font-medium ak-mb-1">初始筹码</div>
                      <div className="ak-text-2xl ak-font-bold ak-text-green-900">
                        {settlementData.totalBought.toLocaleString()}
                      </div>
                    </div>
                    <div className="ak-bg-purple-50 ak-p-4 ak-rounded-lg ak-text-center ak-border ak-border-purple-100">
                      <div className="ak-text-sm ak-text-purple-600 ak-font-medium ak-mb-1">游戏时长</div>
                      <div className="ak-text-2xl ak-font-bold ak-text-purple-900">
                        {Math.round((new Date(settlementData.gameEndTime).getTime() - new Date(settlementData.gameStartTime).getTime()) / (1000 * 60))}分钟
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tabs Header */}
                <div className="ak-px-6 ak-border-b ak-border-gray-200 ak-bg-white">
                  <div className="ak-flex ak-space-x-0">
                    <button
                      onClick={() => setActiveTab('ranking')}
                      className={`ak-px-4 ak-py-3 ak-text-sm ak-font-medium ak-border-b-2 ak-transition-colors ak-duration-200 ak-flex ak-items-center ak-space-x-2 ${
                        activeTab === 'ranking'
                          ? 'ak-border-blue-500 ak-text-blue-600 ak-bg-blue-50'
                          : 'ak-border-transparent ak-text-gray-500 ak-hover:text-gray-700 ak-hover:bg-gray-50'
                      }`}
                    >
                      <span>🏆</span>
                      <span>玩家排名</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('battle')}
                      className={`ak-px-4 ak-py-3 ak-text-sm ak-font-medium ak-border-b-2 ak-transition-colors ak-duration-200 ak-flex ak-items-center ak-space-x-2 ${
                        activeTab === 'battle'
                          ? 'ak-border-blue-500 ak-text-blue-600 ak-bg-blue-50'
                          : 'ak-border-transparent ak-text-gray-500 ak-hover:text-gray-700 ak-hover:bg-gray-50'
                      }`}
                    >
                      <span>⚔️</span>
                      <span>对战统计</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('records')}
                      className={`ak-px-4 ak-py-3 ak-text-sm ak-font-medium ak-border-b-2 ak-transition-colors ak-duration-200 ak-flex ak-items-center ak-space-x-2 ${
                        activeTab === 'records'
                          ? 'ak-border-blue-500 ak-text-blue-600 ak-bg-blue-50'
                          : 'ak-border-transparent ak-text-gray-500 ak-hover:text-gray-700 ak-hover:bg-gray-50'
                      }`}
                    >
                      <span>📋</span>
                      <span>筹码记录</span>
                    </button>
                  </div>
                </div>
                
                {/* Tab Content */}
                <div className="ak-flex-1 ak-overflow-y-auto ak-px-6 ak-py-4">
                  <div className="ak-space-y-6">
                  
                  {/* Player Results Tab */}
                  {activeTab === 'ranking' && (
                  <div>
                    <div className="ak-space-y-3">
                      {settlementData.players
                        .sort((a: any, b: any) => b.netResult - a.netResult)
                        .map((player: any, index: number) => (
                        <div 
                          key={player.id} 
                          className={`ak-flex ak-justify-between ak-items-center ak-p-4 ak-rounded-lg ak-border ak-transition-all ak-duration-200 ak-hover:shadow-sm ${
                            index === 0 ? 'ak-bg-gradient-to-r ak-from-yellow-50 ak-to-orange-50 ak-border-yellow-200 ak-shadow-sm' :
                            player.netResult > 0 ? 'ak-bg-green-50 ak-border-green-200' :
                            player.netResult < 0 ? 'ak-bg-red-50 ak-border-red-200' :
                            'ak-bg-gray-50 ak-border-gray-200'
                          }`}
                        >
                          <div className="ak-flex ak-items-center ak-space-x-3">
                            <span className="ak-text-xl">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                            </span>
                            <div>
                              <div className="ak-font-semibold ak-text-gray-900">{player.name}</div>
                              <div className="ak-text-sm ak-text-gray-500">
                                最终筹码: {player.currentChips.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="ak-text-right">
                            <div className={`ak-text-xl ak-font-bold ${
                              player.netResult > 0 ? 'ak-text-green-600' :
                              player.netResult < 0 ? 'ak-text-red-600' :
                              'ak-text-gray-600'
                            }`}>
                              {player.netResult > 0 ? '+' : ''}{player.netResult.toLocaleString()}
                            </div>
                            <div className="ak-text-sm ak-text-gray-500">
                              初始: {player.totalBought.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}
                  
                  {/* Player vs Player Stats Tab */}
                  {activeTab === 'battle' && settlementData.playerVsPlayerStats && (
                    <div>
                      <h4 className="ak-text-lg ak-font-semibold ak-text-gray-900 ak-mb-4 ak-flex ak-items-center ak-gap-2">
                        ⚔️ 对战统计排名
                      </h4>
                      <div className="ak-space-y-3">
                        {settlementData.playerVsPlayerStats.map((playerStat: any, index: number) => (
                          <div 
                            key={playerStat.id} 
                            className={`ak-p-4 ak-rounded-lg ak-border ak-transition-all ak-duration-200 ${
                              index === 0 ? 'ak-bg-gradient-to-r ak-from-green-50 ak-to-emerald-50 ak-border-green-200 ak-shadow-sm' :
                              playerStat.netTransferResult > 0 ? 'ak-bg-green-50 ak-border-green-200' :
                              playerStat.netTransferResult < 0 ? 'ak-bg-red-50 ak-border-red-200' :
                              'ak-bg-gray-50 ak-border-gray-200'
                            }`}
                          >
                            <div className="ak-flex ak-justify-between ak-items-start ak-mb-3">
                              <div className="ak-flex ak-items-center ak-space-x-3">
                                <span className="ak-text-lg ak-font-bold ak-text-gray-600">
                                  #{index + 1}
                                </span>
                                <div>
                                  <div className="ak-font-semibold ak-text-gray-900 ak-flex ak-items-center ak-space-x-2">
                                    <span>{playerStat.name}</span>
                                    {index === 0 && <span className="ak-text-green-600">👑</span>}
                                  </div>
                                  <div className="ak-text-sm ak-text-gray-600">
                                    转移净收益: 
                                    <span className={`ak-font-semibold ak-ml-1 ${
                                      playerStat.netTransferResult > 0 ? 'ak-text-green-600' :
                                      playerStat.netTransferResult < 0 ? 'ak-text-red-600' :
                                      'ak-text-gray-600'
                                    }`}>
                                      {playerStat.netTransferResult > 0 ? '+' : ''}{playerStat.netTransferResult.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="ak-text-right ak-text-sm ak-text-gray-600">
                                <div>获得: {playerStat.totalWonFromOthers.toLocaleString()}</div>
                                <div>失去: {playerStat.totalLostToOthers.toLocaleString()}</div>
                              </div>
                            </div>
                            
                            {/* 对战详情 */}
                            {playerStat.opponents && playerStat.opponents.length > 0 && (
                              <div className="ak-border-t ak-border-gray-200 ak-pt-3">
                                <div className="ak-text-xs ak-text-gray-500 ak-mb-2">对战详情:</div>
                                <div className="ak-flex ak-flex-wrap ak-gap-2">
                                  {playerStat.opponents.map((opponent: any, oppIndex: number) => (
                                    <div 
                                      key={oppIndex}
                                      className={`ak-px-2 ak-py-1 ak-rounded ak-text-xs ak-flex ak-items-center ak-space-x-1 ${
                                        opponent.netAmount > 0 ? 'ak-bg-green-100 ak-text-green-700' :
                                        opponent.netAmount < 0 ? 'ak-bg-red-100 ak-text-red-700' :
                                        'ak-bg-gray-100 ak-text-gray-700'
                                      }`}
                                    >
                                      <span>{opponent.netAmount > 0 ? '从' : '输给'}</span>
                                      <span className="ak-font-medium">{opponent.name}</span>
                                      <span className="ak-font-semibold">
                                        {Math.abs(opponent.netAmount).toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Transfer Records Tab */}
                  {activeTab === 'records' && (
                  <div>
                    <div className="ak-space-y-2">
                      {(() => {
                        const allTransactions = LocalStorage.getTransactions().filter(t => t.groupId === groupId);
                        const transferTransactions = allTransactions.filter(t => 
                          t.metadata?.tags?.includes('buy_in') || 
                          t.metadata?.tags?.includes('chip_transfer')
                        );
                        
                        if (transferTransactions.length === 0) {
                          return (
                            <div className="ak-text-center ak-text-gray-500 ak-py-4">
                              暂无筹码记录
                            </div>
                          );
                        }
                        
                        return transferTransactions
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map(transaction => {
                            const toPlayer = players.find(p => 
                              transaction.toUserId === (p.isCreator ? user?.id : p.id)
                            );
                            const fromPlayer = players.find(p => 
                              transaction.fromUserId === (p.isCreator ? user?.id : p.id)
                            );
                            
                            const isWin = transaction.metadata?.transferType === 'win';
                            const isLoan = transaction.metadata?.transferType === 'loan';
                            const isSystemBuyIn = transaction.fromUserId === 'system';
                            
                            let bgColor = 'ak-bg-gray-50 ak-border-gray-200';
                            let textColor = 'ak-text-gray-600';
                            let actionText = '操作';
                            
                            if (isWin) {
                              bgColor = 'ak-bg-green-50 ak-border-green-200';
                              textColor = 'ak-text-green-600';
                              actionText = '赢得筹码';
                            } else if (isLoan) {
                              bgColor = 'ak-bg-orange-50 ak-border-orange-200';
                              textColor = 'ak-text-orange-600';
                              actionText = '借出筹码';
                            } else if (isSystemBuyIn) {
                              bgColor = 'ak-bg-blue-50 ak-border-blue-200';
                              textColor = 'ak-text-blue-600';
                              actionText = '初始筹码';
                            }
                            
                            return (
                              <div 
                                key={transaction.id} 
                                className={`ak-flex ak-justify-between ak-items-center ak-p-3 ak-border ak-rounded-lg ${bgColor}`}
                              >
                                <div>
                                  <div className="ak-font-medium ak-text-gray-900 ak-flex ak-items-center ak-space-x-2">
                                    <span>{toPlayer?.name} {actionText}</span>
                                    {isWin && <span className="ak-text-green-600">💰</span>}
                                    {isLoan && <span className="ak-text-orange-600">📤</span>}
                                    {isSystemBuyIn && <span className="ak-text-blue-600">🏪</span>}
                                  </div>
                                  <div className="ak-text-sm ak-text-gray-600">
                                    {isSystemBuyIn ? '系统分配' : `来源: ${fromPlayer?.name}`} • {new Date(transaction.createdAt).toLocaleString()}
                                  </div>
                                  {transaction.description && (
                                    <div className="ak-text-xs ak-text-gray-500 ak-mt-1">
                                      {transaction.description}
                                    </div>
                                  )}
                                </div>
                                <div className="ak-text-right">
                                  <div className={`ak-text-lg ak-font-bold ${textColor}`}>
                                    +{transaction.amount.toLocaleString()}
                                  </div>
                                  <div className="ak-text-xs ak-text-gray-500">
                                    筹码
                                  </div>
                                </div>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  </div>
                  )}
                </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="ak-flex ak-justify-end ak-space-x-3 ak-px-6 ak-py-4 ak-border-t ak-border-gray-200 ak-bg-gray-50">
                <Button
                  variant="outline"
                  onClick={() => setShowSettlement(false)}
                  className="ak-transition-all ak-duration-200"
                >
                  关闭
                </Button>
                <Button
                  onClick={() => {
                    alert('结算数据已保存到本地');
                    setShowSettlement(false);
                  }}
                  className="ak-bg-blue-600 ak-hover:bg-blue-700 ak-text-white ak-transition-all ak-duration-200"
                >
                  保存结算
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}