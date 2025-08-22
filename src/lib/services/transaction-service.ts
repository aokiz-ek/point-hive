import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import type { Transaction, CreateTransactionData, UpdateTransactionData, PendingRequest } from '@/lib/types'

export interface TransactionServiceResponse {
  success: boolean
  data?: Transaction | Transaction[] | PendingRequest[] | any
  error?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

class TransactionService {
  private supabase = createClient()

  async getUserTransactions(userId: string, options?: {
    page?: number
    limit?: number
    type?: 'all' | 'sent' | 'received'
    status?: 'all' | 'pending' | 'completed' | 'rejected'
    groupId?: string
  }): Promise<TransactionServiceResponse> {
    try {
      let query = this.supabase
        .from('transactions')
        .select(`
          *,
          from_user:users!transactions_from_user_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            credit_score
          ),
          to_user:users!transactions_to_user_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            credit_score
          ),
          groups!transactions_group_id_fkey(
            id,
            name,
            invite_code
          )
        `, { count: 'exact' })

      // 根据类型过滤
      if (options?.type === 'sent') {
        query = query.eq('from_user_id', userId)
      } else if (options?.type === 'received') {
        query = query.eq('to_user_id', userId)
      } else {
        query = query.or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      }

      // 根据状态过滤
      if (options?.status && options.status !== 'all') {
        query = query.eq('status', options.status)
      }

      // 根据群组过滤
      if (options?.groupId) {
        query = query.eq('group_id', options.groupId)
      }

      // 分页
      const page = options?.page || 1
      const limit = options?.limit || 20
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        return { success: false, error: error.message }
      }

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
        metadata: item.metadata || {},
      }))

      return { 
        success: true, 
        data: transactions,
        meta: { 
          total: count || 0,
          page,
          limit 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '获取交易记录失败' 
      }
    }
  }

  async createTransaction(transactionData: CreateTransactionData): Promise<TransactionServiceResponse> {
    try {
      // 检查发送者余额
      const { data: fromUser, error: fromUserError } = await this.supabase
        .from('users')
        .select('balance')
        .eq('id', transactionData.fromUserId)
        .single()

      if (fromUserError || !fromUser) {
        return { success: false, error: '发送者信息不存在' }
      }

      if (fromUser.balance < transactionData.amount) {
        return { success: false, error: '余额不足' }
      }

      // 创建交易记录
      const { data: transaction, error } = await this.supabase
        .from('transactions')
        .insert({
          from_user_id: transactionData.fromUserId,
          to_user_id: transactionData.toUserId,
          group_id: transactionData.groupId,
          amount: transactionData.amount,
          description: transactionData.description,
          status: 'pending',
          type: transactionData.type || 'transfer',
          due_date: transactionData.dueDate,
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      // 如果是立即完成的交易（比如归还），直接更新余额
      if (transactionData.type === 'return' || transactionData.immediate) {
        await this.completeTransaction(transaction.id)
      }

      // 创建通知
      await this.createTransactionNotification(transaction.id, transactionData.toUserId, 'transfer_request')

      const newTransaction: Transaction = {
        id: transaction.id,
        fromUserId: transaction.from_user_id,
        toUserId: transaction.to_user_id,
        groupId: transaction.group_id,
        amount: transaction.amount,
        description: transaction.description || '',
        status: transaction.status,
        type: transaction.type,
        dueDate: transaction.due_date,
        completedAt: transaction.completed_at,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
        metadata: transaction.metadata || {},
      }

      return { success: true, data: newTransaction }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '创建交易失败' 
      }
    }
  }

  async updateTransaction(transactionId: string, updateData: UpdateTransactionData): Promise<TransactionServiceResponse> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      const transaction: Transaction = {
        id: data.id,
        fromUserId: data.from_user_id,
        toUserId: data.to_user_id,
        groupId: data.group_id,
        amount: data.amount,
        description: data.description || '',
        status: data.status,
        type: data.type,
        dueDate: data.due_date,
        completedAt: data.completed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        metadata: data.metadata || {},
      }

      return { success: true, data: transaction }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '更新交易失败' 
      }
    }
  }

  async completeTransaction(transactionId: string): Promise<TransactionServiceResponse> {
    try {
      // 获取交易详情
      const { data: transaction, error: transactionError } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (transactionError || !transaction) {
        return { success: false, error: '交易不存在' }
      }

      // 开始事务
      const { error: updateError } = await this.supabase.rpc('complete_transaction', {
        p_transaction_id: transactionId,
        p_from_user_id: transaction.from_user_id,
        p_to_user_id: transaction.to_user_id,
        p_amount: transaction.amount
      })

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      // 创建通知
      await this.createTransactionNotification(transactionId, transaction.from_user_id, 'transfer_completed')

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '完成交易失败' 
      }
    }
  }

  async rejectTransaction(transactionId: string, reason?: string): Promise<TransactionServiceResponse> {
    try {
      const { error } = await this.supabase
        .from('transactions')
        .update({ 
          status: 'rejected',
          completed_at: new Date().toISOString()
        })
        .eq('id', transactionId)

      if (error) {
        return { success: false, error: error.message }
      }

      // 获取交易详情以创建通知
      const { data: transaction } = await this.supabase
        .from('transactions')
        .select('from_user_id')
        .eq('id', transactionId)
        .single()

      if (transaction) {
        await this.createTransactionNotification(transactionId, transaction.from_user_id, 'transfer_rejected')
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '拒绝交易失败' 
      }
    }
  }

  async cancelTransaction(transactionId: string): Promise<TransactionServiceResponse> {
    try {
      const { error } = await this.supabase
        .from('transactions')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', transactionId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '取消交易失败' 
      }
    }
  }

  async getPendingRequests(userId: string): Promise<TransactionServiceResponse> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select(`
          *,
          from_user:users!transactions_from_user_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            credit_score,
            balance
          ),
          groups!transactions_group_id_fkey(
            id,
            name,
            invite_code
          )
        `)
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message }
      }

      const pendingRequests: PendingRequest[] = data.map(item => ({
        id: item.id,
        transactionId: item.id,
        fromUserId: item.from_user_id,
        toUserId: item.to_user_id,
        amount: item.amount,
        description: item.description || '',
        dueDate: item.due_date,
        expiresAt: item.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        status: 'waiting' as const,
        reminderCount: 0,
        createdAt: item.created_at,
      }))

      return { success: true, data: pendingRequests }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '获取待处理请求失败' 
      }
    }
  }

  async getTransactionStats(userId: string, groupId?: string): Promise<TransactionServiceResponse> {
    try {
      let query = this.supabase
        .from('transactions')
        .select('amount, status, type, created_at, from_user_id, to_user_id', { count: 'exact' })

      if (groupId) {
        query = query.eq('group_id', groupId)
      }

      query = query.or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)

      const { data, error } = await query

      if (error) {
        return { success: false, error: error.message }
      }

      const stats = {
        totalTransactions: data.length,
        totalAmount: data.reduce((sum, t) => sum + t.amount, 0),
        completedTransactions: data.filter(t => t.status === 'completed').length,
        pendingTransactions: data.filter(t => t.status === 'pending').length,
        totalSent: data.filter(t => t.from_user_id === userId).reduce((sum, t) => sum + t.amount, 0),
        totalReceived: data.filter(t => t.to_user_id === userId).reduce((sum, t) => sum + t.amount, 0),
      }

      return { success: true, data: stats }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '获取交易统计失败' 
      }
    }
  }

  private async createTransactionNotification(transactionId: string, userId: string, type: string): Promise<void> {
    try {
      const { data: transaction } = await this.supabase
        .from('transactions')
        .select(`
          amount,
          from_user:users!transactions_from_user_id_fkey(username),
          to_user:users!transactions_to_user_id_fkey(username)
        `)
        .eq('id', transactionId)
        .single()

      if (!transaction) return

      let title = ''
      let message = ''

      switch (type) {
        case 'transfer_request':
          title = '新的积分转移请求'
          message = `${(transaction.from_user as any)?.username || '用户'} 向您请求转移 ${transaction.amount} 积分`
          break
        case 'transfer_completed':
          title = '积分转移已完成'
          message = `您向 ${(transaction.to_user as any)?.username || '用户'} 转移的 ${transaction.amount} 积分已完成`
          break
        case 'transfer_rejected':
          title = '积分转移被拒绝'
          message = `您向 ${(transaction.to_user as any)?.username || '用户'} 的积分转移请求被拒绝`
          break
      }

      await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data: { transactionId }
        })
    } catch (error) {
      console.error('创建交易通知失败:', error)
    }
  }
}

export const transactionService = new TransactionService()