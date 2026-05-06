import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { MONTH_SHORT } from "@/pages/dashboard/utils/dateUtils";

export default function MonthPicker({
  year,
  month,
  onSelect,
  onClose,
}: {
  year: number;
  month: number;
  onSelect: (y: number, m: number) => void;
  onClose: () => void;
}) {
  const now = new Date();
  const [pickerYear, setPickerYear] = useState(year);

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-40 bg-white dark:bg-[#1a1a18] rounded-2xl border border-gray-100 dark:border-[#2a2a28] shadow-lg p-4 w-56">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setPickerYear((y) => y - 1)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            {pickerYear}
          </span>
          <button
            onClick={() => setPickerYear((y) => y + 1)}
            disabled={pickerYear >= now.getFullYear()}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTH_SHORT.map((name, i) => {
            const isFuture =
              pickerYear > now.getFullYear() ||
              (pickerYear === now.getFullYear() && i > now.getMonth());
            const isSelected = pickerYear === year && i === month;
            return (
              <button
                key={i}
                disabled={isFuture}
                onClick={() => {
                  onSelect(pickerYear, i);
                  onClose();
                }}
                className={cn(
                  "py-1.5 rounded-lg text-xs font-medium transition-all",
                  isSelected
                    ? "bg-emerald-500 text-white"
                    : isFuture
                      ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523]",
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
