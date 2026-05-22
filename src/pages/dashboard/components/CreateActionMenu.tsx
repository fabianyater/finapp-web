import { cn } from '@/lib/utils'
import { ArrowLeftRight, Plus, Receipt, X } from 'lucide-react'
import { useState } from 'react'

export default function CreateActionMenu({
  canCreateTransaction,
  canTransfer,
  onTransaction,
  onTransfer,
}: {
  canCreateTransaction: boolean
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
          className="fade-in fixed inset-0 z-[35] bg-black/55 backdrop-blur-[1px]"
        />
      )}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(0.45rem+env(safe-area-inset-bottom))] z-40 flex justify-center">
        <div className="pointer-events-none absolute bottom-[5.4rem] flex w-max flex-col items-center gap-2">
          <p
            className={cn(
              'text-sm font-semibold text-white transition-[opacity,transform] duration-150 ease-out',
              open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
            )}
          >
            Crear movimiento
          </p>
          <SatelliteAction
            open={open}
            icon={Receipt}
            label="Transaccion"
            title={canCreateTransaction ? 'Nueva transaccion' : 'Crea una cuenta primero'}
            delayClass="delay-75"
            disabled={!canCreateTransaction}
            onClick={() => {
              setOpen(false)
              onTransaction()
            }}
          />
          <SatelliteAction
            open={open}
            icon={ArrowLeftRight}
            label="Transferencia"
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
          className={cn(
            'pointer-events-auto group flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border-[3px] text-white transition-all duration-150',
            open
              ? 'border-white/35 bg-emerald-950 shadow-[0_18px_52px_rgba(0,0,0,0.52)]'
              : 'border-[#f3f6f1] bg-emerald-700 shadow-[0_16px_38px_rgba(16,90,52,0.34)] hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-[0_20px_46px_rgba(16,90,52,0.38)] dark:border-[#111110]',
          )}
        >
          {open ? <X size={27} strokeWidth={2.4} /> : <Plus size={27} strokeWidth={2.4} />}
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
        'pointer-events-auto flex h-14 min-w-[11.5rem] items-center gap-2.5 rounded-full border border-white/5 bg-[#1e1e1d] px-3 pr-5 text-sm font-semibold text-white shadow-[0_16px_42px_rgba(0,0,0,0.34)] transition-[opacity,transform,border-color,color,background-color] duration-150 ease-out',
        delayClass,
        open
          ? 'translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-5 scale-90 opacity-0',
        disabled
          ? 'cursor-not-allowed opacity-45'
          : 'hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#252523]',
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white',
          Icon === ArrowLeftRight ? 'bg-blue-500' : 'bg-emerald-600',
        )}
      >
        <Icon size={18} />
      </span>
      <span>{label}</span>
    </button>
  )
}
