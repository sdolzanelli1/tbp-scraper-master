import express from 'express'
import cors from 'cors'
import { scrapeRouter } from './routes/scrape.ts'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// ── Routes ──────────────────────────────────────────────
app.use('/api/scrape', scrapeRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' })
})

// ── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[colombo] Backend running on http://localhost:${PORT}`)
})
