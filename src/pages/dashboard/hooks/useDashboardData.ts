import { accountsApi, type AccountDto } from "@/api/accounts";
import { budgetsApi, type BudgetDto } from "@/api/budgets";
import { categoriesApi } from "@/api/categories";
import { transactionsApi } from "@/api/transactions";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface DashboardDataParams {
  selectedAccountId: string | null;
  dateFrom: string;
  dateTo: string;
  categoryView: "EXPENSE" | "INCOME";
  txSearch: string;
  txTypeFilter: "ALL" | "EXPENSE" | "INCOME" | "TRANSFER";
  selectedCategoryId: string | null;
  selectedTags: string[];
  txPage: number;
  showAllTxns: boolean;
  showDeleted: boolean;
}

export function useDashboardData({
  selectedAccountId,
  dateFrom,
  dateTo,
  categoryView,
  txSearch,
  txTypeFilter,
  selectedCategoryId,
  selectedTags,
  txPage,
  showAllTxns,
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
    queryKey: ["transactions", selectedAccountId, dateFrom, dateTo],
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

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const { data: summaryCats = [], isLoading: summaryLoading } = useQuery({
    queryKey: [
      "category-summary",
      selectedAccountId,
      categoryView,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      categoriesApi.getSummary(
        selectedAccountId!,
        categoryView,
        dateFrom,
        dateTo,
      ),
    enabled: !!selectedAccountId,
  });

  const { data: allTxData, isLoading: allTxLoading } = useQuery({
    queryKey: [
      "transactions-all",
      selectedAccountId,
      txSearch,
      txTypeFilter,
      selectedCategoryId,
      selectedTags,
      txPage,
    ],
    queryFn: () =>
      transactionsApi.list({
        accountIds: selectedAccountId ? [selectedAccountId] : undefined,
        page: txPage,
        size: 15,
        search: txSearch || undefined,
        types: txTypeFilter !== "ALL" ? [txTypeFilter] : undefined,
        categoryIds: selectedCategoryId ? [selectedCategoryId] : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      }),
    enabled: !!selectedAccountId && showAllTxns,
    placeholderData: keepPreviousData,
  });

  const { data: availableTags = [] } = useQuery({
    queryKey: ["transaction-tags"],
    queryFn: transactionsApi.listTags,
    enabled: !!selectedAccountId && showAllTxns,
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
    summaryLoading,
    allTxData,
    allTxLoading,
    availableTags,
    deletedTxs,
    deletedLoading,
    budgets,
    budgetMap,
  };
}
