import React from 'react'
import { SlidersHorizontal, Key, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from './ui/Button'

interface ConfigBarProps {
  serperKey: string
  serperKeyStatus?: 'idle' | 'checking' | 'valid' | 'invalid'
  onSerperKeyChange: (key: string) => void
  onAdvanced: () => void
}

export const ConfigBar: React.FC<ConfigBarProps> = ({
  serperKey,
  serperKeyStatus = 'idle',
  onSerperKeyChange,
  onAdvanced,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-zinc-900/60 border-b border-zinc-700/60 backdrop-blur-sm">
      {/* Serper API key */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="flex items-center gap-1.5 text-xs text-zinc-500 shrink-0">
          <Key size={12} />
          Serper Key
        </span>
        <div className="relative flex-1 min-w-0">
          <input
            type="password"
            value={serperKey}
            onChange={(e) => onSerperKeyChange(e.target.value)}
            placeholder="Enter Serper.dev API key…"
            className={`w-full rounded-md pl-2.5 pr-7 py-1 text-xs bg-zinc-800 border text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 font-mono transition-colors ${
              serperKeyStatus === 'valid'
                ? 'border-emerald-500/60 focus:border-emerald-500/70 focus:ring-emerald-500/20'
                : serperKeyStatus === 'invalid'
                ? 'border-red-500/60 focus:border-red-500/70 focus:ring-red-500/20'
                : 'border-zinc-700 focus:border-amber-500/50 focus:ring-amber-500/20'
            }`}
          />
          {serperKeyStatus === 'checking' && (
            <Loader2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin" />
          )}
          {serperKeyStatus === 'valid' && (
            <CheckCircle2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500" />
          )}
          {serperKeyStatus === 'invalid' && (
            <XCircle size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500" />
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-5 bg-zinc-700" />

      {/* Advanced */}
      <Button
        variant="ghost"
        size="sm"
        icon={<SlidersHorizontal size={13} />}
        onClick={onAdvanced}
        className="ml-auto"
      >
        Advanced
      </Button>
    </div>
  )
}
