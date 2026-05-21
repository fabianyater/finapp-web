import { cn } from '@/lib/utils'
import { ArrowLeftRight, Plus, Receipt, X } from 'lucide-react'
import { useState } from 'react'

export default function CreateActionMenu({
  canTransfer,
  onTransaction,
  onTransfer,
}: {
  canTransfer: boolean
  onTransaction: () => void
  onTransfer: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <button
          aria-label="Cerrar acciones"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-black/10 backdrop-blur-[1px]"
        />
      )}
      <div className="fixed bottom-24 right-4 z-30 sm:right-[max(1rem,calc((100vw-42rem)/2))]">
        {open && (
          <div className="absolute bottom-16 right-0 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-2xl dark:border-[#2a2a28] dark:bg-[#1a1a18]">
            <ActionButton
              icon={Receipt}
              title="Nueva transaccion"
              detail="Gasto o ingreso"
              onClick={() => {
                setOpen(false)
                onTransaction()
              }}
            />
            <ActionButton
              icon={ArrowLeftRight}
              title="Transferencia"
              detail={canTransfer ? 'Entre tus cuentas' : 'Necesitas otra cuenta'}
              disabled={!canTransfer}
              onClick={() => {
                setOpen(false)
                onTransfer()
              }}
            />
          </div>
        )}
        <button
          aria-label={open ? 'Cerrar acciones' : 'Nueva operacion'}
          onClick={() => setOpen((value) => !value)}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a1a18] text-white shadow-[0_18px_50px_rgba(17,24,39,0.28)] transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-[#1a1a18]"
        >
          {open ? <X size={21} /> : <Plus size={23} />}
        </button>
      </div>
    </>
  )
}

function ActionButton({
  icon: Icon,
  title,
  detail,
  disabled,
  onClick,
}: {
  icon: typeof Receipt
  title: string
  detail: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-45'
          : 'hover:bg-gray-50 dark:hover:bg-[#252523]',
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-[#252523] dark:text-gray-200">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</span>
        <span className="block text-xs text-gray-400 dark:text-gray-500">{detail}</span>
      </span>
    </button>
  )
}
