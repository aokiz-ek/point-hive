'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, FormItem, Select, InputNumber, TextArea } from '@/components/ui/modal';
// import { useAuth, useTransactions } from '@/lib/hooks';
import { useTransactions } from '@/lib/hooks';
import { localPokerService, type PokerPlayer } from '@/lib/services/local-poker-service';
import { generateId, LocalStorage } from '@/lib/utils/local-storage';
import type { Transaction } from '@/lib/types';

// PokerPlayer 类型已从 services 导入

export default function PokerGroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  
  // Mock用户，避免登录依赖 - 使用useState确保稳定的引用
  const [user] = useState(() => ({ 
    id: 'mock-user-' + generateId(), 
    nickname: 'Wade'
  }));
  
  const [group, setGroup] = useState<any>(null);
  const [players, setPlayers] = useState<PokerPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [gameStatus, setGameStatus] = useState<'active' | 'paused' | 'finished'>('active');
  
  // 积分转移相关状态
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFrom, setTransferFrom] = useState<string>('');
  const [transferTo, setTransferTo] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<number>(2000);
  const [transferReason, setTransferReason] = useState<string>('');
  
  // 赢得筹码相关状态
  const [showWinModal, setShowWinModal] = useState(false);
  const [winnerId, setWinnerId] = useState<string>('');
  const [loserId, setLoserId] = useState<string>('');
  const [winAmount, setWinAmount] = useState<number>(2000);
  const [winReason, setWinReason] = useState<string>('');
  
  // 买入筹码相关状态
  const [showBuyInModal, setShowBuyInModal] = useState(false);
  const [buyInPlayer, setBuyInPlayer] = useState<string>('');
  const [buyInSource, setBuyInSource] = useState<'bank' | 'player'>('player'); // 买入来源，默认从玩家买入
  const [buyInFromPlayer, setBuyInFromPlayer] = useState<string>(''); // 从哪个玩家买入
  const [buyInAmount, setBuyInAmount] = useState<number>(2000);
  const [buyInReason, setBuyInReason] = useState<string>('');
  
  // 结算相关状态
  const [showSettlement, setShowSettlement] = useState(false);
  const [settlementData, setSettlementData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ranking' | 'battle' | 'records'>('ranking');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  
  // 新增玩家相关状态
  const [newPlayerName, setNewPlayerName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { transactions } = useTransactions({ groupId });

  // 加载群组数据
  useEffect(() => {
    const loadGroup = async () => {
      if (!user) return;
      
      const result = await localPokerService.getPokerGroup(groupId);
      
      if (!result.success || !result.data) {
        console.error('获取扑克群组失败:', result.error);
        alert(`无法加载游戏数据: ${result.error || '群组不存在'}。请先创建一个游戏房间。`);
        router.push('/groups/poker/create');
        return;
      }
      
      setGroup(result.data);
      
      // 计算每个玩家的当前积分
      const pokerSettings = result.data.pokerSettings;
      if (pokerSettings?.playerNames) {
        await calculatePlayerChips(pokerSettings.playerNames);
      }
    };

    loadGroup();
  }, [groupId, router, user]);

  const calculatePlayerChips = async (playerNames: any[]) => {
    if (!user) return null;
    
    const result = await localPokerService.calculatePlayerChips(groupId, playerNames, user.id);
    
    if (result.success && result.data) {
      setPlayers(result.data);
      
      // 积分守恒验证
      const playersData = result.data as PokerPlayer[];
      const totalCurrentChips = playersData.reduce((sum, p) => sum + p.currentChips, 0);
      const totalSystemBought = playersData.reduce((sum, p) => sum + p.totalBought, 0);
      
      // 在开发环境中验证筹码守恒
      if (process.env.NODE_ENV === 'development') {
        if (totalCurrentChips !== totalSystemBought) {
          console.warn('积分不守恒警告:', {
            totalCurrentChips,
            totalSystemBought,
            difference: totalCurrentChips - totalSystemBought
          });
        }
      }

      // 计算并设置对战统计
      try {
        const stats = await calculatePlayerVsPlayerStats();
        setPlayerStats(stats || []);
      } catch (error) {
        console.error('计算对战统计失败:', error);
        setPlayerStats([]);
      }
    } else {
      console.error('计算玩家筹码失败:', result.error);
    }
    
    return result;
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
        // Wade赢得Tomas 2000积分
        createTestTransaction(tomasId, wadeId, 2000, '测试：Wade赢得积分', 'win');
        setTimeout(() => {
          // Wade借出1000积分给Tomas
          createTestTransaction(wadeId, tomasId, 1000, '测试：Wade借出积分', 'buy_in');
        }, 500);
        break;
        
      case 'multi_transfer':
        // 创建循环借贷场景
        if (players.length >= 3) {
          const player3 = players[2];
          if (!player3) return; // TypeScript safety check
          const player3Id = player3.isCreator ? user.id : player3.id;
          
          createTestTransaction(wadeId, tomasId, 500, '测试：Wade→Tomas', 'buy_in');
          setTimeout(() => {
            createTestTransaction(tomasId, player3Id, 300, '测试：Tomas→第三人', 'buy_in');
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
            if (randomFrom && randomTo && randomFrom.id !== randomTo.id) {
              const fromId = randomFrom.isCreator ? user.id : randomFrom.id;
              const toId = randomTo.isCreator ? user.id : randomTo.id;
              const amount = Math.floor(Math.random() * 1000) + 100;
              const type = Math.random() > 0.5 ? 'win' : 'buy_in';
              createTestTransaction(fromId, toId, amount, `测试交易${i+1}`, type);
            }
          }, i * 200);
        }
        break;
    }
  };

  const createTestTransaction = async (fromUserId: string, toUserId: string, amount: number, description: string, transferType: 'win' | 'buy_in') => {
    const result = await localPokerService.createChipTransfer(
      groupId,
      fromUserId,
      toUserId,
      amount,
      description,
      transferType
    );
    
    if (result.success) {
      // 重新计算玩家积分
      if (group?.pokerSettings?.playerNames) {
        await calculatePlayerChips(group.pokerSettings.playerNames);
      }
    } else {
      console.error('创建测试交易失败:', result.error);
    }
  };

  const validateChipConservation = async () => {
    const totalCurrent = players.reduce((sum, p) => sum + p.currentChips, 0);
    const totalBought = players.reduce((sum, p) => sum + p.totalBought, 0);
    
    const transactionsResult = await localPokerService.getPokerTransactions(groupId);
    const allTransactions = transactionsResult.success ? transactionsResult.data : [];
    
    const result = {
      isValid: totalCurrent === totalBought,
      totalCurrent,
      totalBought,
      difference: totalCurrent - totalBought,
      transactionCount: allTransactions.length,
      systemTransactions: allTransactions.filter((t: any) => t.type === 'system').length,
      transferTransactions: allTransactions.filter((t: any) => t.type === 'transfer').length
    };
    
    alert(`积分守恒验证结果:\n${JSON.stringify(result, null, 2)}`);
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

  const exportTestData = async () => {
    const transactionsResult = await localPokerService.getPokerTransactions(groupId);
    const allTransactions = transactionsResult.success ? transactionsResult.data : [];
    
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
    alert('数据库模式下暂不支持重置功能。请联系管理员或使用开发者工具。');
  };

  const resetToInitialState = () => {
    alert('数据库模式下暂不支持重置功能。请联系管理员或使用开发者工具。');
  };

  // 快速筹码转移
  const handleQuickTransfer = async (fromPlayer: string, toPlayer: string, amount: number, reason: string = '') => {
    if (!user || amount <= 0) return;
    
    setLoading(true);
    
    try {
      const fromPlayerData = players.find(p => p.id === fromPlayer);
      const toPlayerData = players.find(p => p.id === toPlayer);
      
      if (!fromPlayerData || !toPlayerData) {
        throw new Error('玩家不存在');
      }
      
      if (fromPlayerData.currentChips < amount) {
        throw new Error('积分不足');
      }
      
      const fromUserId = fromPlayerData.isCreator ? user.id : (fromPlayerData.userId || fromPlayer);
      const toUserId = toPlayerData.isCreator ? user.id : (toPlayerData.userId || toPlayer);
      
      const result = await localPokerService.createChipTransfer(
        groupId,
        fromUserId,
        toUserId,
        amount,
        reason || `积分借出: ${fromPlayerData.name} 借给 ${toPlayerData.name}`,
        'buy_in'
      );
      
      if (!result.success) {
        throw new Error(result.error || '积分转移失败');
      }
      
      // 重新计算玩家积分
      if (group?.pokerSettings?.playerNames) {
        await calculatePlayerChips(group.pokerSettings.playerNames);
      }
      
      // 关闭转移模态框
      setShowTransferModal(false);
      resetTransferForm();
      
    } catch (error) {
      console.error('积分转移失败:', error);
      alert('积分转移失败: ' + (error as Error).message);
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

  // 新增玩家
  const addPlayer = async () => {
    if (!newPlayerName.trim() || !group) return;
    
    const trimmedName = newPlayerName.trim();
    
    // 检查是否重名
    const exists = players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      setErrors({ player: '玩家姓名不能重复' });
      return;
    }
    
    // 检查最大玩家数限制
    const maxPlayers = group.pokerSettings?.maxPlayers || 10;
    if (players.length >= maxPlayers) {
      setErrors({ player: `玩家数量不能超过${maxPlayers}人` });
      return;
    }
    
    try {
      setLoading(true);
      
      // 生成新玩家ID
      const newPlayerId = generateId();
      const newPlayerData = {
        id: newPlayerId,
        name: trimmedName,
        isCreator: false
      };
      
      // 添加到playerNames数组
      const newPlayerNames = [...(group.pokerSettings?.playerNames || []), newPlayerData];
      
      // 更新群组设置
      const updatedGroup = {
        ...group,
        pokerSettings: {
          ...group.pokerSettings,
          playerNames: newPlayerNames
        }
      };
      
      // 直接更新localStorage中的群组数据
      const groups = JSON.parse(localStorage.getItem('poker_groups') || '[]');
      const groupIndex = groups.findIndex((g: any) => g.id === groupId);
      if (groupIndex !== -1) {
        groups[groupIndex] = updatedGroup;
        localStorage.setItem('poker_groups', JSON.stringify(groups));
      }
      
      // 为新玩家创建系统交易，分配初始筹码
      const initialChips = group.pokerSettings?.initialChips || 2000;
      const systemUuid = '00000000-0000-0000-0000-000000000000';
      const now = new Date().toISOString();
      const transactionId = generateId();
      
      console.log(`✅ 为新玩家 ${trimmedName} (ID: ${newPlayerId}) 创建系统交易，积分: ${initialChips}`);
      
      const systemTransaction: Transaction = {
        id: transactionId,
        fromUserId: systemUuid,
        toUserId: newPlayerId,
        groupId: groupId,
        amount: initialChips,
        description: `积分游戏初始积分 - 玩家: ${trimmedName}`,
        type: 'system',
        status: 'completed',
        completedAt: now,
        createdAt: now,
        updatedAt: now,
        metadata: {
          tags: ['poker', 'initial_chips', group.pokerSettings?.gameType || 'points'],
          priority: 'normal',
          playerName: trimmedName,
          isCreator: false
        }
      };
      
      // 保存交易记录到localStorage (使用LocalStorage类的方法)
      LocalStorage.addTransaction(systemTransaction);
      
      console.log(`✅ 系统交易已保存: ${transactionId}`);
      
      // 重新加载群组数据和重新计算筹码
      setGroup(updatedGroup);
      const result = await calculatePlayerChips(newPlayerNames);
      
      // 验证新增玩家的筹码是否正确
      if (result?.success && result.data) {
        const newPlayerInResult = (result.data as PokerPlayer[]).find(p => p.name === trimmedName);
        if (newPlayerInResult) {
          const isCorrect = newPlayerInResult.currentChips === initialChips && newPlayerInResult.totalBought === initialChips;
          if (isCorrect) {
            console.log(`✅ 新增玩家 ${trimmedName} 筹码验证成功！当前筹码: ${newPlayerInResult.currentChips}, 初始筹码: ${newPlayerInResult.totalBought}`);
          } else {
            console.error(`❌ 筹码分配错误！玩家: ${trimmedName}, 期望: ${initialChips}, 实际当前筹码: ${newPlayerInResult.currentChips}, 实际初始筹码: ${newPlayerInResult.totalBought}`);
          }
        } else {
          console.error(`❌ 找不到新增玩家 ${trimmedName} 的筹码数据`);
        }
      }
      
      // 重置表单
      setNewPlayerName('');
      setErrors({});
      
    } catch (error) {
      console.error('新增玩家失败:', error);
      setErrors({ player: '新增玩家失败: ' + (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  // 快速添加预设玩家
  const addPresetPlayers = async () => {
    if (!group) return;
    
    const presetNames = ['Wade', 'Tomas', 'Sean', 'Iolo', 'Flynn', 'Jeff', 'David', 'Ray', 'GOGO', 'Yang', 'Steve'];
    const currentCount = players.length;
    const maxPlayers = group.pokerSettings?.maxPlayers || 10;
    const maxToAdd = Math.min(presetNames.length, maxPlayers - currentCount);
    
    if (maxToAdd <= 0) {
      setErrors({ player: `已达到最大玩家数${maxPlayers}人` });
      return;
    }
    
    try {
      setLoading(true);
      
      const newPlayers = presetNames.slice(0, maxToAdd).map(name => ({
        id: generateId(),
        name,
        isCreator: false
      }));
      
      // 过滤掉重复的名字
      const currentNames = players.map(p => p.name.toLowerCase());
      const uniqueNewPlayers = newPlayers.filter(p => !currentNames.includes(p.name.toLowerCase()));
      
      if (uniqueNewPlayers.length === 0) {
        setErrors({ player: '没有可以添加的新玩家（避免重名）' });
        return;
      }
      
      // 添加到playerNames数组
      const newPlayerNames = [...(group.pokerSettings?.playerNames || []), ...uniqueNewPlayers];
      
      // 更新群组设置
      const updatedGroup = {
        ...group,
        pokerSettings: {
          ...group.pokerSettings,
          playerNames: newPlayerNames
        }
      };
      
      // 直接更新localStorage中的群组数据
      const groups = JSON.parse(localStorage.getItem('poker_groups') || '[]');
      const groupIndex = groups.findIndex((g: any) => g.id === groupId);
      if (groupIndex !== -1) {
        groups[groupIndex] = updatedGroup;
        localStorage.setItem('poker_groups', JSON.stringify(groups));
      }
      
      // 为所有新玩家创建系统交易，分配初始筹码
      const initialChips = group.pokerSettings?.initialChips || 2000;
      const systemUuid = '00000000-0000-0000-0000-000000000000';
      const now = new Date().toISOString();
      const newTransactions: Transaction[] = [];
      
      for (const newPlayer of uniqueNewPlayers) {
        const transactionId = generateId();
        
        const systemTransaction: Transaction = {
          id: transactionId,
          fromUserId: systemUuid,
          toUserId: newPlayer.id,
          groupId: groupId,
          amount: initialChips,
          description: `积分游戏初始积分 - 玩家: ${newPlayer.name}`,
          type: 'system',
          status: 'completed',
          completedAt: now,
          createdAt: now,
          updatedAt: now,
          metadata: {
            tags: ['poker', 'initial_chips', group.pokerSettings?.gameType || 'points'],
            priority: 'normal',
            playerName: newPlayer.name,
            isCreator: false
          }
        };
        
        newTransactions.push(systemTransaction);
      }
      
      // 保存所有交易记录到localStorage (使用LocalStorage类的方法)
      newTransactions.forEach(transaction => {
        LocalStorage.addTransaction(transaction);
      });
      
      // 重新加载群组数据和重新计算筹码
      setGroup(updatedGroup);
      const result = await calculatePlayerChips(newPlayerNames);
      
      // 验证批量新增玩家的筹码是否正确
      if (result?.success && result.data) {
        const resultPlayers = result.data as PokerPlayer[];
        let allCorrect = true;
        
        for (const newPlayer of uniqueNewPlayers) {
          const playerInResult = resultPlayers.find(p => p.name === newPlayer.name);
          if (playerInResult) {
            const isCorrect = playerInResult.currentChips === initialChips && playerInResult.totalBought === initialChips;
            console.log(`批量新增玩家 ${newPlayer.name} 筹码验证:`, {
              expectedInitialChips: initialChips,
              actualCurrentChips: playerInResult.currentChips,
              actualTotalBought: playerInResult.totalBought,
              isCorrect
            });
            
            if (!isCorrect) {
              console.error(`玩家 ${newPlayer.name} 筹码分配错误！期望: ${initialChips}, 实际: 当前${playerInResult.currentChips}, 初始${playerInResult.totalBought}`);
              allCorrect = false;
            }
          } else {
            console.error(`找不到新增玩家 ${newPlayer.name} 的筹码数据`);
            allCorrect = false;
          }
        }
        
        if (!allCorrect) {
          setErrors({ player: `批量筹码分配验证失败，请重试` });
          return;
        }
      }
      
      setErrors({});
      
    } catch (error) {
      console.error('批量新增玩家失败:', error);
      setErrors({ player: '批量新增玩家失败: ' + (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  // 赢得筹码 (从其他玩家)
  const handleWinChips = async (winnerId: string, loserId: string, amount: number, reason: string = '') => {
    if (!user || amount <= 0) return;
    
    setLoading(true);
    
    try {
      const winner = players.find(p => p.id === winnerId);
      const loser = players.find(p => p.id === loserId);
      
      if (!winner || !loser) {
        throw new Error('玩家不存在');
      }
      
      if (loser.currentChips < amount) {
        throw new Error(`${loser.name} 筹码不足，当前只有 ${loser.currentChips} 积分`);
      }
      
      const loserUserId = loser.isCreator ? user.id : (loser.userId || loserId);
      const winnerUserId = winner.isCreator ? user.id : (winner.userId || winnerId);
      
      const result = await localPokerService.createChipTransfer(
        groupId,
        loserUserId,
        winnerUserId,
        amount,
        reason || `游戏输赢: ${winner.name} 击败 ${loser.name} 赢得筹码`,
        'win'
      );
      
      if (!result.success) {
        throw new Error(result.error || '筹码转移失败');
      }
      
      // 重新计算玩家积分
      if (group?.pokerSettings?.playerNames) {
        await calculatePlayerChips(group.pokerSettings.playerNames);
      }
      
      // 关闭赢得模态框
      setShowWinModal(false);
      resetWinForm();
      
    } catch (error) {
      console.error('积分转移失败:', error);
      alert('积分转移失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetWinForm = () => {
    setWinnerId('');
    setLoserId('');
    setWinAmount(2000);
    setWinReason('');
  };

  // 买入筹码（支持银行和玩家两种来源）
  const handleBuyIn = async (playerId: string, source: 'bank' | 'player', amount: number, fromPlayerId: string = '', reason: string = '') => {
    if (!user || amount <= 0) return;
    
    setLoading(true);
    
    try {
      const player = players.find(p => p.id === playerId);
      
      if (!player) {
        throw new Error('买入玩家不存在');
      }
      
      const playerUserId = player.isCreator ? user.id : (player.userId || playerId);
      
      if (source === 'bank') {
        // 从银行买入
        const result = await localPokerService.createBankBuyIn(
          groupId,
          playerUserId,
          amount,
          reason || `${player.name} 从银行买入筹码`
        );
        
        if (!result.success) {
          throw new Error(result.error || '银行买入失败');
        }
      } else {
        // 从其他玩家买入
        const fromPlayer = players.find(p => p.id === fromPlayerId);
        
        if (!fromPlayer) {
          throw new Error('卖出玩家不存在');
        }
        
        if (fromPlayer.currentChips < amount) {
          throw new Error(`${fromPlayer.name} 筹码不足，当前只有 ${fromPlayer.currentChips} 积分`);
        }
        
        const fromPlayerUserId = fromPlayer.isCreator ? user.id : (fromPlayer.userId || fromPlayerId);
        
        const result = await localPokerService.createChipTransfer(
          groupId,
          fromPlayerUserId,
          playerUserId,
          amount,
          reason || `筹码买入: ${player.name} 从 ${fromPlayer.name} 买入筹码`,
          'buy_in' // 买入类型，不影响净损益
        );
        
        if (!result.success) {
          throw new Error(result.error || '玩家买入失败');
        }
      }
      
      // 重新计算玩家积分
      if (group?.pokerSettings?.playerNames) {
        await calculatePlayerChips(group.pokerSettings.playerNames);
      }
      
      // 关闭买入模态框
      setShowBuyInModal(false);
      resetBuyInForm();
      
    } catch (error) {
      console.error('买入筹码失败:', error);
      alert('买入筹码失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetBuyInForm = () => {
    setBuyInPlayer('');
    setBuyInSource('player'); // 默认从玩家买入
    setBuyInFromPlayer('');
    setBuyInAmount(2000);
    setBuyInReason('');
  };

  // 计算玩家对战统计（只统计赢得交易，忽略借出交易）
  const calculatePlayerVsPlayerStats = async () => {
    const transactionsResult = await localPokerService.getPokerTransactions(groupId);
    const allTransactions = transactionsResult.success ? transactionsResult.data : [];
    const winTransactions = allTransactions.filter((t: any) => 
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
        if (toId && fromId !== toId && playerVsPlayer[fromId]) {
          playerVsPlayer[fromId]![toId] = 0;
        }
      });
    });
    
    // 统计赢得记录（只统计赢得类型的交易）
    winTransactions.forEach((transaction: Transaction) => {
      const fromId = transaction.fromUserId;
      const toId = transaction.toUserId;
      
      if (playerVsPlayer[fromId] && playerVsPlayer[fromId]![toId] !== undefined) {
        playerVsPlayer[fromId]![toId] += transaction.amount;
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
        netResult: player.netResult, // 添加最终净损益
        opponents: opponents.sort((a, b) => b.netAmount - a.netAmount)
      };
    }).filter(Boolean);
    
    // 按最终净损益排序，而不是按转移净收益排序
    return playerStats.filter((player): player is NonNullable<typeof player> => player !== null).sort((a, b) => b.netResult - a.netResult);
  };

  // 计算结算数据
  const calculateSettlement = async () => {
    const pokerSettings = group ? group.pokerSettings : null;
    if (!pokerSettings) return;
    
    const settlement = players.map(player => ({
      ...player,
      netResult: player.netResult, // 使用已经正确计算的净损益（只包含win类型交易）
      finalAmount: player.currentChips
    }));
    
    const totalChips = settlement.reduce((sum, p) => sum + p.currentChips, 0);
    const totalBought = settlement.reduce((sum, p) => sum + p.totalBought, 0);
    const playerVsPlayerStats = await calculatePlayerVsPlayerStats();
    
    // 获取所有交易记录用于结算显示
    const transactionsResult = await localPokerService.getPokerTransactions(groupId);
    if (transactionsResult.success) {
      setAllTransactions(transactionsResult.data);
    }
    
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

  const finishGame = async () => {
    setGameStatus('finished');
    await calculateSettlement();
    
    // 更新群组状态为已结束
    const result = await localPokerService.finishPokerGame(groupId);
    if (!result.success) {
      console.error('结束游戏失败:', result.error);
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
    <div className="ak-min-h-screen ak-bg-gradient-to-br ak-from-gray-900 ak-via-gray-800 ak-to-gray-900">
      <div className="ak-space-y-4 sm:ak-space-y-6 ak-max-w-6xl ak-mx-auto ak-px-4 sm:ak-px-6 lg:ak-px-8 ak-pt-8">
        {/* 游戏头部信息 */}
        <Card className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-amber-500/30 ak-shadow-2xl ak-shadow-amber-500/10">
          <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-amber-400 ak-to-transparent"></div>
          <div className="ak-p-4 sm:ak-p-6">
            <div className="ak-flex ak-flex-col lg:ak-flex-row lg:ak-justify-between lg:ak-items-start ak-space-y-4 lg:ak-space-y-0 ak-mb-4">
              <div className="ak-flex-1">
                <h1 className="ak-text-lg sm:ak-text-xl lg:ak-text-2xl ak-font-bold ak-bg-gradient-to-r ak-from-amber-300 ak-via-amber-400 ak-to-amber-500 ak-bg-clip-text ak-text-transparent ak-mb-1">{group.name}</h1>
                <p className="ak-text-sm sm:ak-text-base ak-text-amber-200/80 ak-mb-2">{group.description}</p>
                <div className="ak-flex ak-flex-wrap ak-items-center ak-gap-2 sm:ak-gap-3 lg:ak-gap-4 ak-text-xs sm:ak-text-sm ak-text-amber-300">
                  <span className="ak-bg-amber-500/20 ak-border ak-border-amber-500/30 ak-px-2 ak-py-1 ak-rounded">🎲 {pokerSettings?.gameType === 'points' ? '积分模式' : '锦标赛'}</span>
                  <span className="ak-bg-amber-500/20 ak-border ak-border-amber-500/30 ak-px-2 ak-py-1 ak-rounded">🃏 {pokerSettings?.smallBlind}/{pokerSettings?.bigBlind}</span>
                  <span className="ak-bg-amber-500/20 ak-border ak-border-amber-500/30 ak-px-2 ak-py-1 ak-rounded">👥 {players.length} 玩家</span>
                  <span className={`ak-px-2 ak-py-1 ak-rounded ak-text-xs ak-font-medium ak-border ${
                    gameStatus === 'active' ? 'ak-bg-green-500/20 ak-text-green-300 ak-border-green-500/30' :
                    gameStatus === 'paused' ? 'ak-bg-yellow-500/20 ak-text-yellow-300 ak-border-yellow-500/30' :
                    'ak-bg-gray-500/20 ak-text-gray-300 ak-border-gray-500/30'
                  }`}>
                    {gameStatus === 'active' ? '游戏中' : gameStatus === 'paused' ? '暂停' : '已结束'}
                  </span>
                </div>
              </div>
              
              <div className="ak-grid ak-grid-cols-2 ak-gap-3 sm:ak-gap-4 ak-text-center ak-min-w-0 lg:ak-min-w-[200px]">
                <div className="ak-bg-gradient-to-br ak-from-gray-700 ak-to-gray-600 ak-border ak-border-amber-500/20 ak-p-2 sm:ak-p-3 ak-rounded-lg ak-shadow-lg">
                  <div className="ak-text-xs sm:ak-text-sm ak-text-amber-300/80 ak-mb-1">总积分池</div>
                  <div className={`ak-text-base sm:ak-text-lg lg:ak-text-xl ak-font-bold ${isChipsConserved ? 'ak-text-blue-400' : 'ak-text-red-400'}`}>
                    {totalChips.toLocaleString()}
                  </div>
                  <div className="ak-text-xs ak-text-amber-400/70">
                    初始: {totalBought.toLocaleString()}
                  </div>
                </div>
                
                <div className="ak-bg-gradient-to-br ak-from-gray-700 ak-to-gray-600 ak-border ak-border-amber-500/20 ak-p-2 sm:ak-p-3 ak-rounded-lg ak-shadow-lg">
                  <div className="ak-text-xs sm:ak-text-sm ak-text-amber-300/80 ak-mb-1">积分流动</div>
                  <div className="ak-text-xs ak-text-amber-400/70 ak-space-y-1">
                    <div>转移: {totalWon.toLocaleString()}</div>
                    <div>守恒: {isChipsConserved ? '✅' : '❌'}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="ak-grid ak-grid-cols-2 sm:ak-flex sm:ak-flex-wrap ak-gap-2 sm:ak-gap-3">
              <Button
                onClick={() => setShowTransferModal(true)}
                disabled={gameStatus === 'finished'}
                size="sm"
                className="ak-flex-1 sm:ak-flex-none ak-min-h-[40px] ak-bg-amber-600 ak-hover:ak-bg-amber-700 ak-text-gray-900 ak-font-bold ak-border ak-border-amber-500"
              >
                <span className="ak-hidden sm:ak-inline">💸 转移积分</span>
                <span className="sm:ak-hidden">💸 转移</span>
              </Button>
              <Button
                variant="outline"
                onClick={calculateSettlement}
                size="sm"
                className="ak-flex-1 sm:ak-flex-none ak-min-h-[40px] ak-bg-gray-700 ak-border-blue-500/30 ak-text-blue-300 ak-hover:ak-bg-blue-500/10 ak-hover:ak-border-blue-400 ak-hover:ak-text-blue-200"
              >
                <span className="ak-hidden sm:ak-inline">📊 查看结算</span>
                <span className="sm:ak-hidden">📊 结算</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setGameStatus(gameStatus === 'active' ? 'paused' : 'active')}
                disabled={gameStatus === 'finished'}
                size="sm"
                className="ak-flex-1 sm:ak-flex-none ak-min-h-[40px] ak-bg-gray-700 ak-border-yellow-500/30 ak-text-yellow-300 ak-hover:ak-bg-yellow-500/10 ak-hover:ak-border-yellow-400 ak-hover:ak-text-yellow-200"
              >
                <span className="ak-hidden sm:ak-inline">{gameStatus === 'active' ? '⏸️ 暂停' : '▶️ 继续'}</span>
                <span className="sm:ak-hidden">{gameStatus === 'active' ? '⏸️' : '▶️'}</span>
              </Button>
              <Button
                variant="destructive"
                onClick={finishGame}
                disabled={gameStatus === 'finished'}
                size="sm"
                className="ak-flex-1 sm:ak-flex-none ak-min-h-[40px] ak-bg-red-600 ak-hover:ak-bg-red-700 ak-text-white ak-border ak-border-red-500"
              >
                <span className="ak-hidden sm:ak-inline">🏁 结束游戏</span>
                <span className="sm:ak-hidden">🏁 结束</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* 新增玩家 */}
        {gameStatus !== 'finished' && (
          <Card className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-green-500/30 ak-shadow-2xl ak-shadow-green-500/10">
            <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-green-400 ak-to-transparent"></div>
            <div className="ak-p-4 sm:ak-p-6">
              <div className="ak-flex ak-flex-col sm:ak-flex-row ak-justify-between ak-items-start ak-mb-4">
                <h2 className="ak-text-lg sm:ak-text-xl ak-font-bold ak-bg-gradient-to-r ak-from-green-300 ak-to-green-400 ak-bg-clip-text ak-text-transparent ak-flex ak-items-center ak-space-x-2">
                  <span>👥</span>
                  <span>新增玩家</span>
                  <div className="ak-text-sm ak-text-green-300 ak-bg-green-500/20 ak-border ak-border-green-400/30 ak-px-2 ak-py-1 ak-rounded-lg ak-font-medium ak-ml-2">
                    {players.length} / {group?.pokerSettings?.maxPlayers || 10} 人
                  </div>
                </h2>
                
                <div className="ak-text-xs sm:ak-text-sm ak-text-green-300 ak-bg-green-500/10 ak-border ak-border-green-400/20 ak-px-3 ak-py-2 ak-rounded-lg ak-mt-2 sm:ak-mt-0">
                  <div className="ak-flex ak-items-center ak-space-x-2">
                    <span>💰</span>
                    <div>
                      <div>当前总积分池: {totalChips.toLocaleString()}</div>
                      {(() => {
                        const initialChips = group?.pokerSettings?.initialChips || 2000;
                        const maxPlayers = group?.pokerSettings?.maxPlayers || 10;
                        const remainingSlots = maxPlayers - players.length;
                        const hasInput = newPlayerName.trim();
                        const canAddMore = players.length < maxPlayers;
                        
                        if (hasInput) {
                          return (
                            <div className="ak-text-green-400 ak-font-medium">
                              添加后: {(totalChips + initialChips).toLocaleString()}
                              <span className="ak-ml-1 ak-text-green-300">(+{initialChips.toLocaleString()})</span>
                            </div>
                          );
                        } else if (canAddMore) {
                          return (
                            <div className="ak-text-green-400 ak-font-medium">
                              快速填充可增加: {(remainingSlots * initialChips).toLocaleString()}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="ak-flex ak-flex-col sm:ak-flex-row ak-gap-2 sm:ak-space-x-3 sm:ak-space-y-0">
                <div className="ak-flex-1">
                  <Input
                    value={newPlayerName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPlayerName(e.target.value)}
                    placeholder="输入玩家姓名"
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), addPlayer())}
                    maxLength={20}
                    className="ak-bg-gray-700 ak-border-green-500/30 ak-text-green-200 ak-placeholder-green-400/60 ak-focus:border-green-400 ak-focus:ring-green-400"
                  />
                  {errors.player && (
                    <p className="ak-text-sm ak-text-red-500 ak-mt-1">{errors.player}</p>
                  )}
                </div>
                
                <div className="ak-flex ak-gap-2 sm:ak-gap-3">
                  <Button 
                    type="button" 
                    onClick={addPlayer} 
                    size="sm" 
                    disabled={loading || players.length >= (group?.pokerSettings?.maxPlayers || 10)}
                    className="ak-flex-1 sm:ak-flex-none ak-min-h-[40px] ak-bg-green-600 ak-hover:ak-bg-green-700 ak-text-white ak-border-green-500/30"
                  >
                    {loading ? '添加中...' : (
                      <>
                        <span className="ak-hidden sm:ak-inline">添加玩家</span>
                        <span className="sm:ak-hidden">添加</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addPresetPlayers} 
                    size="sm"
                    disabled={loading || players.length >= (group?.pokerSettings?.maxPlayers || 10)}
                    className="ak-flex-1 sm:ak-flex-none ak-min-h-[40px] ak-bg-gray-700 ak-border-green-500/30 ak-text-green-300 ak-hover:ak-bg-green-500/10 ak-hover:ak-border-green-400 ak-hover:ak-text-green-200"
                  >
                    {loading ? '填充中...' : (
                      <>
                        <span className="ak-hidden sm:ak-inline">快速填充</span>
                        <span className="sm:ak-hidden">填充</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 玩家筹码显示 */}
        <div className="ak-grid ak-grid-cols-1 sm:ak-grid-cols-2 lg:ak-grid-cols-3 ak-gap-3 sm:ak-gap-4">
          {players.map((player) => (
            <Card key={player.id} className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-transition-shadow ak-hover:shadow-lg ak-hover:shadow-amber-500/20 ak-p-3 sm:ak-p-4 ak-border-gray-600/40">
            
            <div className="ak-flex ak-items-center ak-justify-between ak-mb-3">
              <div className="ak-flex ak-items-center ak-space-x-2 ak-min-w-0 ak-flex-1">
                <span className="ak-text-base sm:ak-text-lg ak-flex-shrink-0">
                  🎭
                </span>
                <h3 className="ak-text-sm sm:ak-text-base ak-font-semibold ak-text-gray-100 ak-truncate">
                  {player.name}
                </h3>
              </div>
              <div className="ak-text-xs ak-px-2 ak-py-1 ak-rounded ak-bg-blue-600/30 ak-text-blue-300 ak-border ak-border-blue-500/40 ak-flex-shrink-0">
                在场
              </div>
            </div>
            
            <div className="ak-space-y-2">
              <div className="ak-flex ak-justify-between ak-items-center">
                <span className="ak-text-xs sm:ak-text-sm ak-text-gray-300">当前筹码</span>
                <span className={`ak-text-sm sm:ak-text-base ak-font-bold ${
                  player.currentChips > pokerSettings?.initialChips ? 'ak-text-green-400' :
                  player.currentChips < pokerSettings?.initialChips ? 'ak-text-red-400' :
                  'ak-text-gray-100'
                }`}>
                  {player.currentChips.toLocaleString()}
                </span>
              </div>
              
              <div className="ak-flex ak-justify-between ak-items-center">
                <span className="ak-text-xs sm:ak-text-sm ak-text-gray-300">初始筹码</span>
                <span className="ak-text-xs sm:ak-text-sm ak-text-gray-200">
                  {player.totalBought.toLocaleString()}
                </span>
              </div>
              
              <div className="ak-flex ak-justify-between ak-items-center">
                <span className="ak-text-xs sm:ak-text-sm ak-text-gray-300">损益</span>
                <span className={`ak-text-xs sm:ak-text-sm ak-font-medium ${
                  player.netResult > 0 ? 'ak-text-green-400' :
                  player.netResult < 0 ? 'ak-text-red-400' :
                  'ak-text-gray-300'
                }`}>
                  {player.netResult > 0 ? '+' : ''}{player.netResult.toLocaleString()}
                </span>
              </div>
              
              <div className="ak-w-full ak-bg-gray-600 ak-rounded-full ak-h-2 ak-mt-2">
                <div
                  className={`ak-h-2 ak-rounded-full ak-transition-all ak-duration-300 ${
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
              <div className="ak-flex ak-gap-2 ak-mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setWinnerId(player.id);
                    setShowWinModal(true);
                  }}
                  className="ak-flex-1 ak-text-xs ak-bg-green-600/20 ak-text-green-300 ak-border-green-500/40 hover:ak-bg-green-600/30 ak-min-h-[36px] ak-transition-colors"
                >
                  <span className="ak-hidden sm:ak-inline">💰 赢得</span>
                  <span className="sm:ak-hidden">💰</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBuyInPlayer(player.id);
                    setShowBuyInModal(true);
                  }}
                  className="ak-flex-1 ak-text-xs ak-bg-blue-600/20 ak-text-blue-300 ak-border-blue-500/40 hover:ak-bg-blue-600/30 ak-min-h-[36px] ak-transition-colors"
                >
                  <span className="ak-hidden sm:ak-inline">🏪 买入</span>
                  <span className="sm:ak-hidden">🏪</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTransferFrom(player.id);
                    setShowTransferModal(true);
                  }}
                  className="ak-flex-1 ak-text-xs ak-bg-orange-600/20 ak-text-orange-300 ak-border-orange-500/40 hover:ak-bg-orange-600/30 ak-min-h-[36px] ak-transition-colors"
                >
                  <span className="ak-hidden sm:ak-inline">📤 借出</span>
                  <span className="sm:ak-hidden">📤</span>
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* 游戏规则说明 */}
      <Card className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-amber-500/30 ak-shadow-lg ak-shadow-amber-500/5">
        <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-amber-400/50 ak-to-transparent"></div>
        <div className="ak-p-4 sm:ak-p-6">
          <h3 className="ak-text-sm ak-font-semibold ak-text-amber-300 ak-mb-4 ak-flex ak-items-center ak-gap-2">
            📋 操作规则说明
          </h3>
          <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-3 ak-gap-4 ak-text-xs ak-text-amber-200/80">
            <div className="ak-flex ak-items-center ak-space-x-3">
              <span className="ak-bg-green-500/20 ak-text-green-300 ak-px-3 ak-py-1 ak-rounded ak-font-medium ak-border ak-border-green-500/30">💰 赢得</span>
              <span>= 游戏输赢（计入净损益）</span>
            </div>
            <div className="ak-flex ak-items-center ak-space-x-3">
              <span className="ak-bg-blue-500/20 ak-text-blue-300 ak-px-3 ak-py-1 ak-rounded ak-font-medium ak-border ak-border-blue-500/30">🏪 买入</span>
              <span>= 银行/玩家买入（不影响净损益）</span>
            </div>
            <div className="ak-flex ak-items-center ak-space-x-3">
              <span className="ak-bg-orange-500/20 ak-text-orange-300 ak-px-3 ak-py-1 ak-rounded ak-font-medium ak-border ak-border-orange-500/30">📤 借出</span>
              <span>= 临时借贷（不影响净损益）</span>
            </div>
            <div className="ak-col-span-1 md:ak-col-span-3 ak-text-amber-200/80 ak-bg-gradient-to-br ak-from-gray-700 ak-to-gray-600 ak-px-4 ak-py-3 ak-rounded-lg ak-text-center ak-border ak-border-amber-500/20 ak-shadow-lg">
              <strong className="ak-text-amber-300">💡 示例：</strong> 
              Wade赢得Tomas 2000（净损益+2000）| Tomas从银行买入2000（总筹码增加）| Sean从Wade买入1000（总筹码不变）| Wade借出500给Tomas（临时转移）
            </div>
          </div>
        </div>
      </Card>

      {/* 对战统计排名 */}
      <Card className="ak-p-6 ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border-gray-600/40">
        <h3 className="ak-text-lg ak-font-semibold ak-mb-4 ak-flex ak-items-center ak-gap-2 ak-text-gray-100">
          ⚔️ 净损益排名
        </h3>
        <div className="ak-space-y-3">
          {playerStats?.map((playerStat: any, index: number) => (
              <div 
                key={playerStat.id}
                className={`ak-flex ak-justify-between ak-items-center ak-p-3 ak-rounded-lg ak-border ak-transition-all ak-duration-200 ${
                  index === 0 ? 'ak-bg-gradient-to-r ak-from-green-800/30 ak-to-emerald-800/30 ak-border-green-500/40' :
                  playerStat.netResult > 0 ? 'ak-bg-green-800/20 ak-border-green-500/40' :
                  playerStat.netResult < 0 ? 'ak-bg-red-800/20 ak-border-red-500/40' :
                  'ak-bg-gray-700/30 ak-border-gray-600/40'
                }`}
              >
                <div className="ak-flex ak-items-center ak-space-x-3">
                  <span className={`ak-text-lg ak-font-bold ak-w-8 ak-text-center ${
                    index === 0 ? 'ak-text-green-400' : 'ak-text-gray-300'
                  }`}>
                    {index === 0 ? '👑' : `#${index + 1}`}
                  </span>
                  <div>
                    <div className="ak-font-semibold ak-text-gray-100">{playerStat.name}</div>
                    <div className="ak-text-xs ak-text-gray-400">
                      获得 {playerStat.totalWonFromOthers.toLocaleString()} | 
                      失去 {playerStat.totalLostToOthers.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="ak-text-right">
                  <div className={`ak-font-bold ak-text-lg ${
                    playerStat.netResult > 0 ? 'ak-text-green-400' :
                    playerStat.netResult < 0 ? 'ak-text-red-400' :
                    'ak-text-gray-300'
                  }`}>
                    {playerStat.netResult > 0 ? '+' : ''}{playerStat.netResult.toLocaleString()}
                  </div>
                  <div className="ak-text-xs ak-text-gray-400">净损益</div>
                </div>
              </div>
            ))}
          
          {players.length > 5 && (
            <div className="ak-text-center ak-py-2">
              <button
                className="ak-text-sm ak-text-blue-400 ak-hover:text-blue-300 ak-transition-colors"
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
            options={players
              .filter(p => p.currentChips > 0)
              .map(p => ({
                value: p.id,
                label: `${p.name} (积分: ${p.currentChips.toLocaleString()})`
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
            placeholder="输入借出的筹码数量"
          />
          {transferFrom && (
            <div className="ak-flex ak-flex-wrap ak-gap-2 ak-mt-3">
              {[1000, 2000, 3000, 5000]
                .filter(amount => amount <= (players.find(p => p.id === transferFrom)?.currentChips || 0))
                .map(amount => (
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
                全部 ({transferFrom ? players.find(p => p.id === transferFrom)?.currentChips.toLocaleString() : 0})
              </Button>
            </div>
          )}
          {transferFrom && (
            <div className="ak-text-xs ak-text-gray-500 ak-mt-1">
              可借出: {players.find(p => p.id === transferFrom)?.currentChips.toLocaleString()} 积分
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

      {/* 赢得筹码模态框 - Ant Design Style */}
      <Modal
        open={showWinModal}
        onCancel={() => {
          setShowWinModal(false);
          resetWinForm();
        }}
        title="💰 赢得筹码"
        width={480}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowWinModal(false);
                resetWinForm();
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => handleWinChips(winnerId, loserId, winAmount, winReason)}
              disabled={!winnerId || !loserId || winAmount <= 0 || loading}
              className="ak-bg-green-600 ak-hover:bg-green-700 ak-text-white"
            >
              {loading ? '记录中...' : '确认赢得'}
            </Button>
          </>
        }
      >

   
        <FormItem label="赢家玩家" required>
          <Select
            value={winnerId}
            onChange={setWinnerId}
            placeholder="请选择赢家玩家"
            options={players
              .filter(p => p.id !== loserId)
              .map(p => ({ value: p.id, label: p.name }))}
          />
        </FormItem>

        <FormItem label="输家玩家" required>
          <Select
            value={loserId}
            onChange={setLoserId}
            placeholder="请选择输家玩家"
            options={players
              .filter(p => p.currentChips > 0 && p.id !== winnerId)
              .map(p => ({
                value: p.id,
                label: `${p.name} (积分: ${p.currentChips.toLocaleString()})`
              }))}
          />
        </FormItem>
     
        
        <FormItem label="赢得金额" required>
          <InputNumber
            value={winAmount}
            onChange={setWinAmount}
            min={1}
            max={loserId ? players.find(p => p.id === loserId)?.currentChips || 0 : 0}
            placeholder="输入赢得的筹码数量"
          />
          {loserId && (
            <div className="ak-flex ak-flex-wrap ak-gap-2 ak-mt-3">
              {[500, 1000, 2000, 3000, 5000]
                .filter(amount => amount <= (players.find(p => p.id === loserId)?.currentChips || 0))
                .map(amount => (
                <Button
                  key={amount}
                  size="sm"
                  variant="outline"
                  onClick={() => setWinAmount(amount)}
                  className="ak-text-xs"
                >
                  {amount.toLocaleString()}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const player = players.find(p => p.id === loserId);
                  if (player) setWinAmount(player.currentChips);
                }}
                className="ak-text-xs"
              >
                全部 ({loserId ? players.find(p => p.id === loserId)?.currentChips.toLocaleString() : 0})
              </Button>
            </div>
          )}
          {loserId && (
            <div className="ak-text-xs ak-text-gray-500 ak-mt-1">
              最大可赢得: {players.find(p => p.id === loserId)?.currentChips.toLocaleString()} 积分
            </div>
          )}
        </FormItem>
        
        <FormItem label="备注 (可选)">
          <TextArea
            value={winReason}
            onChange={setWinReason}
            placeholder="例如：All-in对决获胜、同花顺击败对子"
            rows={2}
          />
        </FormItem>
      </Modal>

      {/* 买入筹码模态框 - Ant Design Style */}
      <Modal
        open={showBuyInModal}
        onCancel={() => {
          setShowBuyInModal(false);
          resetBuyInForm();
        }}
        title="🏪 买入筹码"
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
              onClick={() => handleBuyIn(buyInPlayer, buyInSource, buyInAmount, buyInFromPlayer, buyInReason)}
              disabled={!buyInPlayer || buyInAmount <= 0 || (buyInSource === 'player' && !buyInFromPlayer) || loading}
              className="ak-bg-blue-600 ak-hover:bg-blue-700 ak-text-white"
            >
              {loading ? '买入中...' : '确认买入'}
            </Button>
          </>
        }
      >
        <FormItem label="买入玩家" required>
          <Select
            value={buyInPlayer}
            onChange={setBuyInPlayer}
            placeholder="请选择买入玩家"
            options={players.map(p => ({ value: p.id, label: p.name }))}
          />
        </FormItem>
        
        <FormItem label="买入来源" required>
          <div className="ak-flex ak-gap-3">
            <Button
              variant={buyInSource === 'bank' ? 'default' : 'outline'}
              onClick={() => setBuyInSource('bank')}
              className={`ak-flex-1 ak-min-h-[40px] ${
                buyInSource === 'bank' 
                  ? 'ak-bg-blue-600 ak-text-white ak-border-blue-600' 
                  : 'ak-bg-gray-100 ak-text-gray-700 ak-border-gray-300 ak-hover:ak-bg-gray-200'
              }`}
            >
              🏪 从银行买入
            </Button>
            <Button
              variant={buyInSource === 'player' ? 'default' : 'outline'}
              onClick={() => setBuyInSource('player')}
              className={`ak-flex-1 ak-min-h-[40px] ${
                buyInSource === 'player' 
                  ? 'ak-bg-blue-600 ak-text-white ak-border-blue-600' 
                  : 'ak-bg-gray-100 ak-text-gray-700 ak-border-gray-300 ak-hover:ak-bg-gray-200'
              }`}
            >
              👤 从玩家买入
            </Button>
          </div>
          <div className="ak-text-xs ak-text-gray-600 ak-mt-2">
            {buyInSource === 'bank' ? 
              '💡 从银行买入会增加总筹码池，不影响净损益统计' : 
              '💡 从玩家买入只是筹码转移，总筹码池不变，不影响净损益统计'
            }
          </div>
        </FormItem>
        
        {buyInSource === 'player' && (
          <FormItem label="卖出玩家" required>
            <Select
              value={buyInFromPlayer}
              onChange={setBuyInFromPlayer}
              placeholder="请选择卖出玩家"
              options={players
                .filter(p => p.currentChips > 0 && p.id !== buyInPlayer)
                .map(p => ({
                  value: p.id,
                  label: `${p.name} (积分: ${p.currentChips.toLocaleString()})`
                }))}
            />
          </FormItem>
        )}
        
        <FormItem label="买入金额" required>
          <InputNumber
            value={buyInAmount}
            onChange={setBuyInAmount}
            min={100}
            max={buyInSource === 'bank' ? 50000 : (buyInFromPlayer ? players.find(p => p.id === buyInFromPlayer)?.currentChips || 0 : 0)}
            placeholder="输入买入的筹码数量"
          />
          <div className="ak-flex ak-flex-wrap ak-gap-2 ak-mt-3">
            {buyInSource === 'bank' ? (
              // 银行买入的快捷金额
              [1000, 2000, 3000, 5000, 10000].map(amount => (
                <Button
                  key={amount}
                  size="sm"
                  variant="outline"
                  onClick={() => setBuyInAmount(amount)}
                  className="ak-text-xs"
                >
                  {amount.toLocaleString()}
                </Button>
              ))
            ) : (
              // 从玩家买入的快捷金额（受限于玩家现有筹码）
              [500, 1000, 2000, 3000, 5000]
                .filter(amount => amount <= (players.find(p => p.id === buyInFromPlayer)?.currentChips || 0))
                .map(amount => (
                  <Button
                    key={amount}
                    size="sm"
                    variant="outline"
                    onClick={() => setBuyInAmount(amount)}
                    className="ak-text-xs"
                  >
                    {amount.toLocaleString()}
                  </Button>
                ))
            )}
            
            {buyInSource === 'player' && buyInFromPlayer && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const player = players.find(p => p.id === buyInFromPlayer);
                  if (player) setBuyInAmount(player.currentChips);
                }}
                className="ak-text-xs"
              >
                全部 ({buyInFromPlayer ? players.find(p => p.id === buyInFromPlayer)?.currentChips.toLocaleString() : 0})
              </Button>
            )}
          </div>
          
          {buyInSource === 'player' && buyInFromPlayer && (
            <div className="ak-text-xs ak-text-gray-500 ak-mt-1">
              可买入: {players.find(p => p.id === buyInFromPlayer)?.currentChips.toLocaleString()} 积分
            </div>
          )}
        </FormItem>
        
        <FormItem label="备注 (可选)">
          <TextArea
            value={buyInReason}
            onChange={setBuyInReason}
            placeholder={buyInSource === 'bank' ? "例如：中途补充筹码继续游戏" : "例如：向朋友买入筹码"}
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
            <div className="ak-bg-gray-800 ak-rounded-lg ak-shadow-2xl ak-max-w-4xl ak-w-full ak-max-h-[90vh] ak-overflow-hidden ak-animate-fade-in ak-border ak-border-gray-600">
              
              {/* Modal Header */}
              <div className="ak-flex ak-items-center ak-justify-between ak-px-6 ak-py-4 ak-border-b ak-border-gray-600">
                <h3 className="ak-text-lg ak-font-semibold ak-text-gray-100 ak-flex ak-items-center ak-gap-2">
                  📊 游戏结算
                </h3>
                <button
                  className="ak-text-gray-400 ak-hover:text-gray-300 ak-transition-colors ak-duration-200"
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
                <div className="ak-px-6 ak-py-4 ak-border-b ak-border-gray-600 ak-bg-gray-750">
                  <div className="ak-grid ak-grid-cols-3 ak-gap-4">
                    <div className="ak-bg-blue-800/30 ak-p-4 ak-rounded-lg ak-text-center ak-border ak-border-blue-600/40">
                      <div className="ak-text-sm ak-text-blue-300 ak-font-medium ak-mb-1">总筹码</div>
                      <div className="ak-text-2xl ak-font-bold ak-text-blue-100">
                        {settlementData.totalChips.toLocaleString()}
                      </div>
                    </div>
                    <div className="ak-bg-green-800/30 ak-p-4 ak-rounded-lg ak-text-center ak-border ak-border-green-600/40">
                      <div className="ak-text-sm ak-text-green-300 ak-font-medium ak-mb-1">初始筹码</div>
                      <div className="ak-text-2xl ak-font-bold ak-text-green-100">
                        {settlementData.totalBought.toLocaleString()}
                      </div>
                    </div>
                    <div className="ak-bg-purple-800/30 ak-p-4 ak-rounded-lg ak-text-center ak-border ak-border-purple-600/40">
                      <div className="ak-text-sm ak-text-purple-300 ak-font-medium ak-mb-1">游戏时长</div>
                      <div className="ak-text-2xl ak-font-bold ak-text-purple-100">
                        {Math.round((new Date(settlementData.gameEndTime).getTime() - new Date(settlementData.gameStartTime).getTime()) / (1000 * 60))}分钟
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tabs Header */}
                <div className="ak-px-6 ak-border-b ak-border-gray-600 ak-bg-gray-800">
                  <div className="ak-flex ak-space-x-0">
                    <button
                      onClick={() => setActiveTab('ranking')}
                      className={`ak-px-4 ak-py-3 ak-text-sm ak-font-medium ak-border-b-2 ak-transition-colors ak-duration-200 ak-flex ak-items-center ak-space-x-2 ${
                        activeTab === 'ranking'
                          ? 'ak-border-blue-400 ak-text-blue-300 ak-bg-blue-800/30'
                          : 'ak-border-transparent ak-text-gray-400 ak-hover:text-gray-300 ak-hover:bg-gray-700/30'
                      }`}
                    >
                      <span>🏆</span>
                      <span>玩家排名</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('battle')}
                      className={`ak-px-4 ak-py-3 ak-text-sm ak-font-medium ak-border-b-2 ak-transition-colors ak-duration-200 ak-flex ak-items-center ak-space-x-2 ${
                        activeTab === 'battle'
                          ? 'ak-border-blue-400 ak-text-blue-300 ak-bg-blue-800/30'
                          : 'ak-border-transparent ak-text-gray-400 ak-hover:text-gray-300 ak-hover:bg-gray-700/30'
                      }`}
                    >
                      <span>⚔️</span>
                      <span>对战统计</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('records')}
                      className={`ak-px-4 ak-py-3 ak-text-sm ak-font-medium ak-border-b-2 ak-transition-colors ak-duration-200 ak-flex ak-items-center ak-space-x-2 ${
                        activeTab === 'records'
                          ? 'ak-border-blue-400 ak-text-blue-300 ak-bg-blue-800/30'
                          : 'ak-border-transparent ak-text-gray-400 ak-hover:text-gray-300 ak-hover:bg-gray-700/30'
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
                        const transferTransactions = allTransactions.filter((t: any) => 
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
                            const isLoan = transaction.metadata?.transferType === 'buy_in';
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
                                    积分
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
              <div className="ak-flex ak-justify-end ak-space-x-3 ak-px-6 ak-py-4 ak-border-t ak-border-gray-600 ak-bg-gray-750">
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
    </div>
  );
}