import React from 'react'
import { FolderOpen, SlidersHorizontal, Key } from 'lucide-react'
import { Button } from './ui/Button'

interface ConfigBarProps {
  destination: string
  serperKey: string
  onSerperKeyChange: (key: string) => void
  onSetDestination: () => void
  onAdvanced: () => void
}

export const ConfigBar: React.FC<ConfigBarProps> = ({
  destination,
  serperKey,
  onSerperKeyChange,
  onSetDestination,
  onAdvanced,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-zinc-950/60 border-b border-zinc-800/60 backdrop-blur-sm">
      {/* Serper API key */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="flex items-center gap-1.5 text-xs text-zinc-500 shrink-0">
          <Key size={12} />
          Serper Key
        </span>
        <input
          type="password"
          value={serperKey}
          onChange={(e) => onSerperKeyChange(e.target.value)}
          placeholder="Enter Serper.dev API key…"
          className="flex-1 min-w-0 rounded-md px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 font-mono"
        />
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-5 bg-zinc-800" />

      {/* Destination */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          icon={<FolderOpen size={13} />}
          onClick={onSetDestination}
        >
          Destination
        </Button>
        {destination && (
          <span
            className="truncate text-[11px] text-zinc-600 font-mono max-w-[180px]"
            title={destination}
          >
            {destination}
          </span>
        )}
      </div>

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
