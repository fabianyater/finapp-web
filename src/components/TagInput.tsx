import { useState } from "react";

export default function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function commit(raw: string) {
    const tag = raw.replace(/^#+/, "").trim().toLowerCase();
    if (!tag || tags.includes(tag)) {
      setInput("");
      return;
    }
    onChange([...tags, tag]);
    setInput("");
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0)
      onChange(tags.slice(0, -1));
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-gray-200 dark:border-[#3a3a38] bg-white dark:bg-[#252523] min-h-[40px]">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#1a1a18] text-xs font-medium text-gray-600 dark:text-gray-300"
        >
          #{tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => commit(input)}
        placeholder={tags.length === 0 ? "#cafe, #mercado..." : ""}
        className="flex-1 min-w-[80px] outline-none text-xs text-gray-700 dark:text-gray-200 bg-transparent placeholder-gray-300 dark:placeholder-gray-600"
      />
    </div>
  );
}
