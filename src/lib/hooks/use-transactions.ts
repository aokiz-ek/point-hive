import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTransactionStore } from '@/lib/stores';
import { queryKeys, queryOptions } from '@/lib/providers/react-query-provider';
import type { TransactionFilter, TransferRequest, ReturnRequest } from '@/lib/types';

export function useTransactions(filter?: TransactionFilter) {
  const { transactions, loading, error, fetchTransactions, filter: currentFilter } = useTransactionStore();

  const query = useQuery({
    queryKey: queryKeys.transactions.list(filter || currentFilter),
    queryFn: async () => {
      await fetchTransactions(filter);
      return useTransactionStore.getState().transactions;
    },
    ...queryOptions.shortCache,
  });

  return {
    transactions,
    loading: loading || query.isLoading,
    error: error || (query.error as Error)?.message,
    refetch: query.refetch,
  };
}

export function useTransaction(transactionId?: string) {
  const { transactions } = useTransactionStore();

  const query = useQuery({
    queryKey: queryKeys.transactions.detail(transactionId!),
    queryFn: async () => {
      const transaction = transactions.find(tx => tx.id === transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      return transaction;
    },
    enabled: !!transactionId,
    ...queryOptions.longCache,
  });

  return {
    transaction: query.data,
    loading: query.isLoading,
    error: (query.error as Error)?.message,
    refetch: query.refetch,
  };
}

export function usePendingRequests() {
  const { pendingRequests, loading, error, fetchPendingRequests } = useTransactionStore();

  const query = useQuery({
    queryKey: queryKeys.transactions.pending(),
    queryFn: async () => {
      await fetchPendingRequests();
      return useTransactionStore.getState().pendingRequests;
    },
    ...queryOptions.realtime,
  });

  return {
    pendingRequests,
    loading: loading || query.isLoading,
    error: error || (query.error as Error)?.message,
    refetch: query.refetch,
  };
}

export function useTransactionSummary() {
  const { summary, loading, error, fetchTransactionSummary } = useTransactionStore();

  const query = useQuery({
    queryKey: queryKeys.transactions.summary(),
    queryFn: async () => {
      await fetchTransactionSummary();
      return useTransactionStore.getState().summary;
    },
    ...queryOptions.shortCache,
  });

  return {
    summary,
    loading: loading || query.isLoading,
    error: error || (query.error as Error)?.message,
    refetch: query.refetch,
  };
}

export function useTransactionMutations() {
  const queryClient = useQueryClient();
  const {
    createTransfer,
    respondToRequest,
    returnPoints,
  } = useTransactionStore();

  const createTransferMutation = useMutation({
    mutationFn: (request: TransferRequest) => createTransfer(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.summary() });
    },
  });

  const respondToRequestMutation = useMutation({
    mutationFn: ({ requestId, response }: { requestId: string; response: 'accept' | 'reject' }) =>
      respondToRequest(requestId, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.summary() });
    },
  });

  const returnPointsMutation = useMutation({
    mutationFn: (request: ReturnRequest) => returnPoints(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.summary() });
    },
  });

  return {
    createTransferMutation,
    respondToRequestMutation,
    returnPointsMutation,
  };
}