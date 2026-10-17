import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type DesignSelectOption = { value: string; label: string }

export type DesignSelectProps = {
  value: string
  placeholder: string
  options: DesignSelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  className?: string
}

/**
 * Select con el diseño del CRM (Radix + clases crm-select-*).
 * Se usa en todos los desplegables para mantener el mismo aspecto.
 */
export function DesignSelect ({ value, placeholder, options, onChange, disabled = false, invalid = false, className }: DesignSelectProps) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={`crm-select-trigger ${invalid ? 'crm-select-invalid' : ''} ${className || ''}`.trim()} aria-label={placeholder} aria-invalid={invalid}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="crm-select-content">
        {options.map(option => <SelectItem className="crm-select-item" key={option.value} value={option.value}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
