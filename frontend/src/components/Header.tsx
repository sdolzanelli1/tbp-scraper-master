import React from 'react'
import { LogOut } from 'lucide-react'
import tbpLogo from '../assets/tbp.png'

interface HeaderProps {
  running: boolean
  onLogout?: () => void
}

export const Header: React.FC<HeaderProps> = ({ running, onLogout }) => {
  return (
    <header
      className="flex items-center gap-4 px-6 py-4 border-b border-zinc-700/80"
      style={{ background: 'linear-gradient(135deg, #2d1509 0%, #1e1e1e 60%)' }}
    >
      {/* TBP Logo mark */}
      <img src={tbpLogo} alt="TBP Logo" className="w-9 h-9 object-contain" />

      {/* Title */}
      <div>
        <h1 className="text-lg font-bold tracking-tight text-zinc-100 leading-none">
          Colombo
        </h1>
        <p className="text-[11px] text-zinc-500 mt-0.5 leading-none">
          ToBePolo Scraper
        </p>
      </div>

      {/* Status badge + logout */}
      <div className="ml-auto flex items-center gap-3">
        {running ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Running
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            Idle
          </span>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign out"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-700/60"
          >
            <LogOut size={13} />
          </button>
        )}
      </div>
    </header>
  )
}
