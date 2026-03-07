import React, { useState } from 'react'
import { Globe2, MapPin, Tag, Search, Play, RotateCcw } from 'lucide-react'
import { Button } from './ui/Button'

const REGIONS = [
  { value: 'lombardia', label: 'Lombardia' },
  { value: 'piemonte', label: 'Piemonte' },
  { value: 'veneto', label: 'Veneto' },
  { value: 'lazio', label: 'Lazio' },
  { value: 'campania', label: 'Campania' },
  { value: 'sicilia', label: 'Sicilia' },
]

const CITIES_BY_REGION: Record<string, { value: string; label: string }[]> = {
  lombardia: [
    { value: 'milano', label: 'Milano' },
    { value: 'bergamo', label: 'Bergamo' },
    { value: 'brescia', label: 'Brescia' },
  ],
  piemonte: [
    { value: 'torino', label: 'Torino' },
    { value: 'cuneo', label: 'Cuneo' },
  ],
  veneto: [
    { value: 'venezia', label: 'Venezia' },
    { value: 'verona', label: 'Verona' },
    { value: 'padova', label: 'Padova' },
  ],
  lazio: [
    { value: 'roma', label: 'Roma' },
    { value: 'viterbo', label: 'Viterbo' },
  ],
  campania: [
    { value: 'napoli', label: 'Napoli' },
    { value: 'salerno', label: 'Salerno' },
  ],
  sicilia: [
    { value: 'palermo', label: 'Palermo' },
    { value: 'catania', label: 'Catania' },
  ],
}

const STARTING_TAGS = [
  { value: 'accordatore', label: 'Accordatore' },
  { value: 'amplificatore', label: 'Amplificatore' },
  { value: 'basso', label: 'Basso' },
  { value: 'batteria', label: 'Batteria' },
  { value: 'chitarra', label: 'Chitarra' },
  { value: 'effetti', label: 'Effetti' },
  { value: 'microfono', label: 'Microfono' },
  { value: 'pianoforte', label: 'Pianoforte' },
  { value: 'sintetizzatore', label: 'Sintetizzatore' },
]

interface FormState {
  region: string
  city: string
  startingTag: string
  customQuery: string
}

const defaultForm: FormState = {
  region: '',
  city: '',
  startingTag: 'accordatore',
  customQuery: '',
}

export const ScraperForm: React.FC = () => {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [running, setRunning] = useState(false)

  const cities = form.region ? (CITIES_BY_REGION[form.region] ?? []) : []

  const handleRegionChange = (value: string) => {
    setForm((f) => ({ ...f, region: value, city: '' }))
  }

  const handleReset = () => setForm(defaultForm)

  const handleRun = async () => {
    setRunning(true)
    try {
      // Will POST to backend once wired
      await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } catch {
      // backend not yet connected
    } finally {
      setRunning(false)
    }
  }

  const canRun = !!form.region && !!form.city && !running

  return (
    <div className="flex flex-col gap-6">
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
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
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
                <option key={c.value} value={c.value}>{c.label}</option>
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
              className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 text-zinc-200 transition-all duration-150 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 hover:border-zinc-600 cursor-pointer"
            >
              {STARTING_TAGS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
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
        <Button
          variant="primary"
          size="lg"
          icon={
            running ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
            ) : (
              <Play size={13} />
            )
          }
          onClick={handleRun}
          disabled={!canRun}
          className="flex-1 sm:flex-none justify-center sm:justify-start"
        >
          {running ? 'Running…' : 'Start Scrape'}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          icon={<RotateCcw size={13} />}
          onClick={handleReset}
          disabled={running}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
