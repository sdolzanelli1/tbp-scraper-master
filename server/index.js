require('dotenv').config();
require('regenerator-runtime/runtime');

const express = require('express');
const fs = require('fs');
const path = require('path');

const { loadTags, loadLocations } = require('../app/scraper/parseCSV');
const {
  scrapeResults,
  stopScrape,
  setLogger,
  setRuntimeConfig,
} = require('../app/scraper/scraper');

const app = express();

const APP_DIR = path.join(process.cwd(), 'app');
const RESOURCES_DIR = path.join(process.cwd(), 'resources');
const SETTINGS_FILE = path.join(process.cwd(), '.tbp-scraper-settings.json');

const state = {
  tags: [],
  regions: [],
  locations: [],
  logs: [],
  isScraping: false,
  lastError: '',
  settings: {
    outputPath: process.cwd(),
    browserPath: '',
    serperKey: '',
  },
};

const timestamp = () => {
  const date = new Date();
  return date.toLocaleTimeString('it-IT', { hour12: false });
};

const addLog = (message) => {
  const entry = `[${timestamp()}] ${message}`;
  state.logs.unshift(entry);
  if (state.logs.length > 500) {
    state.logs = state.logs.slice(0, 500);
  }
  console.log(entry);
};

const loadSettings = () => {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      return state.settings;
    }
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      ...state.settings,
      ...parsed,
    };
  } catch (_error) {
    return state.settings;
  }
};

const saveSettings = (settings) => {
  state.settings = {
    ...state.settings,
    ...settings,
  };

  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(state.settings, null, 2), 'utf8');
  setRuntimeConfig(state.settings);
};

const loadInitialData = async () => {
  const tagsPath = path.join(RESOURCES_DIR, 'data', 'tags.csv');
  const locationsPath = path.join(RESOURCES_DIR, 'data', 'locations.csv');

  const tags = await loadTags(tagsPath);
  const locData = await loadLocations(locationsPath);

  state.tags = tags;
  state.regions = locData.regions;
  state.locations = locData.locations;

  addLog(`Loaded ${tags.length} tags, ${locData.regions.length} regions, ${locData.locations.length} locations`);
};

setLogger(addLog);
state.settings = loadSettings();
setRuntimeConfig(state.settings);

app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.get('/api/init', (_req, res) => {
  res.json({
    tags: state.tags,
    regions: state.regions,
    locations: state.locations,
  });
});

app.get('/api/status', (_req, res) => {
  res.json({
    logs: state.logs,
    isScraping: state.isScraping,
    lastError: state.lastError,
    settings: {
      outputPath: state.settings.outputPath,
      browserPath: state.settings.browserPath,
      serperKey: state.settings.serperKey,
    },
  });
});

app.post('/api/settings', (req, res) => {
  const { outputPath, browserPath, serperKey } = req.body || {};

  const updates = {};
  if (typeof outputPath === 'string') updates.outputPath = outputPath.trim();
  if (typeof browserPath === 'string') updates.browserPath = browserPath.trim();
  if (typeof serperKey === 'string') updates.serperKey = serperKey.trim();

  saveSettings(updates);

  res.json({ ok: true, settings: state.settings });
});

app.post('/api/scrape/start', (req, res) => {
  if (state.isScraping) {
    res.status(409).json({ ok: false, message: 'Scraping already running' });
    return;
  }

  const payload = req.body || {};

  if (payload && typeof payload.serperKey === 'string' && payload.serperKey.trim()) {
    saveSettings({ serperKey: payload.serperKey.trim() });
  }

  state.isScraping = true;
  state.lastError = '';

  scrapeResults(payload, state.tags)
    .catch((error) => {
      state.lastError = error && error.message ? error.message : 'Unknown scraping error';
      addLog(`ERROR: ${state.lastError}`);
    })
    .finally(() => {
      state.isScraping = false;
    });

  res.json({ ok: true, started: true });
});

app.post('/api/scrape/stop', async (_req, res) => {
  await stopScrape();
  state.isScraping = false;
  res.json({ ok: true, stopped: true });
});

app.use('/dist', express.static(path.join(APP_DIR, 'dist')));
app.use('/resources', express.static(RESOURCES_DIR));
app.use(express.static(APP_DIR));

app.get('*', (_req, res) => {
  res.sendFile(path.join(APP_DIR, 'app.html'));
});

const port = Number(process.env.API_PORT || 3001);

loadInitialData()
  .then(() => {
    app.listen(port, () => {
      addLog(`API server listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
