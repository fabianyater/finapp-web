import { type AccountDto } from "@/api/accounts";
import { transactionsApi, type TransactionListDto } from "@/api/transactions";
import { fmt } from "../../utils/formatters";
import { ArrowLeftRight, Loader2, Trash2, X } from "lucide-react";
import { useState } from "react";

export default function TransferDetailModal({
  tx,
  accounts,
  currency,
  onClose,
  onDeleted,
}: {
  tx: TransactionListDto;
  accounts: AccountDto[];
  currency: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOut = tx.toAccountId != null;
  const fromName = isOut
    ? (accounts.find((a) => a.id === tx.accountId)?.name ?? tx.accountId)
    : (accounts.find((a) => a.id === (tx.toAccountId ?? ""))?.name ?? "—");
  const toName = isOut
    ? (accounts.find((a) => a.id === tx.toAccountId)?.name ?? tx.toAccountId)
    : (accounts.find((a) => a.id === tx.accountId)?.name ?? tx.accountId);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await transactionsApi.removeTransfer(tx.accountId, tx.id);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-[#2a2a28] last:border-0">
      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
        {label}
      </span>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-200 text-right">
        {value}
      </span>
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-[#1a1a18] rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto flex flex-col max-h-[90vh]">
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2a2a28]">
            <div className="flex items-center gap-2">
              <ArrowLeftRight size={14} className="text-blue-500" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Transferencia
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-2">
            {row("Origen", fromName)}
            {row("Destino", toName)}
            {row(
              "Monto",
              <span className="text-blue-500 font-semibold">
                {fmt(tx.amount, currency)}
              </span>,
            )}
            {row(
              "Fecha",
              new Date(tx.occurredOn).toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
            )}
            {tx.description && row("Descripción", tx.description)}
            {tx.note && row("Nota", tx.note)}
          </div>

          <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-[#2a2a28]">
            {!confirmDelete ? (
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 text-sm font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              >
                <Trash2 size={14} />
                Eliminar transferencia
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Se revertirá el balance en ambas cuentas
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#3a3a38] text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252523] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-sm font-medium text-white transition-colors disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
