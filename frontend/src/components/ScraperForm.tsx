import React, { useState, useEffect } from 'react'
import { Globe2, MapPin, Tag, Search, Play, Square, RotateCcw } from 'lucide-react'
import { Button } from './ui/Button'

interface ScraperData {
  tags: string[]
  regions: string[]
  locations: Record<string, string>[]
}

interface FormState {
  region: string
  city: string
  startingTag: string
  customQuery: string
}

const defaultForm: FormState = {
  region: '',
  city: '',
  startingTag: '',
  customQuery: '',
}

interface ScraperFormProps {
  serperKey: string
  onRunningChange: (running: boolean) => void
}

export const ScraperForm: React.FC<ScraperFormProps> = ({ serperKey, onRunningChange }) => {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [running, setRunning] = useState(false)
  const [data, setData] = useState<ScraperData>({ tags: [], regions: [], locations: [] })
  const [error, setError] = useState<string | null>(null)

  // Load tags/regions/locations from backend
  useEffect(() => {
    fetch('/api/scrape/data')
      .then((r) => r.json())
      .then((d: ScraperData) => {
        setData(d)
        if (d.tags.length > 0) {
          setForm((f) => ({ ...f, startingTag: d.tags[0] }))
        }
      })
      .catch(() => setError('Could not reach backend — is it running?'))
  }, [])

  // Poll status while running
  useEffect(() => {
    if (!running) return
    const id = setInterval(async () => {
      try {
        const r = await fetch('/api/scrape/status')
        const { status } = await r.json()
        if (status !== 'running') {
          setRunning(false)
          onRunningChange(false)
        }
      } catch {
        // ignore transient errors
      }
    }, 2000)
    return () => clearInterval(id)
  }, [running, onRunningChange])

  const cities = data.locations
    .filter((loc) => Object.keys(loc)[0] === form.region)
    .map((loc) => Object.values(loc)[0] as string)
    // deduplicate
    .filter((c, i, arr) => arr.indexOf(c) === i)

  const handleRegionChange = (value: string) => {
    setForm((f) => ({ ...f, region: value, city: '' }))
  }

  const handleReset = () => {
    setForm({ ...defaultForm, startingTag: data.tags[0] ?? '' })
    setError(null)
  }

  const handleRun = async () => {
    setError(null)
    setRunning(true)
    onRunningChange(true)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: form.region,
          city: form.city,
          startingTag: form.startingTag,
          customQuery: form.customQuery,
          serperKey,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scrape')
      setRunning(false)
      onRunningChange(false)
    }
  }

  const handleStop = async () => {
    try {
      await fetch('/api/scrape/stop', { method: 'POST' })
    } finally {
      setRunning(false)
      onRunningChange(false)
    }
  }

  const canRun = !!form.region && !!form.city && !running && !!serperKey

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-lg px-3 py-2.5 bg-red-950/40 border border-red-900/60 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Grid form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Region */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            <Globe2 size={11} className="text-zinc-600" />
            Region
          </label>
          <div className="relative">
            <select
              value={form.region}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 text-zinc-200 transition-all duration-150 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 hover:border-zinc-600 cursor-pointer"
            >
              <option value="" disabled>Select region…</option>
              {data.regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        {/* City */}
        <div className="flex flex-col gap-1.5">
          <label className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest ${form.region ? 'text-zinc-500' : 'text-zinc-700'}`}>
            <MapPin size={11} className={form.region ? 'text-zinc-600' : 'text-zinc-700'} />
            City
          </label>
          <div className="relative">
            <select
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              disabled={!form.region || cities.length === 0}
              className={[
                'w-full appearance-none rounded-lg px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 text-zinc-200 transition-all duration-150 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30',
                (!form.region || cities.length === 0)
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:border-zinc-600 cursor-pointer',
              ].join(' ')}
            >
              <option value="" disabled>
                {form.region ? 'Select city…' : 'Select a region first'}
              </option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <svg className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${form.region ? 'text-zinc-500' : 'text-zinc-700'}`} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        {/* Starting Tag */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            <Tag size={11} className="text-zinc-600" />
            Starting Tag
          </label>
          <div className="relative">
            <select
              value={form.startingTag}
              onChange={(e) => setForm((f) => ({ ...f, startingTag: e.target.value }))}
              disabled={data.tags.length === 0}
              className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 text-zinc-200 transition-all duration-150 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 hover:border-zinc-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {data.tags.length === 0 && <option value="">Loading…</option>}
              {data.tags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
      </div>

      {/* Custom Query */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          <Search size={11} className="text-zinc-600" />
          Custom Query
        </label>
        <textarea
          value={form.customQuery}
          onChange={(e) => setForm((f) => ({ ...f, customQuery: e.target.value }))}
          placeholder="Enter a custom search query…"
          rows={3}
          className="w-full rounded-lg px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder:text-zinc-700 resize-y transition-all duration-150 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 hover:border-zinc-600"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-zinc-800/60">
        {running ? (
          <Button
            variant="primary"
            size="lg"
            icon={<Square size={13} />}
            onClick={handleStop}
            className="flex-1 sm:flex-none justify-center sm:justify-start bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-red-900/30"
          >
            Stop
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            icon={<Play size={13} />}
            onClick={handleRun}
            disabled={!canRun}
            className="flex-1 sm:flex-none justify-center sm:justify-start"
          >
            Start Scrape
          </Button>
        )}

        {!serperKey && !running && (
          <span className="text-[11px] text-amber-600/80">API key required</span>
        )}

        <Button
          variant="ghost"
          size="lg"
          icon={<RotateCcw size={13} />}
          onClick={handleReset}
          disabled={running}
          className="ml-auto"
        >
          Reset
        </Button>
      </div>
    </div>
  )
}

