import { useAuthStore } from "@/store/auth";
import { Wallet } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import AccountSelector from "./components/AccountSelector";
import CategoryBreakdown from "./components/CategoryBreakdown";
import DashboardTopBar from "./components/DashboardTopBar";
import MonthSelector from "./components/MonthSelector";
import AddTransactionModal from "./components/modals/AddTransactionModal";
import TransactionDetailModal from "./components/modals/TransactionDetailModal";
import TransferDetailModal from "./components/modals/TransferDetailModal";
import TransferModal from "./components/modals/TransferModal";
import SummaryCards from "./components/SummaryCards";
import TransactionInputBox from "./components/TransactionInputBox";
import TotalBalanceDisplay from "./components/TotalBalanceDisplay";
import TransactionSection from "./components/TransactionSection";
import { useDashboardData } from "./hooks/useDashboardData";
import { useDashboardState } from "./hooks/useDashboardState";
import { useMonthNavigation } from "./hooks/useMonthNavigation";
import { useTransactionInput } from "./hooks/useTransactionInput";
export default function DashboardPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const monthNav = useMonthNavigation();
  const dashState = useDashboardState({
    dateFrom: monthNav.dateFrom,
    dateTo: monthNav.dateTo,
  });
  const txInput = useTransactionInput(dashState.selectedAccountId);
  const dashData = useDashboardData({
    selectedAccountId: dashState.selectedAccountId,
    dateFrom: monthNav.dateFrom,
    dateTo: monthNav.dateTo,
    categoryView: dashState.categoryView,
    txSearch: dashState.txSearch,
    txTypeFilter: dashState.txTypeFilter,
    selectedCategoryId: dashState.selectedCategoryId,
    selectedTags: dashState.selectedTags,
    txPage: dashState.txPage,
    showAllTxns: dashState.showAllTxns,
    showDeleted: dashState.showDeleted,
  });

  const txSectionRef = useRef<HTMLDivElement>(null);

  const { selectedAccountId, setSelectedAccountId } = dashState;
  const { accounts } = dashData;

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      const def = accounts.find((a) => a.isDefault) ?? accounts[0];
      setSelectedAccountId(def.id);
    }
  }, [accounts, selectedAccountId, setSelectedAccountId]);

  const selectedAccount = dashData.accounts.find(
    (a) => a.id === dashState.selectedAccountId,
  );
  const currency = selectedAccount?.currency ?? "COP";
  const includedAccounts = dashData.accounts.filter((a) => !a.excludeFromTotal);
  const totalByCurrency = includedAccounts.reduce<Record<string, number>>(
    (acc, a) => {
      acc[a.currency] = (acc[a.currency] ?? 0) + a.currentBalance;
      return acc;
    },
    {},
  );
  const totalIncome = dashData.transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = dashData.transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);
  const balance = selectedAccount?.currentBalance ?? 0;
  const categoryMap = new Map(dashData.categories.map((c) => [c.id, c]));
  const recentTxs = dashData.transactions.slice(0, 10);

  function resolveCat(tx: {
    categoryId?: string | null;
    categoryName?: string | null;
    categoryColor?: string | null;
    categoryIcon?: string | null;
  }) {
    if (!tx.categoryId) return undefined;
    return (
      categoryMap.get(tx.categoryId) ??
      (tx.categoryName
        ? { name: tx.categoryName, color: tx.categoryColor ?? "#64748b", icon: tx.categoryIcon ?? "tag" }
        : undefined)
    );
  }

  function handleSuccess() {
    txInput.setShowModal(false);
    txInput.setParsedData(null);
    txInput.setInput("");
    if (txInput.textareaRef.current) txInput.textareaRef.current.style.height = "auto";
    dashState.invalidateAfterTransaction();
  }

  // ── early returns ──────────────────────────────────────────────────────────

  if (
    dashData.accountsLoading ||
    (dashData.accountsFetching && !dashData.accountsData)
  ) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 dark:bg-[#252523] rounded-full w-1/3" />
        <div className="h-16 bg-gray-100 dark:bg-[#252523] rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-[#252523] rounded-xl" />
          ))}
        </div>
        <div className="h-48 bg-gray-100 dark:bg-[#252523] rounded-xl" />
      </div>
    );
  }

  if (dashData.accountsError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          No se pudo cargar la información.
        </p>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  if (!dashData.accountsLoading && !dashData.accountsFetching && dashData.accounts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-2">
          <Wallet size={22} className="text-emerald-500" />
        </div>
        <p className="text-base font-semibold text-gray-800 dark:text-gray-100">Sin cuentas</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Crea tu primera cuenta para empezar a registrar transacciones
        </p>
        <Link
          to="/accounts"
          className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
        >
          Crear cuenta
        </Link>
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <DashboardTopBar />

      {includedAccounts.length > 0 && (
        <TotalBalanceDisplay
          includedAccounts={includedAccounts}
          accounts={dashData.accounts}
          totalByCurrency={totalByCurrency}
          balanceVisible={dashState.balanceVisible}
          onToggleVisible={dashState.toggleBalanceVisible}
        />
      )}

      {dashData.accounts.length > 0 && (
        <AccountSelector
          accounts={dashData.accounts}
          selectedAccountId={dashState.selectedAccountId}
          onSelect={dashState.setSelectedAccountId}
        />
      )}

      <TransactionInputBox
        input={txInput.input}
        isParsing={txInput.isParsing}
        textareaRef={txInput.textareaRef}
        showTransferButton={dashData.accounts.length >= 2}
        onChange={txInput.handleInput}
        onSubmit={txInput.handleSubmitInput}
        onTransfer={() => dashState.setShowTransfer(true)}
      />

      <MonthSelector
        year={monthNav.selYear}
        month={monthNav.selMonth}
        showPicker={monthNav.showPicker}
        isCurrentMonth={monthNav.isCurrentMonth}
        onPrev={monthNav.prevMonth}
        onNext={monthNav.nextMonth}
        onTogglePicker={() => monthNav.setShowPicker((p) => !p)}
        onSelect={(y, m) => { monthNav.setSelYear(y); monthNav.setSelMonth(m); }}
        onClosePicker={() => monthNav.setShowPicker(false)}
      />

      <SummaryCards
        selectedAccount={selectedAccount}
        categoryView={dashState.categoryView}
        balanceVisible={dashState.balanceVisible}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        balance={balance}
        currency={currency}
        onSetCategoryView={dashState.setCategoryView}
      />

      <CategoryBreakdown
        selectedAccountId={dashState.selectedAccountId}
        categoryView={dashState.categoryView}
        summaryLoading={dashData.summaryLoading}
        summaryCats={dashData.summaryCats}
        selectedCategoryId={dashState.selectedCategoryId}
        budgetMap={dashData.budgetMap}
        txSectionRef={txSectionRef}
        onSelectCategory={dashState.setSelectedCategoryId}
        onSetShowAllTxns={dashState.setShowAllTxns}
        onSetTxPage={dashState.setTxPage}
      />

      <TransactionSection
        sectionRef={txSectionRef}
        showDeleted={dashState.showDeleted}
        showAllTxns={dashState.showAllTxns}
        txSearchInput={dashState.txSearchInput}
        txSearch={dashState.txSearch}
        txTypeFilter={dashState.txTypeFilter}
        selectedCategoryId={dashState.selectedCategoryId}
        selectedTags={dashState.selectedTags}
        availableTags={dashData.availableTags}
        txPage={dashState.txPage}
        isExporting={dashState.isExporting}
        deletedLoading={dashData.deletedLoading}
        deletedTxs={dashData.deletedTxs}
        allTxLoading={dashData.allTxLoading}
        txLoading={dashData.txLoading}
        allTxData={dashData.allTxData}
        recentTxs={recentTxs}
        accounts={dashData.accounts}
        categories={dashData.categories}
        currency={currency}
        categoryMap={categoryMap}
        onSetShowDeleted={dashState.setShowDeleted}
        onSetShowAllTxns={dashState.setShowAllTxns}
        onSetTxSearchInput={dashState.setTxSearchInput}
        onSetTxTypeFilter={dashState.setTxTypeFilter}
        onSetSelectedCategoryId={dashState.setSelectedCategoryId}
        onSetSelectedTags={dashState.setSelectedTags}
        onSetTxPage={dashState.setTxPage}
        onExportCsv={dashState.handleExportCsv}
        onSelectTx={dashState.setSelectedTx}
        onSelectTransferTx={dashState.setSelectedTransferTx}
        onRestore={dashState.handleRestore}
      />

      {txInput.showModal && dashState.selectedAccountId && (
        <AddTransactionModal
          accountId={dashState.selectedAccountId}
          categories={dashData.categories}
          initialDescription={txInput.input}
          currency={currency}
          onClose={() => { txInput.setShowModal(false); txInput.setParsedData(null); }}
          onSuccess={handleSuccess}
          aiParsed={txInput.parsedData}
        />
      )}

      {dashState.showTransfer && dashState.selectedAccountId && (
        <TransferModal
          accounts={dashData.accounts}
          defaultFromAccountId={dashState.selectedAccountId}
          onClose={() => dashState.setShowTransfer(false)}
          onSuccess={dashState.handleTransferSuccess}
        />
      )}

      {dashState.selectedTx && (
        <TransactionDetailModal
          tx={dashState.selectedTx}
          category={
            resolveCat(dashState.selectedTx) as
              | { name: string; color: string; icon: string }
              | undefined
          }
          accountName={selectedAccount?.name ?? "—"}
          currency={currency}
          categories={dashData.categories}
          onClose={() => dashState.setSelectedTx(null)}
          onDeleted={dashState.handleTxDeleted}
          onUpdated={dashState.handleTxUpdated}
        />
      )}

      {dashState.selectedTransferTx && (
        <TransferDetailModal
          tx={dashState.selectedTransferTx}
          accounts={dashData.accounts}
          currency={currency}
          onClose={() => dashState.setSelectedTransferTx(null)}
          onDeleted={dashState.handleTransferTxDeleted}
        />
      )}
    </div>
  );
}
