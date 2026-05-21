import { cn } from '@/lib/utils'
import {
  Cloud,
  Dumbbell,
  Film,
  Gamepad2,
  Headphones,
  MonitorPlay,
  Music2,
  Smartphone,
  type LucideIcon,
} from 'lucide-react'

type Brand = {
  label: string
  mark: string
  color: string
  surface: string
  icon: LucideIcon
  aliases: string[]
}

const BRANDS: Brand[] = [
  { label: 'Netflix', mark: 'N', color: '#e50914', surface: '#fff1f2', icon: Film, aliases: ['netflix'] },
  { label: 'Spotify', mark: 'S', color: '#15803d', surface: '#ecfdf3', icon: Music2, aliases: ['spotify'] },
  { label: 'YouTube', mark: 'YT', color: '#dc2626', surface: '#fef2f2', icon: MonitorPlay, aliases: ['youtube', 'youtube premium', 'yt premium'] },
  { label: 'Disney+', mark: 'D+', color: '#2563eb', surface: '#eff6ff', icon: Film, aliases: ['disney', 'disney plus', 'disney+'] },
  { label: 'Max', mark: 'M', color: '#5b21b6', surface: '#f5f3ff', icon: Film, aliases: ['hbo', 'hbo max', 'max'] },
  { label: 'Prime Video', mark: 'PV', color: '#0369a1', surface: '#e0f2fe', icon: MonitorPlay, aliases: ['prime video', 'amazon prime', 'prime'] },
  { label: 'Apple', mark: 'A', color: '#111827', surface: '#f3f4f6', icon: Smartphone, aliases: ['apple one', 'apple music', 'apple tv', 'icloud', 'icloud+'] },
  { label: 'Google', mark: 'G', color: '#1d4ed8', surface: '#eff6ff', icon: Cloud, aliases: ['google one', 'google storage', 'google drive'] },
  { label: 'Microsoft', mark: 'MS', color: '#0f766e', surface: '#f0fdfa', icon: Cloud, aliases: ['microsoft 365', 'office 365', 'onedrive'] },
  { label: 'Dropbox', mark: 'DB', color: '#2563eb', surface: '#eff6ff', icon: Cloud, aliases: ['dropbox'] },
  { label: 'PlayStation', mark: 'PS', color: '#1d4ed8', surface: '#eff6ff', icon: Gamepad2, aliases: ['playstation', 'ps plus', 'playstation plus'] },
  { label: 'Xbox', mark: 'X', color: '#15803d', surface: '#ecfdf3', icon: Gamepad2, aliases: ['xbox', 'game pass', 'xbox game pass'] },
  { label: 'Nintendo', mark: 'NS', color: '#dc2626', surface: '#fef2f2', icon: Gamepad2, aliases: ['nintendo', 'switch online'] },
  { label: 'Claude', mark: 'C', color: '#b45309', surface: '#fffbeb', icon: Headphones, aliases: ['claude', 'anthropic'] },
  { label: 'ChatGPT', mark: 'AI', color: '#047857', surface: '#ecfdf5', icon: Headphones, aliases: ['chatgpt', 'openai', 'chat gpt'] },
  { label: 'Gym', mark: 'GY', color: '#be123c', surface: '#fff1f2', icon: Dumbbell, aliases: ['gym', 'gimnasio', 'smart fit', 'bodytech'] },
]

const FALLBACK_COLORS = [
  { color: '#0f766e', surface: '#f0fdfa' },
  { color: '#b45309', surface: '#fffbeb' },
  { color: '#be123c', surface: '#fff1f2' },
  { color: '#4338ca', surface: '#eef2ff' },
  { color: '#0369a1', surface: '#e0f2fe' },
]

function resolveSubscriptionBrand(name: string) {
  const normalized = normalize(name)
  return BRANDS.find((brand) => brand.aliases.some((alias) => normalized.includes(normalize(alias))))
}

export function SubscriptionBrandMark({
  name,
  className,
  showIcon = true,
}: {
  name: string
  className?: string
  showIcon?: boolean
}) {
  const brand = resolveSubscriptionBrand(name)
  const fallback = fallbackBrand(name)
  const Icon = brand?.icon ?? fallback.icon
  const mark = brand?.mark ?? fallback.mark
  const label = brand?.label ?? (name || 'Suscripcion')

  return (
    <span
      title={label}
      className={cn(
        'relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/5 font-bold tracking-tight dark:border-white/5',
        className,
      )}
      style={{
        backgroundColor: brand?.surface ?? fallback.surface,
        color: brand?.color ?? fallback.color,
      }}
    >
      <span className={cn('leading-none', mark.length > 1 ? 'text-[11px]' : 'text-xl')}>{mark}</span>
      {showIcon && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-tl-lg bg-white/90 dark:bg-[#1c1c1a]/90">
          <Icon size={10} strokeWidth={2.3} />
        </span>
      )}
    </span>
  )
}

function fallbackBrand(name: string) {
  const index = hash(normalize(name)) % FALLBACK_COLORS.length
  return {
    ...FALLBACK_COLORS[index],
    mark: initials(name),
    icon: genericIcon(name),
  }
}

function genericIcon(name: string): LucideIcon {
  const normalized = normalize(name)
  if (normalized.includes('music') || normalized.includes('musica')) return Music2
  if (normalized.includes('cloud') || normalized.includes('storage') || normalized.includes('nube')) return Cloud
  if (normalized.includes('gym') || normalized.includes('gimnasio')) return Dumbbell
  if (normalized.includes('game') || normalized.includes('juego')) return Gamepad2
  if (normalized.includes('phone') || normalized.includes('movil')) return Smartphone
  return MonitorPlay
}

function initials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'S'
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase()
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function hash(value: string) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0)
}
