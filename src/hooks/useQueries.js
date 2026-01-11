/**
 * React Query hooks for centralized data fetching with caching
 * These hooks provide:
 * - Automatic caching and background refetching
 * - Optimistic updates for mutations
 * - Request deduplication
 * - Automatic retry on failure
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Debt, Income, MonthlyCost, DebtPayment, Pot, Transaction, PaymentStatus, DebtStrategy, WishlistItem, Goal, Notification } from '@/api/entities';

// Query key factory for consistent keys
export const queryKeys = {
  user: ['user'],
  debts: (userId) => ['debts', userId],
  income: (userId) => ['income', userId],
  monthlyCosts: (userId) => ['monthlyCosts', userId],
  debtPayments: (userId) => ['debtPayments', userId],
  pots: (userId) => ['pots', userId],
  transactions: (userId) => ['transactions', userId],
  paymentStatuses: (userId) => ['paymentStatuses', userId],
  debtStrategy: (userId) => ['debtStrategy', userId],
  wishlist: (userId) => ['wishlist', userId],
  goals: (userId) => ['goals', userId],
  notifications: (userId) => ['notifications', userId],
};

// Stale times in milliseconds
const STALE_TIMES = {
  user: 5 * 60 * 1000, // 5 minutes
  debts: 2 * 60 * 1000, // 2 minutes
  income: 5 * 60 * 1000, // 5 minutes
  monthlyCosts: 5 * 60 * 1000, // 5 minutes
  debtPayments: 2 * 60 * 1000, // 2 minutes
  pots: 3 * 60 * 1000, // 3 minutes
  transactions: 1 * 60 * 1000, // 1 minute
  paymentStatuses: 2 * 60 * 1000, // 2 minutes
  notifications: 30 * 1000, // 30 seconds (need to stay fresh)
};

// ============ User Hooks ============

export function useUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => User.me(),
    staleTime: STALE_TIMES.user,
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => User.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}

// ============ Debts Hooks ============

export function useDebts(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.debts(userId),
    queryFn: async () => {
      const debts = await Debt.filter({ user_id: userId });
      return debts || [];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.debts,
    ...options,
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => Debt.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts(variables.user_id) });
    },
  });
}

export function useUpdateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => Debt.update(id, data),
    onSuccess: (_, variables) => {
      // Get user_id from the data to invalidate correct query
      if (variables.data?.user_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.debts(variables.data.user_id) });
      }
    },
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }) => Debt.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts(variables.userId) });
    },
  });
}

// ============ Income Hooks ============

export function useIncome(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.income(userId),
    queryFn: async () => {
      const income = await Income.filter({ user_id: userId });
      return income || [];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.income,
    ...options,
  });
}

export function useActiveIncome(userId, options = {}) {
  return useQuery({
    queryKey: [...queryKeys.income(userId), 'active'],
    queryFn: async () => {
      const income = await Income.filter({ user_id: userId, is_active: true });
      return income || [];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.income,
    ...options,
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => Income.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.income(variables.user_id) });
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => Income.update(id, data),
    onSuccess: (_, variables) => {
      if (variables.data?.user_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.income(variables.data.user_id) });
      }
    },
  });
}

// ============ Monthly Costs Hooks ============

export function useMonthlyCosts(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.monthlyCosts(userId),
    queryFn: async () => {
      const costs = await MonthlyCost.filter({ user_id: userId });
      return costs || [];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.monthlyCosts,
    ...options,
  });
}

export function useActiveMonthlyCosts(userId, options = {}) {
  return useQuery({
    queryKey: [...queryKeys.monthlyCosts(userId), 'active'],
    queryFn: async () => {
      const costs = await MonthlyCost.filter({ user_id: userId, is_active: true });
      return costs || [];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.monthlyCosts,
    ...options,
  });
}

export function useCreateMonthlyCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => MonthlyCost.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyCosts(variables.user_id) });
    },
  });
}

// ============ Debt Payments Hooks ============

export function useDebtPayments(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.debtPayments(userId),
    queryFn: async () => {
      const payments = await DebtPayment.filter({ user_id: userId });
      return payments || [];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.debtPayments,
    ...options,
  });
}

export function useCreateDebtPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => DebtPayment.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debtPayments(variables.user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.debts(variables.user_id) });
    },
  });
}

// ============ Pots Hooks ============

export function usePots(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.pots(userId),
    queryFn: async () => {
      const pots = await Pot.filter({ user_id: userId });
      return pots || [];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.pots,
    ...options,
  });
}

export function useCreatePot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => Pot.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pots(variables.user_id) });
    },
  });
}

export function useUpdatePot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => Pot.update(id, data),
    onSuccess: (_, variables) => {
      if (variables.data?.user_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.pots(variables.data.user_id) });
      }
    },
  });
}

// ============ Transactions Hooks ============

export function useTransactions(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.transactions(userId),
    queryFn: async () => {
      const transactions = await Transaction.filter({ user_id: userId });
      return transactions || [];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.transactions,
    ...options,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => Transaction.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions(variables.user_id) });
    },
  });
}

// ============ Payment Status Hooks ============

export function usePaymentStatuses(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.paymentStatuses(userId),
    queryFn: async () => {
      const statuses = await PaymentStatus.filter({ user_id: userId });
      return statuses || [];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.paymentStatuses,
    ...options,
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => PaymentStatus.update(id, data),
    onSuccess: (_, variables) => {
      if (variables.data?.user_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.paymentStatuses(variables.data.user_id) });
      }
    },
  });
}

// ============ Debt Strategy Hooks ============

export function useDebtStrategy(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.debtStrategy(userId),
    queryFn: async () => {
      const strategies = await DebtStrategy.filter({ user_id: userId, is_active: true });
      return strategies?.[0] || null;
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.debts,
    ...options,
  });
}

// ============ Wishlist Hooks ============

export function useWishlist(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.wishlist(userId),
    queryFn: async () => {
      const items = await WishlistItem.filter({ user_id: userId });
      return items || [];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.pots,
    ...options,
  });
}

export function useCreateWishlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => WishlistItem.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist(variables.user_id) });
    },
  });
}

// ============ Goals Hooks ============

export function useGoals(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.goals(userId),
    queryFn: async () => {
      const goals = await Goal.filter({ user_id: userId });
      return goals || [];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.pots,
    ...options,
  });
}

// ============ Notifications Hooks ============

export function useNotifications(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.notifications(userId),
    queryFn: async () => {
      const notifications = await Notification.filter({ user_id: userId });
      return notifications || [];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.notifications,
    ...options,
  });
}

export function useUnreadNotifications(userId, options = {}) {
  return useQuery({
    queryKey: [...queryKeys.notifications(userId), 'unread'],
    queryFn: async () => {
      const notifications = await Notification.filter({ user_id: userId, is_read: false });
      return notifications || [];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.notifications,
    ...options,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => Notification.update(id, { is_read: true }),
    onSuccess: (_, variables) => {
      if (variables.userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications(variables.userId) });
      }
    },
  });
}

// ============ Prefetch Helpers ============

export function usePrefetchDashboardData(userId) {
  const queryClient = useQueryClient();

  return () => {
    if (!userId) return;

    // Prefetch all dashboard-related data
    queryClient.prefetchQuery({
      queryKey: queryKeys.debts(userId),
      queryFn: () => Debt.filter({ user_id: userId }),
      staleTime: STALE_TIMES.debts,
    });

    queryClient.prefetchQuery({
      queryKey: queryKeys.income(userId),
      queryFn: () => Income.filter({ user_id: userId }),
      staleTime: STALE_TIMES.income,
    });

    queryClient.prefetchQuery({
      queryKey: queryKeys.monthlyCosts(userId),
      queryFn: () => MonthlyCost.filter({ user_id: userId }),
      staleTime: STALE_TIMES.monthlyCosts,
    });

    queryClient.prefetchQuery({
      queryKey: queryKeys.pots(userId),
      queryFn: () => Pot.filter({ user_id: userId }),
      staleTime: STALE_TIMES.pots,
    });
  };
}

// ============ Invalidation Helpers ============

export function useInvalidateUserData() {
  const queryClient = useQueryClient();

  return (userId) => {
    if (!userId) return;

    queryClient.invalidateQueries({ queryKey: queryKeys.debts(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.income(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.monthlyCosts(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.debtPayments(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.pots(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions(userId) });
  };
}

// ============ Paginated Hooks ============

import { supabaseService } from '@/services/supabaseService';

/**
 * Generic paginated query hook
 * @param {string} table - Table name
 * @param {string} userId - User ID for filtering
 * @param {object} options - Query options
 * @param {number} options.page - Current page (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Order by field
 * @param {object} options.filters - Additional filters
 */
export function usePaginatedQuery(table, userId, options = {}) {
  const { page = 1, pageSize = 20, orderBy = '-created_at', filters = {}, ...queryOptions } = options;

  return useQuery({
    queryKey: [table, 'paginated', userId, page, pageSize, orderBy, filters],
    queryFn: () => supabaseService.paginate(table, { user_id: userId, ...filters }, { page, pageSize, orderBy }),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true, // Keep showing old data while fetching new page
    ...queryOptions,
  });
}

// Specific paginated hooks for common use cases

export function usePaginatedDebts(userId, options = {}) {
  return usePaginatedQuery('debts', userId, {
    orderBy: '-created_at',
    ...options,
  });
}

export function usePaginatedTransactions(userId, options = {}) {
  return usePaginatedQuery('transactions', userId, {
    orderBy: '-date',
    ...options,
  });
}

export function usePaginatedDebtPayments(userId, options = {}) {
  return usePaginatedQuery('debt_payments', userId, {
    orderBy: '-date',
    ...options,
  });
}

export function usePaginatedNotifications(userId, options = {}) {
  return usePaginatedQuery('notifications', userId, {
    orderBy: '-created_at',
    pageSize: 10, // Notifications typically need fewer items
    ...options,
  });
}

export function usePaginatedMonthlyCosts(userId, options = {}) {
  return usePaginatedQuery('monthly_costs', userId, {
    orderBy: 'name',
    ...options,
  });
}
