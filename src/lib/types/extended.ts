// 加入申请类型
export interface JoinRequest {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
}

// 通知类型
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  read: boolean;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export type NotificationType = 
  | 'transfer_request'
  | 'transfer_approved'
  | 'transfer_rejected'
  | 'return_reminder'
  | 'credit_updated'
  | 'group_invite'
  | 'system_message'
  | 'join_request'
  | 'join_request_approved'
  | 'join_request_rejected'
  | 'group_member_joined'
  | 'group_member_removed'
  | 'group_updated'
  | 'group_deleted';

// Import GroupSettings from group.ts to avoid conflicts
import type { GroupSettings } from './group';

// 评分类型
export interface Rating {
  id: string;
  fromUserId: string;
  toUserId: string;
  transactionId: string;
  score: number; // 1-5
  comment?: string;
  tags?: string[];
  createdAt: string;
}

// 排行榜类型
export interface Leaderboard {
  id: string;
  type: 'points' | 'credit' | 'activity' | 'generosity';
  title: string;
  description: string;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  entries: LeaderboardEntry[];
  updatedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  value: number;
  change?: number; // 排名变化
  metadata?: Record<string, any>;
}

// 成就类型
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'transaction' | 'credit' | 'social' | 'group' | 'milestone';
  requirement: AchievementRequirement;
  reward: AchievementReward;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
}

export interface AchievementRequirement {
  type: 'transaction_count' | 'total_amount' | 'credit_score' | 'group_members' | 'help_count';
  value: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface AchievementReward {
  points?: number;
  creditBonus?: number;
  badge?: string;
  title?: string;
}

// 用户成就
export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
  progress?: number;
}

// 结算相关类型
export interface Settlement {
  id: string;
  groupId?: string;
  initiatorId: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactions: SettlementTransaction[];
  summary: SettlementSummary;
  createdAt: string;
  completedAt?: string;
}

export interface SettlementTransaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  description: string;
  originalTransactions: string[]; // 原始交易ID
  status: 'pending' | 'completed' | 'failed';
}

export interface SettlementSummary {
  totalTransactions: number;
  totalAmount: number;
  netAmounts: Record<string, number>; // 用户ID -> 净金额
  simplifiedTransactions: number; // 简化后的交易数量
}

// 图表数据类型
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

// 时间范围
export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

// 统计数据类型
export interface Statistics {
  period: TimeRange;
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  successRate: number;
  activeUsers: number;
  topUsers: StatisticsUser[];
  trends: StatisticsTrend[];
}

export interface StatisticsUser {
  userId: string;
  userName: string;
  transactionCount: number;
  totalAmount: number;
  averageAmount: number;
  rank: number;
}

export interface StatisticsTrend {
  date: string;
  transactionCount: number;
  totalAmount: number;
  userCount: number;
}

// 扩展的群组类型（与现有类型兼容）
export interface GroupExtended {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  maxMembers: number;
  totalPoints: number;
  isPublic: boolean;
  requireApproval: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  settings: GroupSettings;
  rules?: any; // 兼容现有的GroupRules
  status?: string; // 兼容现有的GroupStatus
  avatar?: string;
  inviteCode?: string;
}