import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TransactionPagination({
  txPage,
  totalPages,
  hasNext,
  onPrev,
  onNext,
}: {
  txPage: number;
  totalPages: number;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-3 px-1">
      <button
        onClick={onPrev}
        disabled={txPage === 0}
        className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ChevronLeft size={12} />
        Anterior
      </button>
      <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
        {txPage + 1} / {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={!hasNext}
        className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        Siguiente
        <ChevronRight size={12} />
      </button>
    </div>
  );
}
