import type { User } from './auth';

/**
 * 交易相关类型定义
 */

export interface Transaction {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  dueDate?: string;
  returnedAt?: string;
  returnedAmount?: number;
  fee?: number;
  metadata: TransactionMetadata;
  createdAt: string;
  updatedAt: string;
  
  // 关联数据
  fromUser?: User;
  toUser?: User;
  relatedTransactions?: Transaction[];
}

export type TransactionType = 'transfer' | 'return' | 'adjustment' | 'fee' | 'system';

export type TransactionStatus = 
  | 'pending'     // 等待确认
  | 'approved'    // 已批准
  | 'completed'   // 已完成
  | 'rejected'    // 已拒绝
  | 'expired'     // 已过期
  | 'cancelled'   // 已取消
  | 'overdue';    // 已逾期

export interface TransactionMetadata {
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  deviceId?: string;
  originalTransactionId?: string; // 用于退还交易
  batchId?: string; // 批量操作ID
  tags?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface PendingRequest {
  id: string;
  transactionId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
  dueDate?: string;
  expiresAt: string;
  status: 'waiting' | 'expired';
  reminderCount: number;
  lastReminderAt?: string;
  createdAt: string;
  
  // 关联数据
  fromUser?: User;
  toUser?: User;
}

export interface TransactionSummary {
  totalTransferred: number;
  totalReceived: number;
  totalReturned: number;
  currentBalance: number;
  pendingOut: number;
  pendingIn: number;
  overdueAmount: number;
  transactionCount: number;
}

export interface TransferRequest {
  toUserId: string;
  amount: number;
  groupId: string;
  description?: string;
  dueDate?: string;
  priority?: 'normal' | 'urgent';
}

export interface ReturnRequest {
  transactionId: string;
  amount?: number; // 可选，用于部分归还
  description?: string;
}

export interface TransactionFilter {
  groupId?: string;
  userId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'amount' | 'date' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface TransactionStats {
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  successRate: number;
  onTimeRate: number;
  byType: Record<TransactionType, {
    count: number;
    amount: number;
  }>;
  byStatus: Record<TransactionStatus, number>;
  monthlyTrend: {
    month: string;
    count: number;
    amount: number;
  }[];
}

export interface CreditRecord {
  id: string;
  userId: string;
  previousScore: number;
  newScore: number;
  change: number;
  reason: CreditChangeReason;
  transactionId?: string;
  description?: string;
  createdAt: string;
}

export type CreditChangeReason = 
  | 'on_time_return'
  | 'late_return'
  | 'overdue'
  | 'positive_feedback'
  | 'negative_feedback'
  | 'manual_adjustment'
  | 'system_adjustment'
  | 'new_user_bonus';

export interface ReminderSettings {
  enabled: boolean;
  schedules: ReminderSchedule[];
}

export interface ReminderSchedule {
  type: 'before_due' | 'after_due';
  days: number;
  methods: ('push' | 'email' | 'sms')[];
  message?: string;
}

export interface TransactionReceipt {
  transactionId: string;
  timestamp: string;
  fromUser: string;
  toUser: string;
  amount: number;
  status: TransactionStatus;
  confirmationCode: string;
  qrCode?: string;
}

// 批量操作
export interface BatchTransferRequest {
  transfers: TransferRequest[];
  batchDescription?: string;
}

export interface BatchOperationResult {
  batchId: string;
  totalRequests: number;
  successCount: number;
  failedCount: number;
  results: {
    success: Transaction[];
    failed: {
      request: TransferRequest;
      error: string;
    }[];
  };
}

// 交易状态管理
export interface TransactionState {
  transactions: Transaction[];
  pendingRequests: PendingRequest[];
  summary: TransactionSummary | null;
  loading: boolean;
  error: string | null;
  filter: TransactionFilter;
}

// 实时更新事件
export interface TransactionEvent {
  type: 'transaction_created' | 'transaction_updated' | 'request_received' | 'request_responded';
  data: Transaction | PendingRequest;
  timestamp: string;
}