import React from 'react'

interface HeaderProps {
  running: boolean
}

export const Header: React.FC<HeaderProps> = ({ running }) => {
  return (
    <header
      className="flex items-center gap-4 px-6 py-4 border-b border-zinc-800/80"
      style={{ background: 'linear-gradient(135deg, #1a0a06 0%, #0f0f0f 60%)' }}
    >
      {/* TBP Logo mark */}
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="7" height="7" rx="1.5" fill="#c9a84c" />
          <rect x="11" y="2" width="7" height="7" rx="1.5" fill="#c9a84c" opacity="0.6" />
          <rect x="2" y="11" width="7" height="7" rx="1.5" fill="#c9a84c" opacity="0.6" />
          <rect x="11" y="11" width="7" height="7" rx="1.5" fill="#c9a84c" opacity="0.3" />
        </svg>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-lg font-bold tracking-tight text-zinc-100 leading-none">
          Colombo
        </h1>
        <p className="text-[11px] text-zinc-500 mt-0.5 leading-none">
          ToBePolo Scraper
        </p>
      </div>

      {/* Status badge */}
      <div className="ml-auto flex items-center gap-2">
        {running ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Running
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            Idle
          </span>
        )}
      </div>
    </header>
  )
}
