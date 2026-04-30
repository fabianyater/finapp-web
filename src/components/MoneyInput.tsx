interface Props {
  value: number | ''
  onChange: (value: number | '') => void
  currency?: string
  placeholder?: string
  className?: string
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function MoneyInput({ value, onChange, currency = 'COP', placeholder = '0', className }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9-]/g, '')
    if (raw === '' || raw === '-') { onChange(''); return }
    const num = parseInt(raw, 10)
    if (!isNaN(num)) onChange(num)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value !== '' ? formatMoney(value, currency) : ''}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  )
}
