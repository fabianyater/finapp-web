import MonthPicker from "@/components/MonthPicker";
import { MONTH_NAMES } from "../utils/dateUtils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function MonthSelector({
  year,
  month,
  showPicker,
  isCurrentMonth,
  onPrev,
  onNext,
  onTogglePicker,
  onSelect,
  onClosePicker,
}: {
  year: number;
  month: number;
  showPicker: boolean;
  isCurrentMonth: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePicker: () => void;
  onSelect: (y: number, m: number) => void;
  onClosePicker: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <button
        onClick={onPrev}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-all"
      >
        <ChevronLeft size={15} />
      </button>
      <div className="relative">
        <button
          onClick={onTogglePicker}
          className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252523]"
        >
          {MONTH_NAMES[month]} {year}
        </button>
        {showPicker && (
          <MonthPicker
            year={year}
            month={month}
            onSelect={onSelect}
            onClose={onClosePicker}
          />
        )}
      </div>
      <button
        onClick={onNext}
        disabled={isCurrentMonth}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
