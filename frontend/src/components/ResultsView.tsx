import React, { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw, ChevronRight, ChevronDown, ExternalLink, Download, Loader2 } from 'lucide-react'
import { apiFetch } from '../utils/api'

interface Run {
  id: number
  name: string | null
  start_time: string
  end_time: string | null
}

interface Result {
  id: number
  run_id: number
  tag: string | null
  title: string | null
  description: string | null
  url: string | null
  email: string | null
  phones: string | null
  facebook: string | null
  instagram: string | null
  twitter: string | null
  linkedin: string | null
  meta: string | null
}

const fmt = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString()
}

const duration = (start: string, end: string | null) => {
  if (!end) return 'running…'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

const RESULT_COLS: { key: keyof Result; label: string }[] = [
  { key: 'tag', label: 'Tag' },
  { key: 'title', label: 'Title' },
  { key: 'url', label: 'URL' },
  { key: 'email', label: 'Emails' },
  { key: 'phones', label: 'Phones' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'twitter', label: 'Twitter' },
  { key: 'linkedin', label: 'LinkedIn' },
]

const Cell: React.FC<{ value: string | null; isUrl?: boolean }> = ({ value, isUrl }) => {
  if (!value) return <span className="text-zinc-700">—</span>
  if (isUrl) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-amber-400/80 hover:text-amber-400 truncate max-w-[200px]"
        title={value}
      >
        <span className="truncate">{value}</span>
        <ExternalLink size={10} className="shrink-0" />
      </a>
    )
  }
  return <span className="text-zinc-300 whitespace-pre-wrap break-words max-w-[180px]">{value}</span>
}

const RunRow: React.FC<{ run: Run; isActive: boolean; onSelect: () => void }> = ({ run, isActive, onSelect }) => (
  <button
    onClick={onSelect}
    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-zinc-700/60 hover:bg-zinc-700/40 ${
      isActive ? 'bg-zinc-700/60' : ''
    }`}
  >
    {isActive ? (
      <ChevronDown size={14} className="shrink-0 text-amber-400" />
    ) : (
      <ChevronRight size={14} className="shrink-0 text-zinc-600" />
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-mono text-zinc-400">#{run.id}</span>
        {run.name && (
          <span className="text-xs font-medium text-zinc-300 truncate">{run.name}</span>
        )}
        {!run.end_time && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
            running
          </span>
        )}
      </div>
      <div className="text-[11px] text-zinc-500 mt-0.5">{fmt(run.start_time)}</div>
    </div>
    <div className="text-[11px] text-zinc-600 shrink-0">{duration(run.start_time, run.end_time)}</div>
  </button>
)

const ResultsTable: React.FC<{ runId: number; isRunning: boolean; refreshSignal: number; onCountChange: (n: number) => void }> = ({ runId, isRunning, refreshSignal, onCountChange }) => {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const lastIdRef = useRef(0)
  const newFromIdRef = useRef<number | null>(null)

  // Full reload on run change or manual refresh
  useEffect(() => {
    setLoading(true)
    lastIdRef.current = 0
    newFromIdRef.current = null
    apiFetch(`/api/scrape/runs/${runId}/results`)
      .then((r) => r.json())
      .then((data: Result[]) => {
        setResults(data)
        onCountChange(data.length)
        if (data.length > 0) lastIdRef.current = data[0].id
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [runId, refreshSignal])

  // Seamlessly append new rows every 5s while the run is in progress
  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => {
      apiFetch(`/api/scrape/runs/${runId}/results?after=${lastIdRef.current}`)
        .then((r) => r.json())
        .then((data: Result[]) => {
          if (data.length > 0) {
            newFromIdRef.current = data[data.length - 1].id
            setResults((prev) => {
              const next = [...data, ...prev]
              onCountChange(next.length)
              return next
            })
            lastIdRef.current = data[0].id
          }
        })
        .catch(() => {})
    }, 5000)
    return () => clearInterval(id)
  }, [runId, isRunning])

  if (loading) {
    return (
      <div className="px-6 py-8 text-center text-xs text-zinc-600">Loading results…</div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="px-6 py-8 text-center text-xs text-zinc-600">No results yet for this run.</div>
    )
  }

  return (
    <div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-zinc-800/80">
            {RESULT_COLS.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-700 whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr
              key={r.id}
              className={`border-b border-zinc-700/50 hover:bg-zinc-700/20 transition-colors${
                newFromIdRef.current !== null && r.id >= newFromIdRef.current ? ' animate-row-in' : ''
              }`}
            >
              {RESULT_COLS.map((col) => (
                <td key={col.key} className="px-3 py-2 align-top">
                  <Cell value={r[col.key] as string | null} isUrl={col.key === 'url'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const ResultsView: React.FC = () => {
  const [runs, setRuns] = useState<Run[]>([])
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null)
  const [loadingRuns, setLoadingRuns] = useState(true)
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [resultCount, setResultCount] = useState<number | null>(null)

  const selectedRun = runs.find((r) => r.id === selectedRunId) ?? null
  const isSelectedRunning = selectedRun ? !selectedRun.end_time : false

  const loadRuns = useCallback(() => {
    setLoadingRuns(true)
    apiFetch('/api/scrape/runs')
      .then((r) => r.json())
      .then((data: Run[]) => {
        setRuns(data)
        if (data.length > 0 && selectedRunId === null) {
          setSelectedRunId(data[0].id)
        }
      })
      .catch(() => setRuns([]))
      .finally(() => setLoadingRuns(false))
  }, [selectedRunId])

  // Silently refresh the runs sidebar every 5s while the selected run is in progress
  const refreshRunsSilent = useCallback(() => {
    apiFetch('/api/scrape/runs')
      .then((r) => r.json())
      .then((data: Run[]) => setRuns(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadRuns()
  }, [])

  useEffect(() => {
    if (!isSelectedRunning) return
    const id = setInterval(refreshRunsSilent, 5000)
    return () => clearInterval(id)
  }, [isSelectedRunning, refreshRunsSilent])

  const handleRefresh = () => {
    loadRuns()
    setResultCount(null)
    setRefreshSignal((s) => s + 1)
  }

  const handleExport = async () => {
    if (selectedRunId === null) return
    const res = await apiFetch(`/api/scrape/runs/${selectedRunId}/export`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `run_${selectedRunId}_results.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:px-6">
      <div
        className="rounded-xl border border-zinc-700/80 overflow-hidden"
        style={{ background: '#1e1e1e' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-700/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Scraping Runs</h2>
            <p className="text-xs text-zinc-600 mt-0.5">Browse past runs and their results</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-700/60"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>

        <div className="flex min-h-[400px]" style={{ minHeight: 400 }}>
          {/* Runs sidebar */}
          <div className="w-64 shrink-0 border-r border-zinc-700/60 overflow-y-auto" style={{ maxHeight: 600 }}>
            {loadingRuns ? (
              <div className="px-4 py-8 text-center text-xs text-zinc-600">Loading…</div>
            ) : runs.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-zinc-600">No runs yet.</div>
            ) : (
              runs.map((run) => (
                <RunRow
                  key={run.id}
                  run={run}
                  isActive={selectedRunId === run.id}
                  onSelect={() => { setSelectedRunId(run.id); setResultCount(null) }}
                />
              ))
            )}
          </div>

          {/* Results panel */}
          <div className="flex-1 overflow-auto flex flex-col" style={{ maxHeight: 600 }}>
            {selectedRunId === null ? (
              <div className="flex items-center justify-center h-full text-xs text-zinc-600">
                Select a run to view results
              </div>
            ) : (
              <>
                {/* Export bar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700/60 shrink-0">
                  <span className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                    {isSelectedRunning && <Loader2 size={11} className="animate-spin text-emerald-400" />}
                    {resultCount !== null ? `${resultCount} result${resultCount !== 1 ? 's' : ''}` : ''}
                  </span>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors px-2 py-1 rounded-md hover:bg-zinc-700/60"
                  >
                    <Download size={12} />
                    Export CSV
                  </button>
                </div>
                <div className="flex-1 overflow-auto min-w-0">
                  <ResultsTable runId={selectedRunId} isRunning={isSelectedRunning} refreshSignal={refreshSignal} onCountChange={setResultCount} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
