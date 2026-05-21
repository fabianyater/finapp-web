import { transactionsApi, type DeletedTransactionDto, type TransactionListDto } from "@/api/transactions";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionListDto | null>(null);
  const [selectedTransferTx, setSelectedTransferTx] = useState<TransactionListDto | null>(null);
  const [showTransaction, setShowTransaction] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showTxFullModal, setShowTxFullModal] = useState(false);
  const [txFullModalCategoryId, setTxFullModalCategoryId] = useState<string | null>(null);

  function toggleBalanceVisible() {
    setBalanceVisible((v) => {
      const next = !v;
      localStorage.setItem("balanceVisible", String(next));
      return next;
    });
  }

  function openTxFullModal(categoryId?: string | null) {
    setTxFullModalCategoryId(categoryId ?? null);
    setShowTxFullModal(true);
  }

  function closeTxFullModal() {
    setShowTxFullModal(false);
    setTxFullModalCategoryId(null);
  }

  async function handleExportCsv() {
    if (!selectedAccountId || isExporting) return;
    setIsExporting(true);
    try {
      const blob = await transactionsApi.exportCsv({
        accountIds: [selectedAccountId],
        dateFrom,
        dateTo,
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
    showDeleted,
    setShowDeleted,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedTx,
    setSelectedTx,
    selectedTransferTx,
    setSelectedTransferTx,
    showTransaction,
    setShowTransaction,
    showTransfer,
    setShowTransfer,
    isExporting,
    handleExportCsv,
    showTxFullModal,
    txFullModalCategoryId,
    openTxFullModal,
    closeTxFullModal,
    handleTransferSuccess,
    handleTxDeleted,
    handleTxUpdated,
    handleTransferTxDeleted,
    handleRestore,
    invalidateAfterTransaction,
  };
}
