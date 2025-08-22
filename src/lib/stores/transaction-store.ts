import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { transactionService } from '@/lib/services';
import { useAuthStore } from './auth-store';
import type { 
  Transaction, 
  PendingRequest, 
  TransactionSummary, 
  TransferRequest,
  ReturnRequest,
  TransactionFilter 
} from '@/lib/types';

interface TransactionStore {
  // State
  transactions: Transaction[];
  pendingRequests: PendingRequest[];
  summary: TransactionSummary | null;
  loading: boolean;
  error: string | null;
  filter: TransactionFilter;

  // Actions
  fetchTransactions: (filter?: TransactionFilter) => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchTransactionSummary: (groupId?: string) => Promise<void>;
  createTransfer: (request: TransferRequest) => Promise<void>;
  respondToRequest: (requestId: string, response: 'accept' | 'reject') => Promise<void>;
  returnPoints: (request: ReturnRequest) => Promise<void>;
  cancelTransaction: (transactionId: string) => Promise<void>;
  setFilter: (filter: Partial<TransactionFilter>) => void;
  clearError: () => void;
  reset: () => void;
}

export const useTransactionStore = create<TransactionStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    transactions: [],
    pendingRequests: [],
    summary: null,
    loading: false,
    error: null,
    filter: {},

    // Actions
    fetchTransactions: async (filter?: TransactionFilter) => {
      set({ loading: true, error: null });
      
      try {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('用户未登录');
        }

        // Map filter type to service type
        let serviceType: 'all' | 'sent' | 'received' = 'all';
        if (filter?.type === 'transfer' || filter?.type === 'return') {
          serviceType = 'all'; // For now, map all transaction types to 'all'
        }

        // Map filter status to service status
        let serviceStatus: 'all' | 'pending' | 'completed' | 'rejected' = 'all';
        if (filter?.status === 'pending' || filter?.status === 'completed' || filter?.status === 'rejected') {
          serviceStatus = filter.status;
        }

        const options = {
          page: filter?.page,
          limit: filter?.limit,
          type: serviceType,
          status: serviceStatus,
          groupId: filter?.groupId,
        };

        const result = await transactionService.getUserTransactions(user.id, options);
        
        if (result.success && result.data) {
          set({ 
            transactions: result.data as Transaction[],
            filter: filter || {},
            loading: false 
          });
        } else {
          throw new Error(result.error || '获取交易记录失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '获取交易记录失败',
          loading: false 
        });
      }
    },

    fetchPendingRequests: async () => {
      set({ loading: true, error: null });
      
      try {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('用户未登录');
        }

        const result = await transactionService.getPendingRequests(user.id);
        
        if (result.success && result.data) {
          set({ pendingRequests: result.data as PendingRequest[], loading: false });
        } else {
          throw new Error(result.error || '获取待处理请求失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '获取待处理请求失败',
          loading: false 
        });
      }
    },

    fetchTransactionSummary: async (groupId?: string) => {
      set({ loading: true, error: null });
      
      try {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('用户未登录');
        }

        const result = await transactionService.getTransactionStats(user.id, groupId);
        
        if (result.success && result.data) {
          const stats = result.data as any;
          const summary: TransactionSummary = {
            totalTransferred: stats.totalSent,
            totalReceived: stats.totalReceived,
            totalReturned: 0, // 需要单独计算
            currentBalance: user.balance,
            pendingOut: stats.pendingTransactions,
            pendingIn: 0, // 需要单独计算
            overdueAmount: 0, // 需要单独计算
            transactionCount: stats.totalTransactions,
          };
          
          set({ summary, loading: false });
        } else {
          throw new Error(result.error || '获取交易汇总失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '获取交易汇总失败',
          loading: false 
        });
      }
    },

    createTransfer: async (request: TransferRequest) => {
      set({ loading: true, error: null });
      
      try {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('用户未登录');
        }

        const createData = {
          fromUserId: user.id,
          toUserId: request.toUserId,
          groupId: request.groupId,
          amount: request.amount,
          description: request.description,
          type: 'transfer' as const,
          dueDate: request.dueDate,
          immediate: request.immediate,
        };

        const result = await transactionService.createTransaction(createData);
        
        if (result.success) {
          // 重新获取交易列表和待处理请求
          await get().fetchTransactions(get().filter);
          await get().fetchPendingRequests();
          set({ loading: false });
        } else {
          throw new Error(result.error || '创建转移请求失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '创建转移请求失败',
          loading: false 
        });
      }
    },

    respondToRequest: async (requestId: string, response: 'accept' | 'reject') => {
      set({ loading: true, error: null });
      
      try {
        let result;
        if (response === 'accept') {
          result = await transactionService.completeTransaction(requestId);
        } else {
          result = await transactionService.rejectTransaction(requestId);
        }
        
        if (result.success) {
          // 重新获取交易列表和待处理请求
          await get().fetchTransactions(get().filter);
          await get().fetchPendingRequests();
          set({ loading: false });
        } else {
          throw new Error(result.error || '响应请求失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '响应请求失败',
          loading: false 
        });
      }
    },

    returnPoints: async (request: ReturnRequest) => {
      set({ loading: true, error: null });
      
      try {
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('用户未登录');
        }

        // 获取原始交易信息
        const { transactions } = get();
        const originalTransaction = transactions.find(tx => tx.id === request.transactionId);
        
        if (!originalTransaction) {
          throw new Error('原始交易不存在');
        }

        const createData = {
          fromUserId: user.id,
          toUserId: originalTransaction.fromUserId,
          groupId: originalTransaction.groupId,
          amount: request.amount || originalTransaction.amount,
          description: request.description || '积分归还',
          type: 'return' as const,
          immediate: true,
        };

        const result = await transactionService.createTransaction(createData);
        
        if (result.success) {
          // 重新获取交易列表
          await get().fetchTransactions(get().filter);
          set({ loading: false });
        } else {
          throw new Error(result.error || '归还积分失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '归还积分失败',
          loading: false 
        });
      }
    },

    cancelTransaction: async (transactionId: string) => {
      set({ loading: true, error: null });
      
      try {
        const result = await transactionService.cancelTransaction(transactionId);
        
        if (result.success) {
          // 重新获取交易列表和待处理请求
          await get().fetchTransactions(get().filter);
          await get().fetchPendingRequests();
          set({ loading: false });
        } else {
          throw new Error(result.error || '取消交易失败');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '取消交易失败',
          loading: false 
        });
      }
    },

    setFilter: (filter: Partial<TransactionFilter>) => {
      const { filter: currentFilter } = get();
      set({ filter: { ...currentFilter, ...filter } });
    },

    clearError: () => {
      set({ error: null });
    },

    reset: () => {
      set({
        transactions: [],
        pendingRequests: [],
        summary: null,
        loading: false,
        error: null,
        filter: {},
      });
    },
  }))
);