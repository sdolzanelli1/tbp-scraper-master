import { useState } from 'react'
import { Header } from './components/Header'
import { ConfigBar } from './components/ConfigBar'
import { ScraperForm } from './components/ScraperForm'

function App() {
  const [destination, setDestination] = useState('')
  const [serperKey, setSerperKey] = useState(() => localStorage.getItem('serperKey') ?? '')
  const [running, setRunning] = useState(false)

  const handleSerperKeyChange = (key: string) => {
    setSerperKey(key)
    localStorage.setItem('serperKey', key)
  }

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: '#0d0d0d' }}
    >
      <Header running={running} />

      <ConfigBar
        destination={destination}
        serperKey={serperKey}
        onSerperKeyChange={handleSerperKeyChange}
        onSetDestination={() => {
          const dest = window.prompt('Output destination folder', destination)
          if (dest !== null) setDestination(dest)
        }}
        onAdvanced={() => alert('Advanced settings — coming soon')}
      />

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:px-6">
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
                outputPath={destination}
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
      </main>
    </div>
  )
}

export default App
