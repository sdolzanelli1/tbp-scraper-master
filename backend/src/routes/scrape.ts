import express from 'express'
import type { Request, Response } from 'express'

export const scrapeRouter = express.Router()

export interface ScrapePayload {
  region: string
  city: string
  startingTag: string
  customQuery: string
}

/**
 * POST /api/scrape
 * Kick off a scrape job.
 * 
 * The actual scraping logic (calling Chrome / Puppeteer / existing Node scripts)
 * will be wired in here once ready.
 */
scrapeRouter.post('/', async (req: Request, res: Response) => {
  const { region, city, startingTag, customQuery } = req.body as ScrapePayload

  if (!region || !city) {
    res.status(400).json({ error: 'region and city are required' })
    return
  }

  console.log('[scrape] Starting job', { region, city, startingTag, customQuery })

  // TODO: invoke your existing scraping Node modules here
  // e.g. await runScraper({ region, city, startingTag, customQuery })

  res.json({
    status: 'started',
    job: { region, city, startingTag, customQuery },
    message: 'Scraper job queued — backend integration pending',
  })
})

/**
 * GET /api/scrape/status
 * Poll the status of the current scrape job.
 */
scrapeRouter.get('/status', (_req: Request, res: Response) => {
  // TODO: return real job status
  res.json({ status: 'idle', progress: 0 })
})
