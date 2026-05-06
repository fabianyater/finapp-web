import { transactionsApi, type DeletedTransactionDto, type TransactionListDto } from "@/api/transactions";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useDashboardState({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}) {
  const queryClient = useQueryClient();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [categoryView, setCategoryView] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [balanceVisible, setBalanceVisible] = useState(
    () => localStorage.getItem("balanceVisible") !== "false",
  );
  const [showAllTxns, setShowAllTxns] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [txSearchInput, setTxSearchInput] = useState("");
  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState<
    "ALL" | "EXPENSE" | "INCOME" | "TRANSFER"
  >("ALL");
  const [txPage, setTxPage] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTx, setSelectedTx] = useState<TransactionListDto | null>(null);
  const [selectedTransferTx, setSelectedTransferTx] = useState<TransactionListDto | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTxSearch(txSearchInput), 350);
    return () => clearTimeout(t);
  }, [txSearchInput]);

  useEffect(() => {
    setTxPage(0);
  }, [txSearch, txTypeFilter, selectedCategoryId, selectedAccountId, dateFrom, dateTo, selectedTags]);

  useEffect(() => {
    setSelectedCategoryId(null);
  }, [selectedAccountId, dateFrom, dateTo]);

  function toggleBalanceVisible() {
    setBalanceVisible((v) => {
      const next = !v;
      localStorage.setItem("balanceVisible", String(next));
      return next;
    });
  }

  async function handleExportCsv() {
    if (!selectedAccountId || isExporting) return;
    setIsExporting(true);
    try {
      const blob = await transactionsApi.exportCsv({
        accountIds: [selectedAccountId],
        dateFrom,
        dateTo,
        search: txSearch || undefined,
        types: txTypeFilter !== "ALL" ? [txTypeFilter] : undefined,
        categoryIds: selectedCategoryId ? [selectedCategoryId] : undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transactions.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  function handleTransferSuccess() {
    setShowTransfer(false);
    queryClient.invalidateQueries({
      queryKey: ["transactions", selectedAccountId, dateFrom, dateTo],
    });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
  }

  function handleTxDeleted() {
    setSelectedTx(null);
    queryClient.invalidateQueries({
      queryKey: ["transactions", selectedAccountId, dateFrom, dateTo],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions-all", selectedAccountId],
    });
    queryClient.invalidateQueries({
      queryKey: ["category-summary", selectedAccountId],
    });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  }

  function handleTxUpdated() {
    setSelectedTx(null);
    queryClient.invalidateQueries({
      queryKey: ["transactions", selectedAccountId, dateFrom, dateTo],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions-all", selectedAccountId],
    });
    queryClient.invalidateQueries({
      queryKey: ["category-summary", selectedAccountId],
    });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  }

  function handleTransferTxDeleted() {
    setSelectedTransferTx(null);
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({
      queryKey: ["transactions", selectedAccountId, dateFrom, dateTo],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions-all", selectedAccountId],
    });
    queryClient.invalidateQueries({
      queryKey: ["category-summary", selectedAccountId],
    });
  }

  async function handleRestore(tx: DeletedTransactionDto) {
    await transactionsApi.restore(tx.accountId, tx.id);
    queryClient.invalidateQueries({
      queryKey: ["transactions-deleted", selectedAccountId],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions", selectedAccountId, dateFrom, dateTo],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions-all", selectedAccountId],
    });
    queryClient.invalidateQueries({
      queryKey: ["category-summary", selectedAccountId],
    });
  }

  function invalidateAfterTransaction() {
    queryClient.invalidateQueries({
      queryKey: ["transactions", selectedAccountId, dateFrom, dateTo],
    });
    queryClient.invalidateQueries({
      queryKey: ["category-summary", selectedAccountId],
    });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  }

  return {
    selectedAccountId,
    setSelectedAccountId,
    categoryView,
    setCategoryView,
    balanceVisible,
    toggleBalanceVisible,
    showAllTxns,
    setShowAllTxns,
    showDeleted,
    setShowDeleted,
    txSearchInput,
    setTxSearchInput,
    txSearch,
    txTypeFilter,
    setTxTypeFilter,
    txPage,
    setTxPage,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedTags,
    setSelectedTags,
    selectedTx,
    setSelectedTx,
    selectedTransferTx,
    setSelectedTransferTx,
    showTransfer,
    setShowTransfer,
    isExporting,
    handleExportCsv,
    handleTransferSuccess,
    handleTxDeleted,
    handleTxUpdated,
    handleTransferTxDeleted,
    handleRestore,
    invalidateAfterTransaction,
  };
}
