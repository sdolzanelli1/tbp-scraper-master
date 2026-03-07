import { useState, useEffect, useRef } from 'react'
import { Header } from './components/Header'
import { ConfigBar } from './components/ConfigBar'
import { ScraperForm } from './components/ScraperForm'
import { ResultsView } from './components/ResultsView'

type Tab = 'scraper' | 'results'

function App() {
  const [tab, setTab] = useState<Tab>('scraper')
  const [serperKey, setSerperKey] = useState(() => localStorage.getItem('serperKey') ?? '')
  const [serperKeyStatus, setSerperKeyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [running, setRunning] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSerperKeyChange = (key: string) => {
    setSerperKey(key)
    localStorage.setItem('serperKey', key)
    setSerperKeyStatus(key.trim() ? 'checking' : 'idle')
  }

  useEffect(() => {
    if (!serperKey.trim()) {
      setSerperKeyStatus('idle')
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSerperKeyStatus('checking')
      try {
        const res = await fetch('/api/scrape/validate-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serperKey }),
        })
        const data = await res.json()
        setSerperKeyStatus(data.valid ? 'valid' : 'invalid')
      } catch {
        setSerperKeyStatus('invalid')
      }
    }, 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [serperKey])

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: '#0d0d0d' }}
    >
      <Header running={running} />

      <ConfigBar
        serperKey={serperKey}
        serperKeyStatus={serperKeyStatus}
        onSerperKeyChange={handleSerperKeyChange}
        onAdvanced={() => alert('Advanced settings — coming soon')}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 pt-4 border-b border-zinc-800/60">
        {(['scraper', 'results'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold capitalize rounded-t-md transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'text-amber-400 border-amber-400 bg-zinc-900/40'
                : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/30'
            }`}
          >
            {t === 'scraper' ? 'Scraper' : 'Results'}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:px-6">
        {tab === 'scraper' ? (
        <div className="w-full max-w-xl">
          {/* Card */}
          <div
            className="rounded-xl border border-zinc-800/80 overflow-hidden"
            style={{ background: '#141414' }}
          >
            {/* Card header */}
            <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Scraper Configuration
                </h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Configure your search parameters and run the scraper
                </p>
              </div>
            </div>

            {/* Card body */}
            <div className="p-6">
              <ScraperForm
                serperKey={serperKey}
                onRunningChange={setRunning}
              />
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] text-zinc-700 mt-6">
            ToBePolo Scraper · Colombo v1.0.0
          </p>
        </div>
        ) : (
          <ResultsView />
        )}
      </main>
    </div>
  )
}

export default App
