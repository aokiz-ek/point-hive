import { createClient } from '@/lib/supabase/client'
import { groupService } from './group-service'
import { transactionService } from './transaction-service'
import type { CreateGroupData, Transaction } from '@/lib/types'

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
  gameType: 'cash' | 'tournament'
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

export interface PokerGroup {
  id: string
  name: string
  description: string
  ownerId: string
  inviteCode: string
  pokerSettings: PokerGameSettings
  createdAt: string
  updatedAt: string
}

export interface PokerServiceResponse {
  success: boolean
  data?: any
  error?: string
}

class PokerService {
  private supabase = createClient()

  /**
   * 创建扑克群组
   */
  async createPokerGroup(
    ownerId: string,
    formData: {
      tableName: string
      initialChips: number
      smallBlind: number
      bigBlind: number
      maxPlayers: number
      gameType: 'cash' | 'tournament'
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
      // 1. 创建群组基础数据
      const groupData: CreateGroupData = {
        name: `🃏 ${formData.tableName}`,
        description: `DZ扑克 ${formData.gameType === 'cash' ? '现金桌' : '锦标赛'} - ${formData.smallBlind}/${formData.bigBlind} 盲注`,
        type: 'custom',
        maxMembers: formData.maxPlayers,
        initialPoints: formData.initialChips,
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
        }
      }

      // 使用现有的 groupService 创建群组
      const groupResult = await groupService.createGroup(groupData, ownerId)
      
      if (!groupResult.success || !groupResult.data) {
        return { success: false, error: groupResult.error || '创建群组失败' }
      }

      const group = groupResult.data as any

      // 2. 保存扑克专用设置到 groups 表的 metadata 字段
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
        sessionStartTime: new Date().toISOString(),
        gameStatus: 'active'
      }

      // 更新群组元数据
      await this.updatePokerSettings(group.id, pokerSettings)

      // 3. 为每个玩家创建初始筹码交易记录
      for (const player of players) {
        // 使用特殊的系统 UUID 或 NULL
        const systemUuid = '00000000-0000-0000-0000-000000000000'; // 特殊的系统 UUID
        
        await this.supabase
          .from('transactions')
          .insert({
            from_user_id: systemUuid,
            to_user_id: player.isCreator ? ownerId : (player.userId || player.id),
            group_id: group.id,
            amount: formData.initialChips,
            description: `DZ扑克初始筹码 - 玩家: ${player.name}`,
            type: 'system',
            status: 'completed',
            completed_at: new Date().toISOString(),
            metadata: {
              tags: ['poker', 'initial_chips', formData.gameType],
              priority: 'normal',
              playerName: player.name,
              isCreator: player.isCreator || false
            }
          })
      }

      return {
        success: true,
        data: {
          ...group,
          pokerSettings
        }
      }
    } catch (error) {
      console.error('创建扑克群组失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建扑克群组失败'
      }
    }
  }

  /**
   * 获取扑克群组详情
   */
  async getPokerGroup(groupId: string): Promise<PokerServiceResponse> {
    try {
      // 获取群组基础信息
      const groupResult = await groupService.getGroupById(groupId)
      
      if (!groupResult.success || !groupResult.data) {
        return { success: false, error: groupResult.error || '获取群组失败' }
      }

      const group = groupResult.data as any

      // 获取扑克专用设置
      const { data: groupData, error } = await this.supabase
        .from('groups')
        .select('metadata')
        .eq('id', groupId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      const pokerSettings = groupData?.metadata?.pokerSettings

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
        error: error instanceof Error ? error.message : '获取扑克群组失败'
      }
    }
  }

  /**
   * 更新扑克游戏设置
   */
  async updatePokerSettings(groupId: string, settings: PokerGameSettings): Promise<PokerServiceResponse> {
    try {
      const { error } = await this.supabase
        .from('groups')
        .update({
          metadata: {
            pokerSettings: settings
          }
        })
        .eq('id', groupId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新扑克设置失败'
      }
    }
  }

  /**
   * 创建筹码转移交易
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

      // 直接调用 Supabase 插入交易
      const { error } = await this.supabase
        .from('transactions')
        .insert({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          group_id: groupId,
          amount,
          description,
          type: 'transfer',
          status: 'completed',
          completed_at: new Date().toISOString(),
          metadata: {
            tags: ['poker', 'chip_transfer', transferType],
            priority: 'normal',
            transferType
          }
        })

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建筹码转移失败'
      }
    }
  }

  /**
   * 获取群组的所有扑克交易记录
   */
  async getPokerTransactions(groupId: string): Promise<PokerServiceResponse> {
    try {
      // 直接查询该群组的所有交易，而不使用 transactionService 避免用户ID问题
      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message }
      }

      // 转换数据格式
      const transactions: Transaction[] = data.map(item => ({
        id: item.id,
        fromUserId: item.from_user_id,
        toUserId: item.to_user_id,
        groupId: item.group_id,
        amount: item.amount,
        description: item.description || '',
        status: item.status,
        type: item.type,
        dueDate: item.due_date,
        completedAt: item.completed_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        metadata: item.metadata || {}
      }))

      return {
        success: true,
        data: transactions
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取扑克交易记录失败'
      }
    }
  }

  /**
   * 计算玩家当前筹码状态
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
            // 真正的买入：从系统获得的初始筹码
            currentChips += transaction.amount
            totalBought += transaction.amount
          } else if (isReceivedTransaction) {
            // 通过转移获得筹码
            currentChips += transaction.amount
            totalWon += transaction.amount
            
            // 只统计"win"类型的收入到净利润
            if (transferType === 'win') {
              winIncome += transaction.amount
            }
          } else if (isSentTransaction) {
            // 通过转移失去筹码
            currentChips -= transaction.amount
            totalLost += transaction.amount
            
            // 只统计"win"类型的支出到净利润
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
          netResult: winIncome - winExpense // 净利润 = 赢得的筹码 - 输掉的筹码（只计算win类型）
        }
      })

      return {
        success: true,
        data: playersData
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '计算玩家筹码失败'
      }
    }
  }

  /**
   * 结束扑克游戏
   */
  async finishPokerGame(groupId: string): Promise<PokerServiceResponse> {
    try {
      // 获取当前设置
      const groupResult = await this.getPokerGroup(groupId)
      if (!groupResult.success) {
        return groupResult
      }

      const group = groupResult.data
      const pokerSettings = group.pokerSettings

      if (pokerSettings) {
        // 更新游戏状态
        const updatedSettings = {
          ...pokerSettings,
          gameStatus: 'finished' as const
        }

        await this.updatePokerSettings(groupId, updatedSettings)
      }

      // 更新群组状态为已归档
      await this.supabase
        .from('groups')
        .update({ is_active: false })
        .eq('id', groupId)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '结束扑克游戏失败'
      }
    }
  }

  /**
   * 获取预设扑克玩家列表
   */
  async getPresetPlayers(): Promise<PokerServiceResponse> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('id, username, full_name, credit_score')
        .gte('id', '10000000-0000-0000-0000-000000000000')
        .lt('id', '10000001-0000-0000-0000-000000000000')
        .order('username')

      if (error) {
        return { success: false, error: error.message }
      }

      const presetPlayers = data.map(user => ({
        id: user.id,
        name: user.username,
        fullName: user.full_name,
        creditScore: user.credit_score,
        isCreator: false,
        userId: user.id
      }))

      return {
        success: true,
        data: presetPlayers
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取预设玩家失败'
      }
    }
  }

  /**
   * 获取扑克游戏统计数据
   */
  async getPokerStats(groupId: string): Promise<PokerServiceResponse> {
    try {
      const transactionsResult = await this.getPokerTransactions(groupId)
      
      if (!transactionsResult.success) {
        return transactionsResult
      }

      const transactions = transactionsResult.data as Transaction[]
      
      const stats = {
        totalTransactions: transactions.length,
        systemTransactions: transactions.filter(t => t.type === 'system').length,
        transferTransactions: transactions.filter(t => t.type === 'transfer').length,
        totalChips: transactions
          .filter(t => t.type === 'system')
          .reduce((sum, t) => sum + t.amount, 0),
        totalTransferred: transactions
          .filter(t => t.type === 'transfer')
          .reduce((sum, t) => sum + t.amount, 0)
      }

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取扑克统计失败'
      }
    }
  }
}

export const pokerService = new PokerService()