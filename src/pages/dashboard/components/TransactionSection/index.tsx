import { type AccountDto } from "@/api/accounts";
import { type CategoryDto } from "@/api/categories";
import {
  type DeletedTransactionDto,
  type TransactionListDto,
} from "@/api/transactions";
import React from "react";
import DeletedTransactionList from "./DeletedTransactionList";
import TransactionFilters from "./TransactionFilters";
import TransactionList from "./TransactionList";
import TransactionPagination from "./TransactionPagination";
import TransactionSectionHeader from "./TransactionSectionHeader";

interface TransactionSectionProps {
  sectionRef: React.RefObject<HTMLDivElement>;
  showDeleted: boolean;
  showAllTxns: boolean;
  txSearchInput: string;
  txSearch: string;
  txTypeFilter: "ALL" | "EXPENSE" | "INCOME" | "TRANSFER";
  selectedCategoryId: string | null;
  selectedTags: string[];
  availableTags: string[];
  txPage: number;
  isExporting: boolean;
  deletedLoading: boolean;
  deletedTxs: DeletedTransactionDto[];
  allTxLoading: boolean;
  txLoading: boolean;
  allTxData:
    | {
        data: TransactionListDto[];
        meta: { totalPages: number; hasNext: boolean };
      }
    | undefined;
  recentTxs: TransactionListDto[];
  accounts: AccountDto[];
  categories: CategoryDto[];
  currency: string;
  categoryMap: Map<string, CategoryDto>;
  onSetShowDeleted: (v: boolean) => void;
  onSetShowAllTxns: (v: boolean) => void;
  onSetTxSearchInput: (v: string) => void;
  onSetTxTypeFilter: (v: "ALL" | "EXPENSE" | "INCOME" | "TRANSFER") => void;
  onSetSelectedCategoryId: (v: string | null) => void;
  onSetSelectedTags: (v: string[]) => void;
  onSetTxPage: (v: number) => void;
  onExportCsv: () => void;
  onSelectTx: (tx: TransactionListDto) => void;
  onSelectTransferTx: (tx: TransactionListDto) => void;
  onRestore: (tx: DeletedTransactionDto) => void;
}

export default function TransactionSection({
  sectionRef,
  showDeleted,
  showAllTxns,
  txSearchInput,
  txSearch,
  txTypeFilter,
  selectedCategoryId,
  selectedTags,
  availableTags,
  txPage,
  isExporting,
  deletedLoading,
  deletedTxs,
  allTxLoading,
  txLoading,
  allTxData,
  recentTxs,
  accounts,
  categories,
  currency,
  categoryMap,
  onSetShowDeleted,
  onSetShowAllTxns,
  onSetTxSearchInput,
  onSetTxTypeFilter,
  onSetSelectedCategoryId,
  onSetSelectedTags,
  onSetTxPage,
  onExportCsv,
  onSelectTx,
  onSelectTransferTx,
  onRestore,
}: TransactionSectionProps) {
  const txList = showAllTxns ? (allTxData?.data ?? []) : recentTxs;
  const loading = showAllTxns ? allTxLoading : txLoading;

  function handleToggleDeleted() {
    if (!showDeleted) {
      onSetShowDeleted(true);
      onSetShowAllTxns(false);
    } else {
      onSetShowDeleted(false);
    }
  }

  function handleToggleAllTxns() {
    onSetShowAllTxns(true);
    setTimeout(
      () =>
        sectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  }

  function handleResetFilters() {
    onSetShowAllTxns(false);
    onSetTxSearchInput("");
    onSetTxTypeFilter("ALL");
    onSetTxPage(0);
    onSetSelectedCategoryId(null);
    onSetSelectedTags([]);
  }

  return (
    <div ref={sectionRef}>
      <TransactionSectionHeader
        showDeleted={showDeleted}
        showAllTxns={showAllTxns}
        hasRecentTxs={recentTxs.length > 0}
        isExporting={isExporting}
        onToggleDeleted={handleToggleDeleted}
        onToggleAllTxns={handleToggleAllTxns}
        onExportCsv={onExportCsv}
        onResetFilters={handleResetFilters}
      />

      {!showDeleted && showAllTxns && (
        <TransactionFilters
          txSearchInput={txSearchInput}
          txTypeFilter={txTypeFilter}
          selectedCategoryId={selectedCategoryId}
          selectedTags={selectedTags}
          availableTags={availableTags}
          categoryMap={categoryMap}
          onSetTxSearchInput={onSetTxSearchInput}
          onSetTxTypeFilter={onSetTxTypeFilter}
          onClearCategory={() => {
            onSetSelectedCategoryId(null);
            onSetShowAllTxns(false);
            onSetTxPage(0);
          }}
          onSetSelectedTags={onSetSelectedTags}
        />
      )}

      {showDeleted ? (
        <DeletedTransactionList
          deletedLoading={deletedLoading}
          deletedTxs={deletedTxs}
          currency={currency}
          categoryMap={categoryMap}
          onRestore={onRestore}
        />
      ) : (
        <TransactionList
          loading={loading}
          txList={txList}
          showAllTxns={showAllTxns}
          txTypeFilter={txTypeFilter}
          txSearch={txSearch}
          selectedTags={selectedTags}
          selectedCategoryId={selectedCategoryId}
          currency={currency}
          accounts={accounts}
          categoryMap={categoryMap}
          onSelectTx={onSelectTx}
          onSelectTransferTx={onSelectTransferTx}
        />
      )}

      {!showDeleted && showAllTxns && allTxData && (
        <TransactionPagination
          txPage={txPage}
          totalPages={allTxData.meta.totalPages}
          hasNext={allTxData.meta.hasNext}
          onPrev={() => onSetTxPage(txPage - 1)}
          onNext={() => onSetTxPage(txPage + 1)}
        />
      )}
    </div>
  );
}
