import { type AccountDto } from "@/api/accounts";
import { cn } from "@/lib/utils";
import { resolveColor } from "../utils/colorUtils";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function AccountSelector({
  accounts,
  selectedAccountId,
  onSelect,
}: {
  accounts: AccountDto[];
  selectedAccountId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {accounts.map((account) => {
        const acColor = resolveColor(account.color);
        const isSelected = selectedAccountId === account.id;
        return (
          <button
            key={account.id}
            onClick={() => onSelect(account.id)}
            className={cn(
              "flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all",
              isSelected
                ? "text-white shadow-sm"
                : "bg-white dark:bg-[#1a1a18] border border-gray-200 dark:border-[#2a2a28] text-gray-600 dark:text-gray-400",
            )}
            style={isSelected ? { backgroundColor: acColor } : {}}
          >
            {account.name}
          </button>
        );
      })}
      <Link
        to="/accounts"
        className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-[#1a1a18] border border-gray-200 dark:border-[#2a2a28] text-gray-400 dark:text-gray-500 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-500 transition-all self-center"
      >
        <Plus size={14} />
      </Link>
    </div>
  );
}
