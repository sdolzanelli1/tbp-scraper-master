import React from 'react'
import { Chrome, FolderOpen, SlidersHorizontal } from 'lucide-react'
import { Button } from './ui/Button'

interface ConfigBarProps {
  chromePath: string
  destination: string
  onSetChrome: () => void
  onSetDestination: () => void
  onAdvanced: () => void
}

export const ConfigBar: React.FC<ConfigBarProps> = ({
  chromePath,
  destination,
  onSetChrome,
  onSetDestination,
  onAdvanced,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-zinc-950/60 border-b border-zinc-800/60 backdrop-blur-sm">
      {/* Chrome browser */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Button
          variant="outline"
          size="sm"
          icon={<Chrome size={13} />}
          onClick={onSetChrome}
        >
          Chrome Browser
        </Button>
        <span
          className="truncate text-[11px] text-zinc-600 font-mono"
          title={chromePath || 'Not set'}
        >
          {chromePath || 'Not configured'}
        </span>
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
