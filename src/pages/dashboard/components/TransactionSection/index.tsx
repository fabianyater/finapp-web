import { type AccountDto } from "@/api/accounts";
import { type CategoryDto } from "@/api/categories";
import {
  type DeletedTransactionDto,
  type TransactionListDto,
} from "@/api/transactions";
import React from "react";
import DeletedTransactionList from "./DeletedTransactionList";
import TransactionList from "./TransactionList";
import TransactionSectionHeader from "./TransactionSectionHeader";

interface TransactionSectionProps {
  sectionRef: React.RefObject<HTMLDivElement | null>;
  showDeleted: boolean;
  txSearch: string;
  txTypeFilter: "ALL" | "EXPENSE" | "INCOME" | "TRANSFER";
  selectedCategoryId: string | null;
  selectedTags: string[];
  isExporting: boolean;
  deletedLoading: boolean;
  deletedTxs: DeletedTransactionDto[];
  txLoading: boolean;
  recentTxs: TransactionListDto[];
  accounts: AccountDto[];
  currency: string;
  categoryMap: Map<string, CategoryDto>;
  onSetShowDeleted: (v: boolean) => void;
  onOpenFullModal: (categoryId?: string | null) => void;
  onExportCsv: () => void;
  onSelectTx: (tx: TransactionListDto) => void;
  onSelectTransferTx: (tx: TransactionListDto) => void;
  onRestore: (tx: DeletedTransactionDto) => void;
}

export default function TransactionSection({
  sectionRef,
  showDeleted,
  isExporting,
  deletedLoading,
  deletedTxs,
  txLoading,
  recentTxs,
  accounts,
  currency,
  categoryMap,
  onSetShowDeleted,
  onOpenFullModal,
  onExportCsv,
  onSelectTx,
  onSelectTransferTx,
  onRestore,
}: TransactionSectionProps) {
  return (
    <div ref={sectionRef}>
      <TransactionSectionHeader
        showDeleted={showDeleted}
        hasRecentTxs={recentTxs.length > 0}
        isExporting={isExporting}
        onToggleDeleted={() => {
          if (!showDeleted) onSetShowDeleted(true);
          else onSetShowDeleted(false);
        }}
        onOpenFullModal={onOpenFullModal}
        onExportCsv={onExportCsv}
      />

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
          loading={txLoading}
          txList={recentTxs}
          showAllTxns={false}
          txTypeFilter="ALL"
          txSearch=""
          selectedTags={[]}
          selectedCategoryId={null}
          currency={currency}
          accounts={accounts}
          categoryMap={categoryMap}
          onSelectTx={onSelectTx}
          onSelectTransferTx={onSelectTransferTx}
        />
      )}
    </div>
  );
}
