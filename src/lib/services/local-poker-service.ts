import { LocalStorage, generateId, formatDateTime } from '@/lib/utils/local-storage'
import type { Group, Transaction } from '@/lib/types'

export interface PokerPlayer {
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

export interface PokerGameSettings {
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

export interface PokerServiceResponse {
  success: boolean
  data?: any
  error?: string
}

class LocalPokerService {
  /**
   * 创建游戏群组 (localStorage版本)
   */
  async createPokerGroup(
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
  ): Promise<PokerServiceResponse> {
    try {
      // 生成群组ID
      const groupId = generateId()
      const inviteCode = Math.random().toString(36).substr(2, 8).toUpperCase()
      const now = new Date().toISOString()

      // 1. 创建群组基础数据
      const group: Group = {
        id: groupId,
        name: `🎯 ${formData.tableName}`,
        description: `积分游戏 ${formData.gameType === 'points' ? '积分模式' : '锦标赛'} - ${formData.smallBlind}/${formData.bigBlind} 盲注`,
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

      // 2. 创建Poker专用设置
      const pokerSettings: PokerGameSettings = {
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

      // 将poker设置存储到group metadata中
      const groupWithMetadata = {
        ...group,
        metadata: {
          pokerSettings
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
          description: `积分游戏初始积分 - 玩家: ${player.name}`,
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
          pokerSettings
        }
      }
    } catch (error) {
      console.error('创建Poker群组失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建Poker群组失败'
      }
    }
  }

  /**
   * 获取Poker群组详情 (localStorage版本)
   */
  async getPokerGroup(groupId: string): Promise<PokerServiceResponse> {
    try {
      const groups = LocalStorage.getGroups()
      const group = groups.find(g => g.id === groupId)
      
      if (!group) {
        return { success: false, error: '群组不存在' }
      }

      const pokerSettings = (group as any).metadata?.pokerSettings

      return {
        success: true,
        data: {
          ...group,
          pokerSettings
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取Poker群组失败'
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
    transferType: 'win' | 'loan' = 'loan'
  ): Promise<PokerServiceResponse> {
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
   * 获取群组的所有Poker交易记录 (localStorage版本)
   */
  async getPokerTransactions(groupId: string): Promise<PokerServiceResponse> {
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
        error: error instanceof Error ? error.message : '获取Poker交易记录失败'
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
  ): Promise<PokerServiceResponse> {
    try {
      const transactionsResult = await this.getPokerTransactions(groupId)
      
      if (!transactionsResult.success) {
        return transactionsResult
      }

      const transactions = transactionsResult.data as Transaction[]
      const systemUuid = '00000000-0000-0000-0000-000000000000'

      const playersData: PokerPlayer[] = playerNames.map(player => {
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
            
            // 只统计"win"类型的收入到净损益
            if (transferType === 'win') {
              winIncome += transaction.amount
            }
          } else if (isSentTransaction) {
            // 通过转移失去积分
            currentChips -= transaction.amount
            totalLost += transaction.amount
            
            // 只统计"win"类型的支出到净损益
            if (transferType === 'win') {
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
          netResult: winIncome - winExpense // 净损益 = 赢得的积分 - 输掉的积分（只计算win类型）
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
   * 结束Poker游戏 (localStorage版本)
   */
  async finishPokerGame(groupId: string): Promise<PokerServiceResponse> {
    try {
      // 获取当前群组
      const groups = LocalStorage.getGroups()
      const groupIndex = groups.findIndex(g => g.id === groupId)
      
      if (groupIndex === -1) {
        return { success: false, error: '群组不存在' }
      }

      const group = groups[groupIndex] as any
      const pokerSettings = group.metadata?.pokerSettings

      if (pokerSettings) {
        // 更新游戏状态
        const updatedSettings = {
          ...pokerSettings,
          gameStatus: 'finished' as const
        }

        group.metadata.pokerSettings = updatedSettings
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
        error: error instanceof Error ? error.message : '结束Poker游戏失败'
      }
    }
  }
}

export const localPokerService = new LocalPokerService()