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
          className="fixed inset-0 z-20 bg-black/10 backdrop-blur-[1px] fade-in"
        />
      )}
      <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2">
        {open && (
          <div className="create-action-popover absolute bottom-20 left-1/2 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-200/90 bg-white/95 p-1.5 shadow-[0_20px_70px_rgba(16,40,27,0.24)] backdrop-blur dark:border-[#2a2a28] dark:bg-[#1a1a18]/95">
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
          className="group flex h-14 w-14 items-center justify-center rounded-full border-[5px] border-[#f3f6f1] bg-emerald-700 text-white shadow-[0_16px_38px_rgba(16,90,52,0.34)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-[0_20px_46px_rgba(16,90,52,0.38)] dark:border-[#111110] dark:bg-white dark:text-[#1a1a18]"
        >
          {open ? <X size={18} /> : <Plus size={21} strokeWidth={2.5} />}
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
