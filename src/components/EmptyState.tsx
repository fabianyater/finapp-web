export default function EmptyState({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#252523] flex items-center justify-center mb-1">
        <Icon size={18} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>
    </div>
  );
}
