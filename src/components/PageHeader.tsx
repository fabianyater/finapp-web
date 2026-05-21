import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function PageHeader({
  title,
  className,
  back = true,
}: {
  title: string
  className?: string
  back?: boolean
}) {
  const navigate = useNavigate()

  return (
    <div className={className ?? 'flex items-center gap-2 mb-6'}>
      {back && (
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h1>
    </div>
  )
}
