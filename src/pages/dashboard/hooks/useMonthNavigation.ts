import { monthRange } from "../utils/dateUtils";
import { useState } from "react";

export function useMonthNavigation() {
  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [showPicker, setShowPicker] = useState(false);

  const { dateFrom, dateTo } = monthRange(selYear, selMonth);
  const isCurrentMonth =
    selYear === now.getFullYear() && selMonth === now.getMonth();

  function prevMonth() {
    if (selMonth === 0) {
      setSelYear((y) => y - 1);
      setSelMonth(11);
    } else setSelMonth((m) => m - 1);
  }

  function nextMonth() {
    if (isCurrentMonth) return;
    if (selMonth === 11) {
      setSelYear((y) => y + 1);
      setSelMonth(0);
    } else setSelMonth((m) => m + 1);
  }

  return {
    selYear,
    selMonth,
    showPicker,
    setSelYear,
    setSelMonth,
    setShowPicker,
    prevMonth,
    nextMonth,
    isCurrentMonth,
    dateFrom,
    dateTo,
  };
}
