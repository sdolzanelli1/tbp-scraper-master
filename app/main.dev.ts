/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { loadTags, loadLocations } from './scraper/parseCSV';
import { scrapeResults } from './scraper/scraper';
import { getAssetPath } from './utils/path';

const { dialog } = require('electron');
const Store = require('electron-store');
require('dotenv').config();

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map((name) => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1200,
    height: 900,
    icon: getAssetPath('icon.png'),
    webPreferences:
      (process.env.NODE_ENV === 'development' ||
        process.env.E2E_BUILD === 'true') &&
      process.env.ERB_SECURE !== 'true'
        ? {
            nodeIntegration: true,
          }
        : {
            preload: path.join(__dirname, 'dist/renderer.prod.js'),
          },
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  // https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Read data from CSV
const loadDataAsync = async () => {
  const tagsFilePath = getAssetPath('data/tags.csv');
  const locationsFilePath = getAssetPath('data/locations.csv');

  let tags: any = [];
  let regions: any = [];
  let locations: any = [];

  try {
    tags = await loadTags(tagsFilePath);
    const locData = await loadLocations(locationsFilePath);
    regions = locData.regions;
    locations = locData.locations;
    
    if (!tags || tags.length === 0) {
      log.warn('Warning: No tags loaded from CSV');
    }
    if (!regions || regions.length === 0) {
      log.warn('Warning: No regions loaded from CSV');
    }
    if (!locations || locations.length === 0) {
      log.warn('Warning: No locations loaded from CSV');
    }
    log.info(`Loaded ${tags.length} tags, ${regions.length} regions, ${locations.length} locations`);
  } catch (error) {
    log.error('Failed to load CSV data files:', error);
  }

  return { tags, regions, locations };
};

let csvData = { tags: [], regions: [], locations: [] };

if (process.env.E2E_BUILD === 'true') {
  app
    .whenReady()
    .then(async () => {
      csvData = await loadDataAsync();
      await createWindow();
    })
    .catch((err) => console.log(err));
} else {
  app.on('ready', async () => {
    csvData = await loadDataAsync();
    await createWindow();
  });
}

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

ipcMain.once('init', async (event) => {
  const data = {
    tags: csvData.tags,
    regions: csvData.regions,
    locations: csvData.locations,
  };
  event.reply('init-reply', data);
});

ipcMain.on('scrape-start', async (event, arg) => {
  try {
    if (arg && arg.serperKey) {
      const store = new Store();
      store.set('serperKey', arg.serperKey);
    }
  } catch (e) {
    // ignore
  }
  try {
    await scrapeResults(arg, csvData.tags);
  } catch (error) {
    log.error('Scraping error:', error);
    event.reply('scrape-error', { message: error.message || 'Unknown error occurred' });
  }
  event.reply('scrape-stop');
});

ipcMain.on('set-path', async (event) => {
  const outputPath = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  const store = new Store();
  store.set('outputPath', outputPath.filePaths[0]);
  event.reply('set-path-reply', outputPath.filePaths[0]);
});

ipcMain.on('set-browser-path', async (event) => {
  const browserPathResult = await dialog.showOpenDialog({
    properties: ['openFile'],
    defaultPath: 'c:/',
    filters: [
      { name: 'Executable Files', extensions: ['exe', 'app'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (browserPathResult.filePaths && browserPathResult.filePaths.length > 0) {
    const store = new Store();
    const selectedPath = browserPathResult.filePaths[0];
    store.set('browserPath', selectedPath);
    event.reply('set-browser-path-reply', selectedPath);
  }
});

ipcMain.on('get-browser-path', async (event) => {
  try {
    const store = new Store();
    const savedPath = store.get('browserPath');
    event.reply('get-browser-path-reply', savedPath || null);
  } catch (e) {
    event.reply('get-browser-path-reply', null);
  }
});

// IPC to set/get serper.dev API key persisted via electron-store
ipcMain.on('set-serper-key', async (_event, key) => {
  try {
    const store = new Store();
    store.set('serperKey', key);
  } catch (e) {
    // ignore
  }
});

ipcMain.on('get-serper-key', async (event) => {
  try {
    const store = new Store();
    const savedKey = store.get('serperKey');
    const envKey = process.env.SERPERDEV_KEY;
    const key = (savedKey || envKey || '').toString().trim();
    if (!savedKey && key) {
      store.set('serperKey', key);
    }
    event.reply('get-serper-key-reply', key || null);
  } catch (e) {
    event.reply('get-serper-key-reply', null);
  }
});
