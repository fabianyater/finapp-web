import { cn } from '@/lib/utils'
import { ArrowLeftRight, ChevronUp, Receipt } from 'lucide-react'
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
      <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2">
        <div className="pointer-events-none absolute bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-2">
          <SatelliteAction
            open={open}
            icon={Receipt}
            label="Txn"
            title="Nueva transaccion"
            delayClass="delay-75"
            onClick={() => {
              setOpen(false)
              onTransaction()
            }}
          />
          <SatelliteAction
            open={open}
            icon={ArrowLeftRight}
            label="Transfer"
            title={canTransfer ? 'Nueva transferencia' : 'Necesitas otra cuenta'}
            delayClass="delay-150"
            disabled={!canTransfer}
            onClick={() => {
              setOpen(false)
              onTransfer()
            }}
          />
        </div>
        <button
          aria-expanded={open}
          aria-label={open ? 'Cerrar acciones' : 'Abrir acciones'}
          onClick={() => setOpen((value) => !value)}
          className="group flex h-14 w-14 items-center justify-center rounded-full border-[5px] border-[#f3f6f1] bg-emerald-700 text-white shadow-[0_16px_38px_rgba(16,90,52,0.34)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-[0_20px_46px_rgba(16,90,52,0.38)] dark:border-[#111110] dark:bg-white dark:text-[#1a1a18]"
        >
          <ChevronUp
            size={21}
            strokeWidth={2.8}
            className={cn(
              'transition-transform duration-300 ease-out',
              open ? 'rotate-180' : 'rotate-0',
            )}
          />
        </button>
      </div>
    </>
  )
}

function SatelliteAction({
  open,
  icon: Icon,
  label,
  title,
  delayClass,
  disabled,
  onClick,
}: {
  open: boolean
  icon: typeof Receipt
  label: string
  title: string
  delayClass: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-label={title}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'pointer-events-auto flex h-12 items-center gap-2 rounded-2xl border bg-white/95 px-3 text-sm font-semibold shadow-[0_14px_34px_rgba(16,40,27,0.2)] backdrop-blur transition-[opacity,transform,border-color,color,background-color] duration-300 ease-out dark:bg-[#1a1a18]/95',
        delayClass,
        open
          ? 'translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-5 scale-90 opacity-0',
        disabled
          ? 'cursor-not-allowed border-gray-200 text-gray-300 dark:border-[#2a2a28] dark:text-gray-600'
          : 'border-gray-200 text-gray-700 hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 dark:border-[#2a2a28] dark:text-gray-100 dark:hover:border-emerald-700 dark:hover:text-emerald-300',
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors dark:bg-[#252523] dark:text-gray-200">
        <Icon size={16} />
      </span>
      <span>{label}</span>
    </button>
  )
}
