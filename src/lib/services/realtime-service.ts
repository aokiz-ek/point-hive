import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeEvent {
  type: 'transaction' | 'group' | 'user' | 'notification'
  action: 'created' | 'updated' | 'deleted'
  data: any
  timestamp: string
}

export interface RealtimeEventHandler {
  (event: RealtimeEvent): void
}

class RealtimeService {
  private supabase = createClient()
  private channels: Map<string, RealtimeChannel> = new Map()
  private eventHandlers: Map<string, RealtimeEventHandler[]> = new Map()

  // 监听用户相关变化
  subscribeToUserUpdates(userId: string, handler: RealtimeEventHandler) {
    const channelName = `user_updates_${userId}`
    
    if (this.channels.has(channelName)) {
      this.addHandler(channelName, handler)
      return
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          this.emitEvent(channelName, {
            type: 'user',
            action: payload.eventType as any,
            data: payload.new,
            timestamp: new Date().toISOString(),
          })
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    this.addHandler(channelName, handler)
  }

  // 监听群组相关变化
  subscribeToGroupUpdates(groupId: string, handler: RealtimeEventHandler) {
    const channelName = `group_updates_${groupId}`
    
    if (this.channels.has(channelName)) {
      this.addHandler(channelName, handler)
      return
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
          filter: `id=eq.${groupId}`,
        },
        (payload) => {
          this.emitEvent(channelName, {
            type: 'group',
            action: payload.eventType as any,
            data: payload.new,
            timestamp: new Date().toISOString(),
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          this.emitEvent(channelName, {
            type: 'group',
            action: payload.eventType as any,
            data: { ...payload.new, table: 'group_members' },
            timestamp: new Date().toISOString(),
          })
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    this.addHandler(channelName, handler)
  }

  // 监听交易相关变化
  subscribeToTransactionUpdates(userId: string, handler: RealtimeEventHandler) {
    const channelName = `transaction_updates_${userId}`
    
    if (this.channels.has(channelName)) {
      this.addHandler(channelName, handler)
      return
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `or=(from_user_id.eq.${userId},to_user_id.eq.${userId})`,
        },
        (payload) => {
          this.emitEvent(channelName, {
            type: 'transaction',
            action: payload.eventType as any,
            data: payload.new,
            timestamp: new Date().toISOString(),
          })
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    this.addHandler(channelName, handler)
  }

  // 监听通知
  subscribeToNotifications(userId: string, handler: RealtimeEventHandler) {
    const channelName = `notifications_${userId}`
    
    if (this.channels.has(channelName)) {
      this.addHandler(channelName, handler)
      return
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          this.emitEvent(channelName, {
            type: 'notification',
            action: 'created',
            data: payload.new,
            timestamp: new Date().toISOString(),
          })
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    this.addHandler(channelName, handler)
  }

  // 监听群组成员在线状态
  subscribeToGroupMemberStatus(groupId: string, handler: RealtimeEventHandler) {
    const channelName = `group_member_status_${groupId}`
    
    if (this.channels.has(channelName)) {
      this.addHandler(channelName, handler)
      return
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=in.(select user_id from group_members where group_id = '${groupId}' and is_active = true)`,
        },
        (payload) => {
          if (payload.new.is_online !== payload.old.is_online) {
            this.emitEvent(channelName, {
              type: 'user',
              action: 'updated',
              data: { 
                userId: payload.new.id,
                isOnline: payload.new.is_online,
                lastLogin: payload.new.last_login,
              },
              timestamp: new Date().toISOString(),
            })
          }
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    this.addHandler(channelName, handler)
  }

  // 广播消息到群组
  async broadcastToGroup(groupId: string, event: Omit<RealtimeEvent, 'timestamp'>) {
    const channelName = `group_broadcast_${groupId}`
    
    try {
      const channel = this.supabase.channel(channelName)
      await channel.send({
        type: 'broadcast',
        event: 'group_message',
        payload: {
          ...event,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error('广播消息失败:', error)
    }
  }

  // 监听群组广播
  subscribeToGroupBroadcast(groupId: string, handler: RealtimeEventHandler) {
    const channelName = `group_broadcast_${groupId}`
    
    if (this.channels.has(channelName)) {
      this.addHandler(channelName, handler)
      return
    }

    const channel = this.supabase
      .channel(channelName)
      .on('broadcast', { event: 'group_message' }, (payload) => {
        this.emitEvent(channelName, payload.payload)
      })
      .subscribe()

    this.channels.set(channelName, channel)
    this.addHandler(channelName, handler)
  }

  // 取消订阅
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      this.supabase.removeChannel(channel)
      this.channels.delete(channelName)
      this.eventHandlers.delete(channelName)
    }
  }

  // 取消所有订阅
  unsubscribeAll() {
    this.channels.forEach((channel, channelName) => {
      this.supabase.removeChannel(channel)
    })
    this.channels.clear()
    this.eventHandlers.clear()
  }

  // 添加事件处理器
  private addHandler(channelName: string, handler: RealtimeEventHandler) {
    if (!this.eventHandlers.has(channelName)) {
      this.eventHandlers.set(channelName, [])
    }
    this.eventHandlers.get(channelName)!.push(handler)
  }

  // 发射事件
  private emitEvent(channelName: string, event: RealtimeEvent) {
    const handlers = this.eventHandlers.get(channelName)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event)
        } catch (error) {
          console.error('实时事件处理器错误:', error)
        }
      })
    }
  }

  // 更新用户在线状态
  async updateUserOnlineStatus(userId: string, isOnline: boolean) {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ 
          is_online: isOnline,
          last_login: isOnline ? new Date().toISOString() : undefined,
        })
        .eq('id', userId)

      if (error) {
        console.error('更新在线状态失败:', error)
      }
    } catch (error) {
      console.error('更新在线状态失败:', error)
    }
  }

  // 发送交易请求通知
  async sendTransactionNotification(
    fromUserId: string,
    toUserId: string,
    transactionId: string,
    amount: number,
    message?: string
  ) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: toUserId,
          type: 'transfer_request',
          title: '新的积分转移请求',
          message: message || `向您请求转移 ${amount} 积分`,
          data: {
            transactionId,
            fromUserId,
            amount,
          },
        })

      if (error) {
        console.error('发送通知失败:', error)
      }
    } catch (error) {
      console.error('发送通知失败:', error)
    }
  }

  // 标记通知为已读
  async markNotificationAsRead(notificationId: string) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ 
          is_read: true,
          is_read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)

      if (error) {
        console.error('标记通知已读失败:', error)
      }
    } catch (error) {
      console.error('标记通知已读失败:', error)
    }
  }

  // 获取未读通知数量
  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('获取未读通知数量失败:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('获取未读通知数量失败:', error)
      return 0
    }
  }
}

export const realtimeService = new RealtimeService()

// React Hook 用于实时功能
export function useRealtime() {
  const subscribeToUserUpdates = (userId: string, handler: RealtimeEventHandler) => {
    return realtimeService.subscribeToUserUpdates(userId, handler)
  }

  const subscribeToGroupUpdates = (groupId: string, handler: RealtimeEventHandler) => {
    return realtimeService.subscribeToGroupUpdates(groupId, handler)
  }

  const subscribeToTransactionUpdates = (userId: string, handler: RealtimeEventHandler) => {
    return realtimeService.subscribeToTransactionUpdates(userId, handler)
  }

  const subscribeToNotifications = (userId: string, handler: RealtimeEventHandler) => {
    return realtimeService.subscribeToNotifications(userId, handler)
  }

  const subscribeToGroupMemberStatus = (groupId: string, handler: RealtimeEventHandler) => {
    return realtimeService.subscribeToGroupMemberStatus(groupId, handler)
  }

  const broadcastToGroup = (groupId: string, event: Omit<RealtimeEvent, 'timestamp'>) => {
    return realtimeService.broadcastToGroup(groupId, event)
  }

  const subscribeToGroupBroadcast = (groupId: string, handler: RealtimeEventHandler) => {
    return realtimeService.subscribeToGroupBroadcast(groupId, handler)
  }

  const unsubscribe = (channelName: string) => {
    return realtimeService.unsubscribe(channelName)
  }

  const unsubscribeAll = () => {
    return realtimeService.unsubscribeAll()
  }

  const updateUserOnlineStatus = (userId: string, isOnline: boolean) => {
    return realtimeService.updateUserOnlineStatus(userId, isOnline)
  }

  const sendTransactionNotification = (
    fromUserId: string,
    toUserId: string,
    transactionId: string,
    amount: number,
    message?: string
  ) => {
    return realtimeService.sendTransactionNotification(fromUserId, toUserId, transactionId, amount, message)
  }

  const markNotificationAsRead = (notificationId: string) => {
    return realtimeService.markNotificationAsRead(notificationId)
  }

  const getUnreadNotificationCount = (userId: string) => {
    return realtimeService.getUnreadNotificationCount(userId)
  }

  return {
    subscribeToUserUpdates,
    subscribeToGroupUpdates,
    subscribeToTransactionUpdates,
    subscribeToNotifications,
    subscribeToGroupMemberStatus,
    broadcastToGroup,
    subscribeToGroupBroadcast,
    unsubscribe,
    unsubscribeAll,
    updateUserOnlineStatus,
    sendTransactionNotification,
    markNotificationAsRead,
    getUnreadNotificationCount,
  }
}