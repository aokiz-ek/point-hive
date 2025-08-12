import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { groupService } from '@/lib/services';
import { useAuthStore } from './auth-store';
import type { 
  Group, 
  GroupMember, 
  GroupActivity, 
  GroupStats, 
  CreateGroupData, 
  JoinGroupData,
  UpdateGroupData 
} from '@/lib/types';

interface GroupStore {
  // State
  groups: Group[];
  activeGroup: Group | null;
  members: GroupMember[];
  activities: GroupActivity[];
  stats: GroupStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchGroups: () => Promise<void>;
  fetchGroupById: (groupId: string) => Promise<void>;
  createGroup: (groupData: CreateGroupData) => Promise<void>;
  updateGroup: (groupId: string, data: UpdateGroupData) => Promise<void>;
  joinGroup: (inviteCode: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  setActiveGroup: (groupId: string | null) => void;
  fetchGroupMembers: (groupId: string) => Promise<void>;
  fetchGroupActivities: (groupId: string) => Promise<void>;
  fetchGroupStats: (groupId: string) => Promise<void>;
  updateMemberRole: (groupId: string, userId: string, role: string) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useGroupStore = create<GroupStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    groups: [],
    activeGroup: null,
    members: [],
    activities: [],
    stats: null,
    loading: false,
    error: null,

    // Actions
    fetchGroups: async () => {
      set({ loading: true, error: null });
      
      try {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('用户未登录');
        }

        const result = await groupService.getUserGroups(user.id);
        
        if (result.success && result.data) {
          set({ groups: result.data as Group[], loading: false });
        } else {
          throw new Error(result.error || '获取群组列表失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '获取群组列表失败',
          loading: false 
        });
      }
    },

    fetchGroupById: async (groupId: string) => {
      set({ loading: true, error: null });
      
      try {
        const result = await groupService.getGroupById(groupId);
        
        if (result.success && result.data) {
          set({ activeGroup: result.data as Group, loading: false });
        } else {
          throw new Error(result.error || '获取群组详情失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '获取群组详情失败',
          loading: false 
        });
      }
    },

    createGroup: async (groupData: CreateGroupData) => {
      set({ loading: true, error: null });
      
      try {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('用户未登录');
        }

        const result = await groupService.createGroup(groupData, user.id);
        
        if (result.success && result.data) {
          const newGroup = result.data as Group;
          const { groups } = get();
          
          set({ 
            groups: [newGroup, ...groups], 
            activeGroup: newGroup,
            loading: false 
          });
        } else {
          throw new Error(result.error || '创建群组失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '创建群组失败',
          loading: false 
        });
      }
    },

    updateGroup: async (groupId: string, data: UpdateGroupData) => {
      set({ loading: true, error: null });
      
      try {
        const result = await groupService.updateGroup(groupId, data);
        
        if (result.success && result.data) {
          const updatedGroup = result.data as Group;
          const { groups, activeGroup } = get();
          
          const updatedGroups = groups.map(group => 
            group.id === groupId ? updatedGroup : group
          );
          
          const updatedActiveGroup = activeGroup?.id === groupId ? updatedGroup : activeGroup;
          
          set({ 
            groups: updatedGroups, 
            activeGroup: updatedActiveGroup,
            loading: false 
          });
        } else {
          throw new Error(result.error || '更新群组失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '更新群组失败',
          loading: false 
        });
      }
    },

    joinGroup: async (inviteCode: string) => {
      set({ loading: true, error: null });
      
      try {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('用户未登录');
        }

        const result = await groupService.joinGroup(inviteCode, user.id);
        
        if (result.success) {
          // 重新获取群组列表
          await get().fetchGroups();
          set({ loading: false });
        } else {
          throw new Error(result.error || '加入群组失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '加入群组失败',
          loading: false 
        });
      }
    },

    leaveGroup: async (groupId: string) => {
      set({ loading: true, error: null });
      
      try {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('用户未登录');
        }

        const result = await groupService.leaveGroup(groupId, user.id);
        
        if (result.success) {
          const { groups, activeGroup } = get();
          
          const updatedGroups = groups.filter(group => group.id !== groupId);
          const newActiveGroup = activeGroup?.id === groupId ? null : activeGroup;
          
          set({ 
            groups: updatedGroups,
            activeGroup: newActiveGroup,
            loading: false 
          });
        } else {
          throw new Error(result.error || '退出群组失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '退出群组失败',
          loading: false 
        });
      }
    },

    setActiveGroup: (groupId: string | null) => {
      if (!groupId) {
        set({ activeGroup: null });
        return;
      }
      
      const { groups } = get();
      const group = groups.find(g => g.id === groupId);
      set({ activeGroup: group || null });
    },

    fetchGroupMembers: async (groupId: string) => {
      set({ loading: true, error: null });
      
      try {
        const result = await groupService.getGroupMembers(groupId);
        
        if (result.success && result.data) {
          set({ members: result.data as GroupMember[], loading: false });
        } else {
          throw new Error(result.error || '获取成员列表失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '获取成员列表失败',
          loading: false 
        });
      }
    },

    fetchGroupActivities: async (groupId: string) => {
      // TODO: 实现获取群组活动记录
      set({ activities: [], loading: false });
    },

    fetchGroupStats: async (groupId: string) => {
      // TODO: 实现获取群组统计数据
      set({ stats: null, loading: false });
    },

    updateMemberRole: async (groupId: string, userId: string, role: string) => {
      set({ loading: true, error: null });
      
      try {
        const result = await groupService.updateMemberRole(groupId, userId, role);
        
        if (result.success) {
          // 重新获取成员列表
          await get().fetchGroupMembers(groupId);
          set({ loading: false });
        } else {
          throw new Error(result.error || '更新成员角色失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '更新成员角色失败',
          loading: false 
        });
      }
    },

    removeMember: async (groupId: string, userId: string) => {
      set({ loading: true, error: null });
      
      try {
        const result = await groupService.removeMember(groupId, userId);
        
        if (result.success) {
          // 重新获取成员列表
          await get().fetchGroupMembers(groupId);
          set({ loading: false });
        } else {
          throw new Error(result.error || '移除成员失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '移除成员失败',
          loading: false 
        });
      }
    },

    clearError: () => {
      set({ error: null });
    },

    reset: () => {
      set({
        groups: [],
        activeGroup: null,
        members: [],
        activities: [],
        stats: null,
        loading: false,
        error: null,
      });
    },
  }))
);