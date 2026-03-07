import express from 'express'
import type { Request, Response } from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import { scrapeResults, stopScrape, validateSerperKey } from '../scripts/scraper/scraper.js'
import { loadTags, loadLocations } from '../scripts/scraper/parseCSV.js'

export const scrapeRouter = express.Router()

// ── Load CSV data once at module load time ───────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '../../resources/data')

let tags: string[] = []
let regions: string[] = []
let locations: Record<string, string>[] = []

async function loadCsvData() {
  try {
    tags = await loadTags(path.join(dataDir, 'tags.csv'))
    const locData = await loadLocations(path.join(dataDir, 'locations.csv'))
    regions = locData.regions
    locations = locData.locations
    console.log(`[scrape] Loaded ${tags.length} tags, ${regions.length} regions, ${locations.length} locations`)
  } catch (err) {
    console.error('[scrape] Failed to load CSV data:', err)
  }
}

loadCsvData()

// ── In-progress job state ────────────────────────────────
let jobRunning = false

export interface ScrapePayload {
  region: string
  city: string
  startingTag?: string
  customQuery?: string
  serperKey?: string
  outputPath?: string
}

/**
 * POST /api/validate-key
 * Validate a Serper.dev API key without running a full scrape.
 */
scrapeRouter.post('/validate-key', async (req: Request, res: Response) => {
  const { serperKey } = req.body as { serperKey?: string }
  const key = (serperKey || process.env.SERPERDEV_KEY || '').trim()
  if (!key) {
    res.status(400).json({ valid: false, message: 'No API key provided' })
    return
  }
  const result = await validateSerperKey(key)
  res.status(result.valid ? 200 : 400).json(result)
})

/**
 * POST /api/scrape
 * Kick off a scrape job.
 */
scrapeRouter.post('/', async (req: Request, res: Response) => {
  const { region, city, startingTag, customQuery, serperKey, outputPath } = req.body as ScrapePayload

  if (!region || !city) {
    res.status(400).json({ error: 'region and city are required' })
    return
  }

  if (jobRunning) {
    res.status(409).json({ error: 'A scrape job is already running' })
    return
  }

  const query = {
    location: `${city} ${region}`,
    tag: startingTag ?? '',
    custom: customQuery ?? '',
  }

  const config = {
    serperKey: serperKey || process.env.SERPERDEV_KEY,
    outputPath: outputPath || process.env.OUTPUT_PATH || '.',
  }

  console.log('[scrape] Starting job', { region, city, startingTag, customQuery })

  jobRunning = true
  // Run in the background so the response is returned immediately
  scrapeResults(query, tags, config)
    .catch((err: Error) => console.error('[scrape] Job failed:', err.message))
    .finally(() => { jobRunning = false })

  res.json({ status: 'started', job: { region, city, startingTag, customQuery } })
})

/**
 * POST /api/scrape/stop
 * Stop the current scrape job.
 */
scrapeRouter.post('/stop', async (_req: Request, res: Response) => {
  await stopScrape()
  jobRunning = false
  res.json({ status: 'stopped' })
})

/**
 * GET /api/scrape/status
 */
scrapeRouter.get('/status', (_req: Request, res: Response) => {
  res.json({ status: jobRunning ? 'running' : 'idle' })
})

/**
 * GET /api/scrape/data
 * Return the loaded tags/regions/locations so the frontend can populate its dropdowns.
 */
scrapeRouter.get('/data', (_req: Request, res: Response) => {
  res.json({ tags, regions, locations })
})
