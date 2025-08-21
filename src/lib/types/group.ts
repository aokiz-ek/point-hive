import type { User, UserRole } from './auth';

/**
 * 群组相关类型定义
 */

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  inviteCode: string;
  maxMembers: number;
  totalPoints: number;
  rules: GroupRules;
  settings: GroupSettings;
  status: GroupStatus;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional computed properties
  currentMembers?: number;
  isActive?: boolean;
  userRole?: UserRole;
  pointsBalance?: number;
  requireApproval?: boolean;
}

export interface GroupRules {
  maxTransferAmount: number;
  maxPendingAmount: number;
  defaultReturnPeriod: number;
  creditScoreThreshold: number;
  allowAnonymousTransfer: boolean;
  requireApproval: boolean;
  autoReminderEnabled: boolean;
  allowPartialReturn: boolean;
  dailyTransferLimit: number;
  memberJoinApproval: boolean;
}

export interface GroupSettings {
  autoAcceptTransfers: boolean;
  notificationSound: boolean;
  showMemberActivity: boolean;
  allowMemberInvite: boolean;
  requireVerifiedEmail: boolean;
  requireVerifiedPhone: boolean;
  enableCreditLimit: boolean;
  enableTimeLimit: boolean;
  pointsPerMember?: number;
}

export type GroupStatus = 'active' | 'inactive' | 'suspended' | 'archived';

export interface GroupMember {
  userId: string;
  user: User;
  role: UserRole;
  joinedAt: string;
  balance: number;
  totalTransferred: number;
  totalReceived: number;
  totalReturned: number;
  pendingAmount: number;
  isActive: boolean;
  lastActivity: string;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  inviterId: string;
  inviterName: string;
  inviteCode: string;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface GroupActivity {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  type: GroupActivityType;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type GroupActivityType = 
  | 'member_joined'
  | 'member_left'
  | 'member_promoted'
  | 'member_demoted'
  | 'points_transferred'
  | 'points_returned'
  | 'rules_updated'
  | 'settings_updated'
  | 'group_created'
  | 'group_archived';

export interface GroupStats {
  totalMembers: number;
  activeMembers: number;
  totalTransactions: number;
  totalPointsTransferred: number;
  averageBalance: number;
  topMembers: {
    mostActive: GroupMember[];
    highestBalance: GroupMember[];
    bestCreditScore: GroupMember[];
  };
  activityTrend: {
    date: string;
    transactionCount: number;
    pointsTransferred: number;
  }[];
}

export interface CreateGroupData {
  name: string;
  description?: string;
  maxMembers: number;
  initialPoints: number;
  rules: Partial<GroupRules>;
  isPublic?: boolean;
  tags?: string[];
  type?: 'enterprise' | 'community' | 'activity' | 'custom';
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  avatar?: string;
  maxMembers?: number;
  rules?: Partial<GroupRules>;
  settings?: Partial<GroupSettings>;
  tags?: string[];
  isPublic?: boolean;
}

export interface JoinGroupData {
  inviteCode: string;
  message?: string;
}

export interface GroupSearchFilters {
  query?: string;
  tags?: string[];
  minMembers?: number;
  maxMembers?: number;
  isPublic?: boolean;
  sortBy?: 'name' | 'members' | 'activity' | 'created';
  sortOrder?: 'asc' | 'desc';
}

export interface GroupTemplate {
  id: string;
  name: string;
  description: string;
  category: 'enterprise' | 'community' | 'activity' | 'education';
  rules: GroupRules;
  settings: GroupSettings;
  recommendedSize: {
    min: number;
    max: number;
  };
  features: string[];
  icon: string;
}

// 群组状态管理
export interface GroupState {
  groups: Group[];
  activeGroup: Group | null;
  members: GroupMember[];
  activities: GroupActivity[];
  stats: GroupStats | null;
  loading: boolean;
  error: string | null;
}

// 群组权限检查
export interface GroupPermissionCheck {
  canManageMembers: boolean;
  canUpdateSettings: boolean;
  canCreateInvites: boolean;
  canDeleteGroup: boolean;
  canModerateTransactions: boolean;
  canViewStatistics: boolean;
}