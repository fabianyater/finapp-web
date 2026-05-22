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
          className="fade-in fixed inset-0 z-20 bg-black/10 backdrop-blur-[1px]"
        />
      )}
      <div className="fixed bottom-24 right-4 z-30 sm:right-[max(1rem,calc((100vw-42rem)/2))]">
        {open && (
          <div className="fade-in absolute bottom-16 right-0 w-60 overflow-hidden rounded-2xl border border-gray-200/90 bg-white/95 p-1.5 shadow-[0_18px_60px_rgba(17,24,39,0.2)] backdrop-blur dark:border-[#2a2a28] dark:bg-[#1a1a18]/95">
            <ActionButton
              icon={Receipt}
              title="Transaccion"
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
          aria-expanded={open}
          aria-label={open ? 'Cerrar acciones' : 'Nueva transaccion'}
          onClick={() => setOpen((value) => !value)}
          className="group flex h-14 items-center gap-2 rounded-2xl border border-emerald-800 bg-emerald-700 pl-3 pr-4 text-white shadow-[0_18px_44px_rgba(16,90,52,0.32)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-[0_22px_50px_rgba(16,90,52,0.36)] dark:border-white dark:bg-white dark:text-[#1a1a18]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 dark:bg-black/10">
            {open ? <X size={18} /> : <Plus size={19} strokeWidth={2.6} />}
          </span>
          <span className="text-sm font-semibold">Nueva</span>
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
        'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-45'
          : 'hover:bg-gray-50 dark:hover:bg-[#252523]',
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-[#252523] dark:text-gray-200">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</span>
        <span className="block text-xs text-gray-400 dark:text-gray-500">{detail}</span>
      </span>
    </button>
  )
}
