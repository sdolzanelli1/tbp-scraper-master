import React from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={[
            'w-full appearance-none rounded-lg px-3 py-2.5 text-sm',
            'bg-zinc-900 border border-zinc-800 text-zinc-200',
            'transition-all duration-150',
            'focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30',
            disabled
              ? 'opacity-40 cursor-not-allowed text-zinc-600'
              : 'hover:border-zinc-600 cursor-pointer',
          ].join(' ')}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
            disabled ? 'text-zinc-700' : 'text-zinc-500'
          }`}
        />
      </div>
    </div>
  )
}
