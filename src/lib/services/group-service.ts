import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import type { Group, CreateGroupData, GroupMember, UpdateGroupData } from '@/lib/types'

export interface GroupServiceResponse {
  success: boolean
  data?: Group | Group[] | GroupMember[]
  error?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

class GroupService {
  private supabase = createClient()

  async getUserGroups(userId: string): Promise<GroupServiceResponse> {
    try {
      const { data, error, count } = await this.supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          joined_at,
          points_balance,
          groups!inner(
            id,
            name,
            description,
            group_type,
            owner_id,
            max_members,
            current_members,
            invite_code,
            rules,
            is_active,
            created_at,
            updated_at
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('groups.is_active', true)
        .order('joined_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message }
      }

      const groups: Group[] = data.map(item => ({
        id: item.groups.id,
        name: item.groups.name,
        description: item.groups.description || '',
        type: item.groups.group_type,
        ownerId: item.groups.owner_id,
        maxMembers: item.groups.max_members,
        currentMembers: item.groups.current_members,
        inviteCode: item.groups.invite_code,
        rules: item.groups.rules,
        isActive: item.groups.is_active,
        createdAt: item.groups.created_at,
        updatedAt: item.groups.updated_at,
        members: [], // 将通过单独的查询获取
        userRole: item.role,
        joinedAt: item.joined_at,
        pointsBalance: item.points_balance,
      }))

      return { 
        success: true, 
        data: groups,
        meta: { total: count || 0 }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '获取群组失败' 
      }
    }
  }

  async getGroupById(groupId: string): Promise<GroupServiceResponse> {
    try {
      const { data, error } = await this.supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .eq('is_active', true)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      // 获取群组成员
      const { data: members, error: membersError } = await this.supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          points_balance,
          users!inner(
            id,
            username,
            full_name,
            avatar_url,
            credit_score,
            balance,
            is_online
          )
        `)
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true })

      if (membersError) {
        return { success: false, error: membersError.message }
      }

      const groupMembers: GroupMember[] = members.map(member => ({
        id: member.id,
        userId: member.user_id,
        groupId: groupId,
        role: member.role,
        joinedAt: member.joined_at,
        pointsBalance: member.points_balance,
        user: {
          id: member.users.id,
          username: member.users.username,
          fullName: member.users.full_name,
          avatarUrl: member.users.avatar_url,
          creditScore: member.users.credit_score,
          balance: member.users.balance,
          isOnline: member.users.is_online,
        }
      }))

      const group: Group = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        type: data.group_type,
        ownerId: data.owner_id,
        maxMembers: data.max_members,
        currentMembers: data.current_members,
        inviteCode: data.invite_code,
        rules: data.rules,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        members: groupMembers,
      }

      return { success: true, data: group }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '获取群组详情失败' 
      }
    }
  }

  async createGroup(groupData: CreateGroupData, ownerId: string): Promise<GroupServiceResponse> {
    try {
      // 生成邀请码
      const { data: inviteCodeData, error: inviteError } = await this.supabase
        .rpc('generate_invite_code')

      if (inviteError) {
        return { success: false, error: inviteError.message }
      }

      // 创建群组
      const { data: group, error: groupError } = await this.supabase
        .from('groups')
        .insert({
          name: groupData.name,
          description: groupData.description,
          group_type: groupData.type,
          owner_id: ownerId,
          max_members: groupData.maxMembers,
          current_members: 1,
          invite_code: inviteCodeData,
          rules: groupData.rules,
        })
        .select()
        .single()

      if (groupError) {
        return { success: false, error: groupError.message }
      }

      // 添加创建者为群组成员
      const { error: memberError } = await this.supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: ownerId,
          role: 'owner',
          points_balance: groupData.initialPoints || 0,
        })

      if (memberError) {
        // 如果添加成员失败，删除群组
        await this.supabase.from('groups').delete().eq('id', group.id)
        return { success: false, error: memberError.message }
      }

      const newGroup: Group = {
        id: group.id,
        name: group.name,
        description: group.description || '',
        type: group.group_type,
        ownerId: group.owner_id,
        maxMembers: group.max_members,
        currentMembers: group.current_members,
        inviteCode: group.invite_code,
        rules: group.rules,
        isActive: group.is_active,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
        members: [], // 新创建的群组暂时没有其他成员
        userRole: 'owner',
        joinedAt: new Date().toISOString(),
        pointsBalance: groupData.initialPoints || 0,
      }

      return { success: true, data: newGroup }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '创建群组失败' 
      }
    }
  }

  async updateGroup(groupId: string, groupData: UpdateGroupData): Promise<GroupServiceResponse> {
    try {
      const { data, error } = await this.supabase
        .from('groups')
        .update({
          name: groupData.name,
          description: groupData.description,
          max_members: groupData.maxMembers,
          rules: groupData.rules,
        })
        .eq('id', groupId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      const group: Group = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        type: data.group_type,
        ownerId: data.owner_id,
        maxMembers: data.max_members,
        currentMembers: data.current_members,
        inviteCode: data.invite_code,
        rules: data.rules,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      return { success: true, data: group }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '更新群组失败' 
      }
    }
  }

  async deleteGroup(groupId: string): Promise<GroupServiceResponse> {
    try {
      const { error } = await this.supabase
        .from('groups')
        .update({ is_active: false })
        .eq('id', groupId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '删除群组失败' 
      }
    }
  }

  async joinGroup(inviteCode: string, userId: string): Promise<GroupServiceResponse> {
    try {
      // 查找群组
      const { data: group, error: groupError } = await this.supabase
        .from('groups')
        .select('*')
        .eq('invite_code', inviteCode)
        .eq('is_active', true)
        .single()

      if (groupError) {
        return { success: false, error: '邀请码无效' }
      }

      // 检查是否已经是成员
      const { data: existingMember } = await this.supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (existingMember) {
        return { success: false, error: '您已经是该群组成员' }
      }

      // 检查群组人数是否已满
      if (group.current_members >= group.max_members) {
        return { success: false, error: '群组人数已满' }
      }

      // 添加成员
      const { error: memberError } = await this.supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: userId,
          role: 'member',
        })

      if (memberError) {
        return { success: false, error: memberError.message }
      }

      // 更新群组人数
      await this.supabase
        .from('groups')
        .update({ current_members: group.current_members + 1 })
        .eq('id', group.id)

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '加入群组失败' 
      }
    }
  }

  async leaveGroup(groupId: string, userId: string): Promise<GroupServiceResponse> {
    try {
      // 检查是否是群组拥有者
      const { data: group } = await this.supabase
        .from('groups')
        .select('owner_id')
        .eq('id', groupId)
        .single()

      if (group?.owner_id === userId) {
        return { success: false, error: '群组拥有者不能退出群组' }
      }

      // 移除成员
      const { error } = await this.supabase
        .from('group_members')
        .update({ is_active: false })
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      // 更新群组人数
      await this.supabase.rpc('decrement_group_members', { group_id: groupId })

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '退出群组失败' 
      }
    }
  }

  async getGroupMembers(groupId: string): Promise<GroupServiceResponse> {
    try {
      const { data, error } = await this.supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          points_balance,
          users!inner(
            id,
            username,
            full_name,
            avatar_url,
            credit_score,
            balance,
            is_online
          )
        `)
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true })

      if (error) {
        return { success: false, error: error.message }
      }

      const members: GroupMember[] = data.map(member => ({
        id: member.id,
        userId: member.user_id,
        groupId: groupId,
        role: member.role,
        joinedAt: member.joined_at,
        pointsBalance: member.points_balance,
        user: {
          id: member.users.id,
          username: member.users.username,
          fullName: member.users.full_name,
          avatarUrl: member.users.avatar_url,
          creditScore: member.users.credit_score,
          balance: member.users.balance,
          isOnline: member.users.is_online,
        }
      }))

      return { success: true, data: members }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '获取群组成员失败' 
      }
    }
  }

  async updateMemberRole(groupId: string, userId: string, role: string): Promise<GroupServiceResponse> {
    try {
      const { error } = await this.supabase
        .from('group_members')
        .update({ role })
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '更新成员角色失败' 
      }
    }
  }

  async removeMember(groupId: string, userId: string): Promise<GroupServiceResponse> {
    try {
      const { error } = await this.supabase
        .from('group_members')
        .update({ is_active: false })
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      // 更新群组人数
      await this.supabase.rpc('decrement_group_members', { group_id: groupId })

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '移除成员失败' 
      }
    }
  }
}

export const groupService = new GroupService()