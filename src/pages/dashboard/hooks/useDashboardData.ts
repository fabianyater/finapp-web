import { accountsApi, type AccountDto } from "@/api/accounts";
import { budgetsApi, type BudgetDto } from "@/api/budgets";
import { categoriesApi, type CategorySummaryDto } from "@/api/categories";
import { transactionsApi } from "@/api/transactions";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface DashboardDataParams {
  selectedAccountId: string | null;
  dateFrom: string;
  dateTo: string;
  categoryView: "EXPENSE" | "INCOME";
  showDeleted: boolean;
}

export function useDashboardData({
  selectedAccountId,
  dateFrom,
  dateTo,
  categoryView,
  showDeleted,
}: DashboardDataParams) {
  const {
    data: accountsData,
    isLoading: accountsLoading,
    isFetching: accountsFetching,
    isError: accountsError,
  } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.list,
  });

  const accounts: AccountDto[] = (accountsData?.data ?? []).filter(
    (a) => !a.isArchived,
  );

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: [
      "transactions",
      selectedAccountId,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      transactionsApi.list({
        accountIds: selectedAccountId ? [selectedAccountId] : undefined,
        size: 100,
        dateFrom,
        dateTo,
      }),
    enabled: !!selectedAccountId,
  });
  const transactions = txData?.data ?? [];

  const summaryCats = useMemo((): CategorySummaryDto[] => {
    const map = new Map<string, CategorySummaryDto>();
    for (const tx of transactions) {
      if (tx.type !== categoryView || !tx.categoryId) continue;
      const existing = map.get(tx.categoryId);
      if (existing) {
        existing.total += tx.amount;
      } else {
        map.set(tx.categoryId, {
          categoryId: tx.categoryId,
          name: tx.categoryName ?? "",
          color: tx.categoryColor ?? "#64748b",
          icon: tx.categoryIcon ?? "tag",
          total: tx.amount,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [transactions, categoryView]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const { data: deletedTxs = [], isLoading: deletedLoading } = useQuery({
    queryKey: ["transactions-deleted", selectedAccountId],
    queryFn: () => transactionsApi.listDeleted(selectedAccountId!),
    enabled: !!selectedAccountId && showDeleted,
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetsApi.list(),
    enabled: !!selectedAccountId,
  });

  const budgetMap = useMemo(
    () =>
      Object.fromEntries(budgets.map((b) => [b.categoryId, b])) as Record<
        string,
        BudgetDto
      >,
    [budgets],
  );

  return {
    accountsData,
    accountsLoading,
    accountsFetching,
    accountsError,
    accounts,
    transactions,
    txLoading,
    categories,
    summaryCats,
    summaryLoading: txLoading,
    deletedTxs,
    deletedLoading,
    budgets,
    budgetMap,
  };
}
