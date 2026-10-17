import { useState } from 'react'
import { DayPicker, type DateRange as DayRange } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export type CrmDateRangeValue = { from: string; to: string }

const pad = (value: number) => String(value).padStart(2, '0')

const toIso = (date?: Date): string => date
  ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  : ''

const fromIso = (value?: string): Date | undefined => {
  if (!value) return undefined
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const addDays = (date: Date, days: number) => {
  const next = startOfDay(date)
  next.setDate(next.getDate() + days)
  return next
}
const addMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1)
const lastDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)

const formatShort = (date?: Date) => date
  ? new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
  : ''

const presets: Array<{ key: string; label: string; range: () => DayRange }> = [
  { key: 'today', label: 'Hoy', range: () => ({ from: new Date(), to: new Date() }) },
  { key: 'week', label: 'Últimos 7 días', range: () => ({ from: addDays(new Date(), -6), to: new Date() }) },
  { key: 'month30', label: 'Últimos 30 días', range: () => ({ from: addDays(new Date(), -29), to: new Date() }) },
  { key: 'thisMonth', label: 'Este mes', range: () => ({ from: addMonths(new Date(), 0), to: new Date() }) },
  { key: 'lastMonth', label: 'Mes anterior', range: () => ({ from: addMonths(new Date(), -1), to: lastDayOfMonth(addMonths(new Date(), -1)) }) },
]

export function CrmDateRange ({ from, to, onChange }: CrmDateRangeValue & { onChange: (value: CrmDateRangeValue) => void }) {
  const [open, setOpen] = useState(false)
  const range: DayRange = { from: fromIso(from), to: fromIso(to) }
  const [month, setMonth] = useState<Date>(range.from || range.to || new Date())

  const label = range.from
    ? (range.to ? `${formatShort(range.from)} → ${formatShort(range.to)}` : formatShort(range.from))
    : 'Cualquier fecha'

  const apply = (next?: DayRange) => onChange({ from: toIso(next?.from), to: toIso(next?.to) })

  const applyPreset = (preset: typeof presets[number]) => {
    const next = preset.range()
    if (next.from) setMonth(next.from)
    apply(next)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={`crm-date-trigger ${range.from || range.to ? 'is-active' : ''}`} aria-label="Fecha de creación">
          <CalendarDays size={15} aria-hidden="true" />
          <span>{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="crm-date-popover">
        <div className="crm-date-presets">
          {presets.map(preset => <button type="button" key={preset.key} className="crm-date-preset" onClick={() => applyPreset(preset)}>{preset.label}</button>)}
        </div>
        <DayPicker
          className="crm-calendar"
          mode="range"
          locale={es}
          weekStartsOn={1}
          numberOfMonths={1}
          showOutsideDays
          month={month}
          onMonthChange={setMonth}
          selected={range}
          onSelect={next => apply(next)}
          components={{
            IconLeft: () => <ChevronLeft size={16} />,
            IconRight: () => <ChevronRight size={16} />,
          }}
        />
        <div className="crm-date-foot">
          <small>{label}</small>
          <button type="button" className="crm-date-clear" onClick={() => apply(undefined)}>Limpiar fechas</button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
