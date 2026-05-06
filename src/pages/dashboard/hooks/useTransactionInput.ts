import { transactionsApi, type ParseTransactionResponse } from "@/api/transactions";
import { useRef, useState } from "react";

export function useTransactionInput(selectedAccountId: string | null) {
  const [input, setInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParseTransactionResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSubmitInput = async () => {
    if (!selectedAccountId) return;
    const text = input.trim();
    if (!text) {
      setParsedData(null);
      setShowModal(true);
      return;
    }
    setIsParsing(true);
    try {
      const result = await transactionsApi.parseTransaction(text);
      setParsedData(result);
    } catch {
      setParsedData(null);
    } finally {
      setIsParsing(false);
      setShowModal(true);
    }
  };

  return {
    input,
    setInput,
    isParsing,
    parsedData,
    setParsedData,
    showModal,
    setShowModal,
    textareaRef,
    handleInput,
    handleSubmitInput,
  };
}
