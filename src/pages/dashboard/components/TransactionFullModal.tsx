import { type AccountDto } from "@/api/accounts";
import { type CategoryDto } from "@/api/categories";
import { transactionsApi, type TransactionListDto } from "@/api/transactions";
import EmptyState from "@/components/EmptyState";
import SkeletonRow from "@/components/SkeletonRow";
import { cn } from "@/lib/utils";
import { iconBg, resolveColor, resolveIcon } from "../utils/colorUtils";
import { fmt, fmtDate } from "../utils/formatters";
import { groupByDay, dayTotal } from "../utils/transactionGrouping";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Receipt, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function resolveCat(
  tx: {
    categoryId?: string | null;
    categoryName?: string | null;
    categoryColor?: string | null;
    categoryIcon?: string | null;
  },
  categoryMap: Map<string, CategoryDto>,
) {
  if (!tx.categoryId) return undefined;
  return (
    categoryMap.get(tx.categoryId) ??
    (tx.categoryName
      ? {
          name: tx.categoryName,
          color: tx.categoryColor ?? "#64748b",
          icon: tx.categoryIcon ?? "tag",
        }
      : undefined)
  );
}

export default function TransactionFullModal({
  accountId,
  accounts,
  currency,
  categoryMap,
  dateFrom,
  dateTo,
  initialCategoryId,
  onClose,
  onSelectTx,
  onSelectTransferTx,
}: {
  accountId: string;
  accounts: AccountDto[];
  currency: string;
  categoryMap: Map<string, CategoryDto>;
  dateFrom: string;
  dateTo: string;
  initialCategoryId: string | null;
  onClose: () => void;
  onSelectTx: (tx: TransactionListDto) => void;
  onSelectTransferTx: (tx: TransactionListDto) => void;
}) {
  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState<
    "ALL" | "EXPENSE" | "INCOME" | "TRANSFER"
  >("ALL");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialCategoryId,
  );

  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: [
        "transactions-infinite",
        accountId,
        dateFrom,
        dateTo,
        txSearch,
        txTypeFilter,
        selectedCategoryId,
      ],
      queryFn: ({ pageParam = 0 }) =>
        transactionsApi.list({
          accountIds: [accountId],
          page: pageParam,
          size: 15,
          dateFrom,
          dateTo,
          search: txSearch || undefined,
          types: txTypeFilter !== "ALL" ? [txTypeFilter] : undefined,
          categoryIds: selectedCategoryId ? [selectedCategoryId] : undefined,
        }),
      getNextPageParam: (lastPage) =>
        lastPage.meta.hasNext ? lastPage.meta.currentPage + 1 : undefined,
      initialPageParam: 0,
    });

  const txList = data?.pages.flatMap((p) => p.data) ?? [];

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#1a1a18]">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2a2a28]">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Todas las transacciones
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
              {data?.pages[0]?.meta.totalElements ?? 0} transacciones
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 px-5 py-3 space-y-3">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
            />
            <input
              type="text"
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              placeholder="Buscar transacciones..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-[#2a2a28] bg-gray-50 dark:bg-[#252523] text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {(["ALL", "EXPENSE", "INCOME", "TRANSFER"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTxTypeFilter(t)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  txTypeFilter === t
                    ? t === "EXPENSE"
                      ? "bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      : t === "INCOME"
                        ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                        : t === "TRANSFER"
                          ? "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                          : "bg-gray-100 dark:bg-[#252523] text-gray-700 dark:text-gray-200"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523]",
                )}
              >
                {t === "ALL"
                  ? "Todos"
                  : t === "EXPENSE"
                    ? "Gastos"
                    : t === "INCOME"
                      ? "Ingresos"
                      : "Transferencias"}
              </button>
            ))}
          </div>

          {selectedCategoryId && (() => {
            const cat = categoryMap.get(selectedCategoryId);
            return (
              <button
                onClick={() => setSelectedCategoryId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-[#252523] text-gray-700 dark:text-gray-200 w-fit"
                style={{ borderLeft: `3px solid ${resolveColor(cat?.color)}` }}
              >
                <span>{resolveIcon(cat?.icon)}</span>
                {cat?.name ?? "Categoría"}
                <X size={11} className="text-gray-400 dark:text-gray-500 ml-0.5" />
              </button>
            );
          })()}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-5">
          {isLoading ? (
            <div className="space-y-2 pt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28]"
                >
                  <SkeletonRow />
                </div>
              ))}
            </div>
          ) : txList.length === 0 ? (
            <div className="pt-8">
              <EmptyState
                icon={Receipt}
                title="Sin transacciones"
                sub={
                  txSearch || txTypeFilter !== "ALL" || selectedCategoryId
                    ? "No hay resultados para este filtro"
                    : "No hay transacciones en este período"
                }
              />
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {(() => {
                const groups = groupByDay(txList);
                let globalIdx = 0;
                return groups.map(([day, dayTxs]) => {
                  const total = dayTotal(dayTxs, txTypeFilter);
                  const isNet = txTypeFilter === "ALL";
                  const isTransferFilter = txTypeFilter === "TRANSFER";
                  const totalColor = isTransferFilter
                    ? "text-blue-500 dark:text-blue-400"
                    : isNet
                      ? total >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-500 dark:text-rose-400"
                      : txTypeFilter === "INCOME"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-500 dark:text-rose-400";
                  const totalPrefix = isTransferFilter
                    ? ""
                    : isNet
                      ? total >= 0
                        ? "+"
                        : ""
                      : txTypeFilter === "INCOME"
                        ? "+"
                        : "-";

                  return (
                    <div key={day}>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                          {fmtDate(`${day}T12:00:00`)}
                        </span>
                        {!isTransferFilter && (
                          <span
                            className={cn(
                              "text-[11px] font-semibold tabular-nums",
                              totalColor,
                            )}
                          >
                            {totalPrefix}
                            {fmt(Math.abs(total), currency)}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {dayTxs.map((tx) => {
                          const idx = globalIdx++;
                          const isTransfer = tx.type === "TRANSFER";
                          const cat = isTransfer
                            ? undefined
                            : resolveCat(tx, categoryMap);
                          const color = isTransfer
                            ? "#3b82f6"
                            : resolveColor(cat?.color);
                          const isIncome = tx.type === "INCOME";
                          const isOut =
                            isTransfer && tx.toAccountId != null;
                          const toAccountName =
                            isTransfer && tx.toAccountId
                              ? (accounts.find((a) => a.id === tx.toAccountId)
                                  ?.name ?? tx.toAccountId)
                              : null;

                          return (
                            <div
                              key={tx.id}
                              onClick={() =>
                                isTransfer
                                  ? onSelectTransferTx(tx)
                                  : onSelectTx(tx)
                              }
                              className={cn(
                                "fade-up bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28] px-4 py-3 flex items-center gap-3 transition-all duration-200",
                                "hover:-translate-y-px hover:shadow-sm hover:border-gray-200 dark:hover:border-[#3a3a38] cursor-pointer",
                              )}
                              style={{ animationDelay: `${idx * 40}ms` }}
                            >
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg leading-none"
                                style={{ backgroundColor: iconBg(color) }}
                              >
                                {isTransfer ? (
                                  <ArrowLeftRight
                                    size={16}
                                    style={{ color }}
                                  />
                                ) : (
                                  resolveIcon(cat?.icon)
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                                  {tx.description}
                                </p>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                  {isTransfer
                                    ? isOut
                                      ? `Hacia ${toAccountName}`
                                      : "Transferencia recibida"
                                    : (cat?.name ?? "—")}
                                  {tx.createdBy && (
                                    <span className="ml-1 opacity-60">
                                      · {tx.createdBy}
                                    </span>
                                  )}
                                </p>
                                {tx.tags && tx.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {tx.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-1.5 py-px rounded text-[9px] font-medium bg-gray-100 dark:bg-[#252523] text-gray-400 dark:text-gray-500"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-sm font-semibold flex-shrink-0 tabular-nums",
                                  isTransfer
                                    ? "text-blue-500 dark:text-blue-400"
                                    : isIncome
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-rose-500 dark:text-rose-400",
                                )}
                              >
                                {isTransfer
                                  ? isOut
                                    ? "→"
                                    : "←"
                                  : isIncome
                                    ? "+"
                                    : "-"}
                                {fmt(tx.amount, currency)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}

              <div ref={sentinelRef} className="h-4" />
              {isFetchingNextPage && (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28]"
                    >
                      <SkeletonRow />
                    </div>
                  ))}
                </div>
              )}
              {!hasNextPage && txList.length > 0 && (
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">
                  Todas las transacciones cargadas
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
