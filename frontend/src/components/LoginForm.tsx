import React, { useState } from 'react'
import { Lock } from 'lucide-react'
import { setToken } from '../utils/api'

interface LoginFormProps {
  onLogin: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = (await res.json()) as { token?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Login failed')
        return
      }
      setToken(data.token!)
      onLogin()
    } catch {
      setError('Could not reach the server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: '#161616' }}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-zinc-700/80 overflow-hidden"
        style={{ background: '#1e1e1e' }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-700/60 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Lock size={15} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100">Sign in</h1>
            <p className="text-xs text-zinc-500 mt-0.5">TBP Scraper</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-4">
          {error && (
            <div className="rounded-lg px-3 py-2.5 bg-red-950/40 border border-red-900/60 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder:text-zinc-600 transition-all duration-150 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 hover:border-zinc-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder:text-zinc-600 transition-all duration-150 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 hover:border-zinc-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-lg px-4 py-2.5 text-sm font-semibold bg-amber-500 text-zinc-900 hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
