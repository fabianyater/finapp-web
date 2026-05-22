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
      <div className="fixed bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-2xl border border-emerald-900/10 bg-white/80 p-1 shadow-[0_18px_48px_rgba(16,40,27,0.2)] backdrop-blur dark:border-white/10 dark:bg-[#171715]/90 sm:left-auto sm:right-[max(1rem,calc((100vw-42rem)/2))] sm:translate-x-0">
        {open && (
          <div className="fade-in absolute bottom-16 left-1/2 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-200/90 bg-white/95 p-1.5 shadow-[0_18px_60px_rgba(17,24,39,0.2)] backdrop-blur dark:border-[#2a2a28] dark:bg-[#1a1a18]/95 sm:left-auto sm:right-0 sm:w-64 sm:translate-x-0">
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
          aria-label="Nueva transaccion"
          onClick={onTransaction}
          className="group flex h-12 min-w-[12.25rem] items-center gap-2.5 rounded-xl bg-emerald-700 px-3 text-left text-white shadow-[0_12px_32px_rgba(16,90,52,0.3)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-[0_16px_38px_rgba(16,90,52,0.34)] dark:bg-white dark:text-[#1a1a18]"
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 dark:bg-black/10">
            <Receipt size={17} />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f3f6f1] text-emerald-800 shadow-sm dark:bg-[#1a1a18] dark:text-white">
              <Plus size={11} strokeWidth={3} />
            </span>
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-4">Nueva transaccion</span>
            <span className="block text-[11px] leading-4 text-emerald-100/80 dark:text-gray-500">
              Gasto o ingreso
            </span>
          </span>
        </button>
        <button
          aria-expanded={open}
          aria-label={open ? 'Cerrar transferencia' : 'Crear transferencia'}
          title="Transferencia"
          onClick={() => setOpen((value) => !value)}
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all',
            open
              ? 'border-emerald-700 bg-emerald-50 text-emerald-800 dark:border-white dark:bg-white dark:text-[#1a1a18]'
              : 'border-gray-200 bg-white text-gray-500 hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 dark:border-[#2a2a28] dark:bg-[#1a1a18] dark:text-gray-300 dark:hover:border-[#4a4a48] dark:hover:text-white',
          )}
        >
          {open ? <X size={17} /> : <ArrowLeftRight size={17} />}
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
