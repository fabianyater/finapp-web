import { type BudgetDto } from "@/api/budgets";
import { type CategorySummaryDto } from "@/api/categories";
import { useThemeStore } from "@/store/theme";
import { hexToRgba, resolveIcon } from "../utils/colorUtils";
import { fmtShort } from "../utils/formatters";

export const BAR_AREA_H = 320;
const MAX_BAR_H = 300;
const MIN_BAR_H = 52;
const MIN_INLINE_H = 28;

export default function CategoryBars({
  items,
  barColor,
  selectedId,
  onSelect,
  budgets,
}: {
  items: CategorySummaryDto[];
  barColor: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  budgets?: Record<string, BudgetDto>;
}) {
  const { mode } = useThemeStore();
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const fillOpacity = isDark
    ? { normal: 0.18, selected: 0.28 }
    : { normal: 0.55, selected: 0.72 };

  const maxAmount = Math.max(
    ...items.map((i) => {
      const b = budgets?.[i.categoryId];
      return b ? Math.max(i.total, b.limitAmount) : i.total;
    }),
    1,
  );
  const hasSelection = selectedId !== null;

  return (
    <div
      className="flex items-end gap-3 overflow-x-auto scrollbar-hide"
      style={{ height: `${BAR_AREA_H}px` }}
    >
      {items.map(({ categoryId, name, icon, total, color: rawColor }, i) => {
        const budget = budgets?.[categoryId];
        const catColor = rawColor
          ? rawColor.startsWith("#")
            ? rawColor
            : `#${rawColor}`
          : null;
        const isSelected = categoryId === selectedId;
        const rawBarH = Math.round((total / maxAmount) * MAX_BAR_H);
        const isLow = rawBarH < MIN_BAR_H;
        const isDimmed = hasSelection && !isSelected;
        const hoverOn = (e: React.MouseEvent<HTMLDivElement>) => {
          if (!isDimmed) {
            e.currentTarget.style.transform = "scaleX(1.06) scaleY(1.02)";
            e.currentTarget.style.filter = "brightness(1.08)";
          }
        };
        const hoverOff = (e: React.MouseEvent<HTMLDivElement>) => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.filter = "";
        };

        if (budget) {
          const pct = total / budget.limitAmount;
          const baseColor = catColor ?? barColor;
          const budgetH = Math.max(
            isLow ? MIN_INLINE_H : MIN_BAR_H,
            Math.round((budget.limitAmount / maxAmount) * MAX_BAR_H),
          );
          const fillH = total > budget.limitAmount ? Math.max(rawBarH, budgetH + 4) : rawBarH;
          const containerH = Math.max(budgetH, fillH);
          const borderColor = isSelected
            ? "rgba(156,163,175,0.55)"
            : "rgba(156,163,175,0.3)";
          const fillBg = hexToRgba(baseColor, fillOpacity.normal);

          return (
            <div
              key={categoryId}
              title={name}
              onClick={() => onSelect(categoryId)}
              className="bar-grow relative shrink-0 cursor-pointer"
              style={{
                width: "64px",
                height: `${containerH}px`,
                animationDelay: `${i * 55}ms`,
                transition:
                  "transform 0.15s ease, filter 0.15s ease, opacity 0.15s ease",
                opacity: isDimmed ? 0.35 : 1,
              }}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
            >
              {fillH > 0 && (
                <div
                  className="absolute bottom-0 inset-x-0"
                  style={{
                    height: `${fillH}px`,
                    backgroundColor: fillBg,
                    borderRadius: "14px",
                    transition: "height 0.45s ease",
                    zIndex: 1,
                  }}
                />
              )}
              <div
                className="absolute bottom-0 inset-x-0 pointer-events-none"
                style={{
                  height: `${budgetH}px`,
                  border: `2px dashed ${borderColor}`,
                  borderRadius: "14px",
                  zIndex: 2,
                }}
              />
              <div
                className={`absolute bottom-2 inset-x-0 flex items-center pointer-events-none ${isLow ? "flex-row justify-center gap-1" : "flex-col gap-0.5"}`}
                style={{ zIndex: 10 }}
              >
                <span className="text-sm leading-none select-none">
                  {resolveIcon(icon)}
                </span>
                <span
                  className="text-sm font-bold tabular-nums leading-none"
                  style={{ color: baseColor }}
                >
                  {fmtShort(total)}
                </span>
                {!isLow && (
                  <span
                    className="text-[9px] font-semibold tabular-nums leading-none"
                    style={{ color: hexToRgba(baseColor, 0.75) }}
                  >
                    {`${Math.round(pct * 100)}%`}
                  </span>
                )}
              </div>
            </div>
          );
        }

        const barH = Math.max(isLow ? MIN_INLINE_H : MIN_BAR_H, rawBarH);
        const color = catColor ?? barColor;

        return (
          <div
            key={categoryId}
            title={name}
            onClick={() => onSelect(categoryId)}
            className={`bar-grow relative flex-shrink-0 rounded-xl flex cursor-pointer ${isLow ? "flex-row items-center justify-center gap-1" : "flex-col items-center justify-end pb-2 gap-0.5"}`}
            style={{
              width: "64px",
              height: `${barH}px`,
              backgroundColor: hexToRgba(color, fillOpacity.normal),
              border: `2px solid ${isSelected ? "rgba(156,163,175,0.55)" : "rgba(156,163,175,0.3)"}`,
              animationDelay: `${i * 55}ms`,
              transition:
                "transform 0.15s ease, filter 0.15s ease, opacity 0.15s ease, border-color 0.15s ease, background-color 0.15s ease",
              opacity: isDimmed ? 0.35 : 1,
            }}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
          >
            <span className="text-sm leading-none select-none">
              {resolveIcon(icon)}
            </span>
            <span
              className="text-sm font-bold tabular-nums leading-none"
              style={{ color: color }}
            >
              {fmtShort(total)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
