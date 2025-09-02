import { LocalStorage, generateId, formatDateTime } from '@/lib/utils/local-storage'
import type { Group, Transaction } from '@/lib/types'

export interface StrategyPlayer {
  id: string
  name: string
  userId?: string
  currentChips: number
  isCreator: boolean
  totalBought: number
  totalWon: number
  totalLost: number
  netResult: number
}

export interface StrategyGameSettings {
  gameType: 'points' | 'tournament'
  smallBlind: number
  bigBlind: number
  initialChips: number
  maxPlayers: number
  playerNames: Array<{
    id: string
    name: string
    isCreator: boolean
    userId?: string
  }>
  sessionStartTime: string
  gameStatus: 'active' | 'paused' | 'finished'
}

export interface StrategyServiceResponse {
  success: boolean
  data?: any
  error?: string
}

export interface SettlementAnalysis {
  playerId: string
  playerName: string
  initialChips: number
  currentChips: number
  netResult: number
  gameProfit: number
  bankDebt: number
  loanBalance: number
  loanReceivable: number
  loanPayable: number
  finalCashFlow: number
  settlementType: 'receive' | 'pay'
}

export interface OptimizedTransfer {
  from: string
  fromName: string
  to: string
  toName: string
  amount: number
  reason: string
  type: 'player_to_player' | 'player_to_bank'
}

export interface SettlementPlan {
  summary: {
    totalReceivers: number
    totalPayers: number
    totalAmount: number
    transferCount: number
  }
  players: SettlementAnalysis[]
  optimizedTransfers: OptimizedTransfer[]
  bankRepayments: Array<{
    playerName: string
    playerId: string
    amount: number
  }>
}

class LocalStrategyService {
  /**
   * 创建策略训练群组 (localStorage版本)
   */
  async createStrategyGroup(
    ownerId: string,
    formData: {
      tableName: string
      initialChips: number
      smallBlind: number
      bigBlind: number
      maxPlayers: number
      gameType: 'points' | 'tournament'
    },
    players: Array<{
      id: string
      name: string
      isCreator: boolean
      userId?: string
      fullName?: string
      creditScore?: number
    }>
  ): Promise<StrategyServiceResponse> {
    try {
      // 生成群组ID
      const groupId = generateId()
      const inviteCode = Math.random().toString(36).substr(2, 8).toUpperCase()
      const now = new Date().toISOString()

      // 1. 创建群组基础数据
      const group: Group = {
        id: groupId,
        name: `🎯 ${formData.tableName}`,
        description: `策略训练 ${formData.gameType === 'points' ? '积分模式' : '锦标赛'} - ${formData.smallBlind}/${formData.bigBlind} 基础投入`,
        ownerId,
        adminIds: [ownerId],
        memberIds: [ownerId],
        inviteCode,
        maxMembers: formData.maxPlayers,
        totalPoints: formData.initialChips * players.length,
        rules: {
          maxTransferAmount: formData.initialChips * 2,
          maxPendingAmount: formData.initialChips * 3,
          defaultReturnPeriod: 1,
          creditScoreThreshold: 500,
          allowAnonymousTransfer: true,
          requireApproval: false,
          autoReminderEnabled: true,
          allowPartialReturn: true,
          dailyTransferLimit: formData.initialChips * 10,
          memberJoinApproval: false
        },
        settings: {
          autoAcceptTransfers: true,
          notificationSound: true,
          showMemberActivity: true,
          allowMemberInvite: false,
          requireVerifiedEmail: false,
          requireVerifiedPhone: false,
          enableCreditLimit: false,
          enableTimeLimit: false,
          pointsPerMember: formData.initialChips
        },
        status: 'active',
        tags: ['poker', 'gaming', formData.gameType],
        isPublic: false,
        createdAt: now,
        updatedAt: now,
        currentMembers: players.length,
        isActive: true,
        pointsBalance: formData.initialChips
      }

      // 2. 创建策略训练专用设置
      const strategySettings: StrategyGameSettings = {
        gameType: formData.gameType,
        smallBlind: formData.smallBlind,
        bigBlind: formData.bigBlind,
        initialChips: formData.initialChips,
        maxPlayers: formData.maxPlayers,
        playerNames: players.map(p => ({
          id: p.id,
          name: p.name,
          isCreator: p.isCreator,
          userId: p.isCreator ? ownerId : (p.userId || p.id)
        })),
        sessionStartTime: now,
        gameStatus: 'active'
      }

      // 将策略训练设置存储到group metadata中
      const groupWithMetadata = {
        ...group,
        metadata: {
          strategySettings
        }
      }

      // 3. 保存群组到localStorage
      LocalStorage.addGroup(groupWithMetadata)

      // 4. 为每个玩家创建初始积分交易记录
      const transactions: Transaction[] = []
      for (const player of players) {
        const transactionId = generateId()
        const systemUuid = '00000000-0000-0000-0000-000000000000' // 特殊的系统 UUID
        
        const transaction: Transaction = {
          id: transactionId,
          fromUserId: systemUuid,
          toUserId: player.isCreator ? ownerId : (player.userId || player.id),
          groupId: groupId,
          amount: formData.initialChips,
          description: `策略训练初始积分 - 玩家: ${player.name}`,
          type: 'system',
          status: 'completed',
          completedAt: now,
          createdAt: now,
          updatedAt: now,
          metadata: {
            tags: ['poker', 'initial_chips', formData.gameType],
            priority: 'normal',
            playerName: player.name,
            isCreator: player.isCreator || false
          }
        }
        
        transactions.push(transaction)
      }

      // 保存交易记录到localStorage
      const existingTransactions = LocalStorage.getTransactions()
      LocalStorage.setTransactions([...existingTransactions, ...transactions])

      return {
        success: true,
        data: {
          ...groupWithMetadata,
          strategySettings
        }
      }
    } catch (error) {
      console.error('创建策略训练群组失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建策略训练群组失败'
      }
    }
  }

  /**
   * 获取策略训练群组详情 (localStorage版本)
   */
  async getStrategyGroup(groupId: string): Promise<StrategyServiceResponse> {
    try {
      const groups = LocalStorage.getGroups()
      const group = groups.find(g => g.id === groupId)
      
      if (!group) {
        return { success: false, error: '群组不存在' }
      }

      const strategySettings = (group as any).metadata?.strategySettings

      return {
        success: true,
        data: {
          ...group,
          strategySettings
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取策略训练群组失败'
      }
    }
  }

  /**
   * 创建积分转移交易 (localStorage版本)
   */
  async createChipTransfer(
    groupId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
    transferType: 'win' | 'buy_in' | 'cash_out' = 'win'
  ): Promise<StrategyServiceResponse> {
    try {
      // 验证输入参数
      if (!fromUserId || !toUserId || !groupId) {
        return {
          success: false,
          error: '用户ID或群组ID不能为空'
        }
      }

      if (amount <= 0) {
        return {
          success: false,
          error: '转移金额必须大于0'
        }
      }

      const transactionId = generateId()
      const now = new Date().toISOString()

      const transaction: Transaction = {
        id: transactionId,
        fromUserId,
        toUserId,
        groupId,
        amount,
        description,
        type: 'transfer',
        status: 'completed',
        completedAt: now,
        createdAt: now,
        updatedAt: now,
        metadata: {
          tags: ['poker', 'chip_transfer', transferType],
          priority: 'normal',
          transferType
        }
      }

      LocalStorage.addTransaction(transaction)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建积分转移失败'
      }
    }
  }

  /**
   * 获取群组的所有策略训练交易记录 (localStorage版本)
   */
  async getStrategyTransactions(groupId: string): Promise<StrategyServiceResponse> {
    try {
      const allTransactions = LocalStorage.getTransactions()
      
      const groupTransactions = allTransactions
        .filter(t => t.groupId === groupId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return {
        success: true,
        data: groupTransactions
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取策略训练交易记录失败'
      }
    }
  }

  /**
   * 计算玩家当前积分状态 (localStorage版本)
   */
  async calculatePlayerChips(
    groupId: string,
    playerNames: Array<{
      id: string
      name: string
      isCreator: boolean
      userId?: string
    }>,
    currentUserId: string
  ): Promise<StrategyServiceResponse> {
    try {
      const transactionsResult = await this.getStrategyTransactions(groupId)
      
      if (!transactionsResult.success) {
        return transactionsResult
      }

      const transactions = transactionsResult.data as Transaction[]
      const systemUuid = '00000000-0000-0000-0000-000000000000'

      const playersData: StrategyPlayer[] = playerNames.map(player => {
        const playerId = player.isCreator ? currentUserId : (player.userId || player.id)
        
        // 计算该玩家的所有交易
        const playerTransactions = transactions.filter(t => 
          t.toUserId === playerId || t.fromUserId === playerId
        )

        let currentChips = 0
        let totalBought = 0
        let totalWon = 0
        let totalLost = 0
        let winIncome = 0
        let winExpense = 0

        playerTransactions.forEach(transaction => {
          const isSystemTransaction = transaction.type === 'system' && transaction.fromUserId === systemUuid
          const isReceivedTransaction = transaction.toUserId === playerId
          const isSentTransaction = transaction.fromUserId === playerId
          const transferType = transaction.metadata?.transferType

          if (isSystemTransaction) {
            // 真正的买入：从系统获得的初始积分
            currentChips += transaction.amount
            totalBought += transaction.amount
          } else if (isReceivedTransaction) {
            // 通过转移获得积分
            currentChips += transaction.amount
            totalWon += transaction.amount
            
            // 统计"win"和"loan"类型的收入到净损益，buy_in和cash_out不影响净损益
            if (transferType === 'win' || transferType === 'loan') {
              winIncome += transaction.amount
            }
          } else if (isSentTransaction) {
            // 通过转移失去积分
            currentChips -= transaction.amount
            totalLost += transaction.amount
            
            // 统计"win"和"loan"类型的支出到净损益，buy_in和cash_out不影响净损益
            if (transferType === 'win' || transferType === 'loan') {
              winExpense += transaction.amount
            }
          }
        })

        return {
          id: player.id,
          name: player.name,
          userId: playerId,
          currentChips,
          isCreator: player.isCreator || false,
          totalBought,
          totalWon,
          totalLost,
          netResult: winIncome - winExpense // 净损益 = 获得的积分 - 失去的积分（只计算win类型）
        }
      })

      return {
        success: true,
        data: playersData
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '计算玩家积分失败'
      }
    }
  }

  /**
   * 银行买入积分 (localStorage版本)
   */
  async createBankBuyIn(
    groupId: string,
    playerId: string,
    amount: number,
    description?: string
  ): Promise<StrategyServiceResponse> {
    try {
      const transactionId = generateId()
      const systemUuid = '00000000-0000-0000-0000-000000000000'
      const now = new Date().toISOString()

      const transaction: Transaction = {
        id: transactionId,
        fromUserId: systemUuid,
        toUserId: playerId,
        groupId,
        amount,
        description: description || `银行买入积分`,
        type: 'system',
        status: 'completed',
        completedAt: now,
        createdAt: now,
        updatedAt: now,
        metadata: {
          tags: ['poker', 'bank_buy_in'],
          priority: 'normal',
          transferType: 'buy_in'
        }
      }

      LocalStorage.addTransaction(transaction)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '银行买入失败'
      }
    }
  }

  /**
   * 基于净收益的智能结算分析 (localStorage版本)
   */
  async analyzeSmartSettlement(
    groupId: string,
    players: StrategyPlayer[]
  ): Promise<StrategyServiceResponse> {
    try {
      const transactionsResult = await this.getStrategyTransactions(groupId);
      
      if (!transactionsResult.success) {
        return transactionsResult;
      }

      const transactions = transactionsResult.data as Transaction[];
      const systemUuid = '00000000-0000-0000-0000-000000000000';
      
      // 分析每个玩家的结算情况
      const settlementAnalysis: SettlementAnalysis[] = players.map(player => {
        const playerId = player.userId || player.id;
        
        // 计算银行债务（银行买入的金额）
        const bankBuyInTransactions = transactions.filter(t => 
          t.fromUserId === systemUuid && 
          t.toUserId === playerId &&
          t.metadata?.transferType === 'buy_in'
        );
        const bankDebt = bankBuyInTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        // 在新的逻辑中，loan已经包含在netResult中，不需要单独计算借贷净额
        const loanReceivable = 0; // loan已包含在netResult中
        const loanPayable = 0;    // loan已包含在netResult中  
        const loanBalance = 0;    // loan已包含在netResult中
        
        // 最终现金流计算
        const gameProfit = player.netResult; // 游戏净收益（包含win和loan类型交易）
        const finalCashFlow = gameProfit - bankDebt; // 简化：净收益减去银行债务
        
        return {
          playerId: player.id,
          playerName: player.name,
          initialChips: player.totalBought,
          currentChips: player.currentChips,
          netResult: player.netResult,
          gameProfit,
          bankDebt,
          loanBalance,
          loanReceivable,
          loanPayable,
          finalCashFlow,
          settlementType: finalCashFlow >= 0 ? 'receive' : 'pay'
        };
      });

      // 生成优化转账方案
      const optimizedTransfers = this.generateOptimizedTransfers(settlementAnalysis);
      
      // 生成银行还款列表
      const bankRepayments = settlementAnalysis
        .filter(s => s.bankDebt > 0)
        .map(s => ({
          playerName: s.playerName,
          playerId: s.playerId,
          amount: s.bankDebt
        }));

      const settlementPlan: SettlementPlan = {
        summary: {
          totalReceivers: settlementAnalysis.filter(s => s.finalCashFlow > 0).length,
          totalPayers: settlementAnalysis.filter(s => s.finalCashFlow < 0).length,
          totalAmount: settlementAnalysis.reduce((sum, s) => sum + Math.abs(s.finalCashFlow), 0) / 2,
          transferCount: optimizedTransfers.length
        },
        players: settlementAnalysis,
        optimizedTransfers,
        bankRepayments
      };

      return {
        success: true,
        data: settlementPlan
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '智能结算分析失败'
      };
    }
  }

  /**
   * 生成优化的转账方案（最小化转账次数）
   */
  private generateOptimizedTransfers(settlements: SettlementAnalysis[]): OptimizedTransfer[] {
    const receivers = settlements.filter(s => s.finalCashFlow > 0).map(s => ({
      ...s,
      remaining: s.finalCashFlow
    }));
    
    const payers = settlements.filter(s => s.finalCashFlow < 0).map(s => ({
      ...s,
      remaining: Math.abs(s.finalCashFlow)
    }));

    const transfers: OptimizedTransfer[] = [];
    
    // 使用贪心算法匹配付款人和收款人
    for (const payer of payers) {
      let payerRemaining = payer.remaining;
      
      for (const receiver of receivers) {
        if (payerRemaining <= 0 || receiver.remaining <= 0) continue;
        
        const transferAmount = Math.min(payerRemaining, receiver.remaining);
        
        if (transferAmount > 0) {
          transfers.push({
            from: payer.playerId,
            fromName: payer.playerName,
            to: receiver.playerId,
            toName: receiver.playerName,
            amount: transferAmount,
            reason: `游戏结算 - ${payer.playerName}支付给${receiver.playerName}`,
            type: 'player_to_player'
          });
          
          payerRemaining -= transferAmount;
          receiver.remaining -= transferAmount;
        }
      }
    }

    return transfers;
  }

  /**
   * 结束策略训练 (localStorage版本)
   */
  async finishStrategyGame(groupId: string): Promise<StrategyServiceResponse> {
    try {
      // 获取当前群组
      const groups = LocalStorage.getGroups()
      const groupIndex = groups.findIndex(g => g.id === groupId)
      
      if (groupIndex === -1) {
        return { success: false, error: '群组不存在' }
      }

      const group = groups[groupIndex] as any
      const strategySettings = group.metadata?.strategySettings

      if (strategySettings) {
        // 更新游戏状态
        const updatedSettings = {
          ...strategySettings,
          gameStatus: 'finished' as const
        }

        group.metadata.strategySettings = updatedSettings
      }

      // 更新群组状态为已归档
      group.status = 'archived'
      group.isActive = false
      group.updatedAt = new Date().toISOString()

      // 保存更新后的群组
      groups[groupIndex] = group
      LocalStorage.setGroups(groups)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '结束策略训练失败'
      }
    }
  }
}

export const localStrategyService = new LocalStrategyService()