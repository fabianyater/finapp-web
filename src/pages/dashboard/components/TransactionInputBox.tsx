import { cn } from "@/lib/utils";
import { ArrowLeftRight, ArrowRight, Loader2, Plus } from "lucide-react";
import React from "react";

export default function TransactionInputBox({
  input,
  isParsing,
  textareaRef,
  showTransferButton,
  onChange,
  onSubmit,
  onTransfer,
}: {
  input: string;
  isParsing: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  showTransferButton: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onTransfer: () => void;
}) {
  return (
    <div className="bg-white dark:bg-[#1a1a18] rounded-2xl border border-gray-200 dark:border-[#2a2a28] shadow-sm px-4 py-3 flex items-end gap-3">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={onChange}
        placeholder="Escribe una transacción..."
        rows={1}
        className="flex-1 resize-none outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 bg-transparent leading-6 overflow-hidden"
        style={{ minHeight: "24px", maxHeight: "120px" }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      {showTransferButton && (
        <button
          onClick={onTransfer}
          title="Transferencia entre cuentas"
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-gray-100 dark:bg-[#252523] text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
        >
          <ArrowLeftRight size={15} />
        </button>
      )}
      <button
        onClick={onSubmit}
        disabled={isParsing}
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
          input.trim()
            ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
            : "bg-gray-100 dark:bg-[#252523] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2f2f2d]",
          isParsing && "opacity-70 cursor-not-allowed",
        )}
      >
        {isParsing ? (
          <Loader2 size={15} className="animate-spin" />
        ) : input.trim() ? (
          <ArrowRight size={15} />
        ) : (
          <Plus size={15} />
        )}
      </button>
    </div>
  );
}
