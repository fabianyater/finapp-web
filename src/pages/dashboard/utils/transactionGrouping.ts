import { type TransactionListDto } from "@/api/transactions";

export function localDateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function groupByDay(txs: TransactionListDto[]) {
  const map = new Map<string, TransactionListDto[]>();
  for (const tx of txs) {
    const day = localDateKey(tx.occurredOn);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(tx);
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

export function dayTotal(
  txs: TransactionListDto[],
  typeFilter: "ALL" | "EXPENSE" | "INCOME" | "TRANSFER",
) {
  if (typeFilter === "TRANSFER") return 0;
  if (typeFilter === "INCOME")
    return txs
      .filter((t) => t.type === "INCOME")
      .reduce((s, t) => s + t.amount, 0);
  if (typeFilter === "EXPENSE")
    return txs
      .filter((t) => t.type === "EXPENSE")
      .reduce((s, t) => s + t.amount, 0);
  const income = txs
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const expense = txs
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);
  return income - expense;
}
