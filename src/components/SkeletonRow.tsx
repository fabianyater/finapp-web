export default function SkeletonRow() {
  return (
    <div className="px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#252523] flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-gray-100 dark:bg-[#252523] rounded-full w-2/5" />
        <div className="h-2.5 bg-gray-100 dark:bg-[#252523] rounded-full w-1/4" />
      </div>
      <div className="h-3 bg-gray-100 dark:bg-[#252523] rounded-full w-16" />
    </div>
  );
}
