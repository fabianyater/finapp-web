import { type BudgetDto } from "@/api/budgets";
import { type CategorySummaryDto } from "@/api/categories";
import EmptyState from "@/components/EmptyState";
import { BarChart2, Tag } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import CategoryBars, { BAR_AREA_H } from "./CategoryBars";

export default function CategoryBreakdown({
  selectedAccountId,
  categoryView,
  summaryLoading,
  summaryCats,
  selectedCategoryId,
  budgetMap,
  txSectionRef,
  onSelectCategory,
  onSetShowAllTxns,
  onSetTxPage,
}: {
  selectedAccountId: string | null;
  categoryView: "EXPENSE" | "INCOME";
  summaryLoading: boolean;
  summaryCats: CategorySummaryDto[];
  selectedCategoryId: string | null;
  budgetMap: Record<string, BudgetDto>;
  txSectionRef: React.RefObject<HTMLDivElement>;
  onSelectCategory: (id: string | null) => void;
  onSetShowAllTxns: (v: boolean) => void;
  onSetTxPage: (v: number) => void;
}) {
  if (!selectedAccountId) return null;

  return (
    <div className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28] overflow-hidden">
      <div className="px-4 pt-4 pb-0 flex items-center justify-between">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          {categoryView === "EXPENSE"
            ? "Gastos por categoría"
            : "Ingresos por categoría"}
        </p>
        <div className="flex items-center gap-3">
          {categoryView === "EXPENSE" && (
            <Link
              to="/budgets"
              className="flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Presupuestos
            </Link>
          )}
          <Link
            to="/categories"
            className="flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <Tag size={11} />
            Categorías
          </Link>
        </div>
      </div>

      <div
        className="px-5 pt-3 pb-4"
        style={{ height: `${BAR_AREA_H + 28}px` }}
      >
        {summaryLoading ? (
          <div className="flex items-end gap-3 h-full">
            {[52, 90, 120, 70, 100].map((h, i) => (
              <div
                key={i}
                className="flex-shrink-0 rounded-xl bg-gray-100 dark:bg-[#252523] animate-pulse"
                style={{ width: "54px", height: `${h}px` }}
              />
            ))}
          </div>
        ) : summaryCats.length > 0 ? (
          <CategoryBars
            items={summaryCats}
            barColor={categoryView === "EXPENSE" ? "#f87171" : "#34d399"}
            selectedId={selectedCategoryId}
            budgets={categoryView === "EXPENSE" ? budgetMap : undefined}
            onSelect={(id) => {
              const next = selectedCategoryId === id ? null : id;
              onSelectCategory(next);
              if (next) {
                onSetShowAllTxns(true);
                setTimeout(
                  () =>
                    txSectionRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    }),
                  50,
                );
              } else {
                onSetShowAllTxns(false);
              }
              onSetTxPage(0);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              icon={BarChart2}
              title={
                categoryView === "EXPENSE"
                  ? "Sin gastos registrados"
                  : "Sin ingresos registrados"
              }
              sub="Registra transacciones para ver el desglose"
            />
          </div>
        )}
      </div>
    </div>
  );
}
