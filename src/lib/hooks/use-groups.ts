import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGroupStore } from '@/lib/stores';
import { queryKeys, queryOptions } from '@/lib/providers/react-query-provider';
import type { CreateGroupData, JoinGroupData, UpdateGroupData } from '@/lib/types';

export function useGroups() {
  const { groups, loading, error, fetchGroups } = useGroupStore();

  const query = useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: async () => {
      await fetchGroups();
      return useGroupStore.getState().groups;
    },
    ...queryOptions.shortCache,
  });

  return {
    groups,
    loading: loading || query.isLoading,
    error: error || (query.error as Error)?.message,
    refetch: query.refetch,
  };
}

export function useGroup(groupId?: string) {
  const { activeGroup, loading, error, fetchGroupById } = useGroupStore();

  const query = useQuery({
    queryKey: queryKeys.groups.detail(groupId!),
    queryFn: () => fetchGroupById(groupId!),
    enabled: !!groupId,
    ...queryOptions.shortCache,
  });

  return {
    group: activeGroup,
    loading: loading || query.isLoading,
    error: error || (query.error as Error)?.message,
    refetch: query.refetch,
  };
}

export function useGroupMembers(groupId?: string) {
  const { members, loading, error, fetchGroupMembers } = useGroupStore();

  const query = useQuery({
    queryKey: queryKeys.groups.members(groupId!),
    queryFn: () => fetchGroupMembers(groupId!),
    enabled: !!groupId,
    ...queryOptions.shortCache,
  });

  return {
    members,
    loading: loading || query.isLoading,
    error: error || (query.error as Error)?.message,
    refetch: query.refetch,
  };
}

export function useGroupStats(groupId?: string) {
  const { stats, loading, error, fetchGroupStats } = useGroupStore();

  const query = useQuery({
    queryKey: queryKeys.groups.stats(groupId!),
    queryFn: () => fetchGroupStats(groupId!),
    enabled: !!groupId,
    ...queryOptions.longCache,
  });

  return {
    stats,
    loading: loading || query.isLoading,
    error: error || (query.error as Error)?.message,
    refetch: query.refetch,
  };
}

export function useGroupMutations() {
  const queryClient = useQueryClient();
  const {
    createGroup,
    updateGroup,
    joinGroup,
    leaveGroup,
    updateMemberRole,
    removeMember,
  } = useGroupStore();

  const createGroupMutation = useMutation({
    mutationFn: (data: CreateGroupData) => createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all() });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: UpdateGroupData }) =>
      updateGroup(groupId, data),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: (data: JoinGroupData) => joinGroup(data.inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all() });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: (groupId: string) => leaveGroup(groupId),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ groupId, userId, role }: { groupId: string; userId: string; role: string }) =>
      updateMemberRole(groupId, userId, role),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.members(groupId) });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      removeMember(groupId, userId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.members(groupId) });
    },
  });

  return {
    createGroupMutation,
    updateGroupMutation,
    joinGroupMutation,
    leaveGroupMutation,
    updateMemberRoleMutation,
    removeMemberMutation,
  };
}