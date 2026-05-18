import { type TransactionListDto } from "@/api/transactions";
import { cn } from "@/lib/utils";
import { iconBg, resolveColor, resolveIcon } from "../../utils/colorUtils";
import { fmt, fmtDateFull } from "../../utils/formatters";

export default function TransactionDetailView({
  tx,
  category,
  accountName,
  currency,
  confirmDelete,
  deleting,
  onDelete,
}: {
  tx: TransactionListDto;
  category: { name: string; color: string; icon: string } | undefined;
  accountName: string;
  currency: string;
  confirmDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  const isIncome = tx.type === "INCOME";
  const color = resolveColor(category?.color);

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
      <div className="flex flex-col items-center gap-2 pt-6 pb-4 px-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl leading-none mb-1"
          style={{ backgroundColor: iconBg(color) }}
        >
          {resolveIcon(category?.icon)}
        </div>
        <span
          className={cn(
            "text-2xl font-bold tabular-nums",
            isIncome
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-500 dark:text-rose-400",
          )}
        >
          {isIncome ? "+" : "-"}
          {fmt(tx.amount, currency)}
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 text-center">
          {tx.description}
        </span>
      </div>

      <div className="px-5 pb-2">
        {row(
          "Tipo",
          <span
            className={cn(
              "px-2 py-0.5 rounded-md text-[11px] font-semibold",
              isIncome
                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                : "bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400",
            )}
          >
            {isIncome ? "Ingreso" : "Gasto"}
          </span>,
        )}
        {row(
          "Categoría",
          <span className="flex items-center gap-1.5">
            <span>{resolveIcon(category?.icon)}</span>
            {category?.name ?? "—"}
          </span>,
        )}
        {row("Fecha", fmtDateFull(tx.occurredOn))}
        {row("Cuenta", accountName)}
        {tx.note && row("Nota", tx.note)}
        {tx.tags &&
          tx.tags.length > 0 &&
          row(
            "Tags",
            <div className="flex flex-wrap gap-1 justify-end">
              {tx.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-[#252523] text-[10px] font-medium text-gray-500 dark:text-gray-400"
                >
                  #{tag}
                </span>
              ))}
            </div>,
          )}
      </div>

      <div className="px-5 pb-5 pt-3">
        <button
          onClick={onDelete}
          disabled={deleting}
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50",
            confirmDelete
              ? "bg-rose-500 hover:bg-rose-600 text-white"
              : "bg-gray-100 dark:bg-[#252523] text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30",
          )}
        >
          {deleting
            ? "Eliminando..."
            : confirmDelete
              ? "¿Confirmar eliminación?"
              : "Eliminar transacción"}
        </button>
      </div>
    </>
  );
}
