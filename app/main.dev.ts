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
import { getAssetPath, fetchChrome } from './utils/path';

const { dialog } = require('electron');
const Store = require('electron-store');

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

if (process.env.E2E_BUILD === 'true') {
  app
    .whenReady()
    .then(createWindow)
    .catch((err) => console.log(err));
} else {
  app.on('ready', createWindow);
}

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// Read data from CSV
const tagsFilePath = getAssetPath('data/tags.csv');
const locationsFilePath = getAssetPath('data/locations.csv');

const tags: any = loadTags(tagsFilePath);
const { regions } = loadLocations(locationsFilePath);
const { locations } = loadLocations(locationsFilePath);

ipcMain.once('init', async (event) => {
  // Detect Chrome Path
  const browser = await fetchChrome();

  const data = {
    tags,
    regions,
    locations,
    browser,
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
  await scrapeResults(arg, tags);
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
  const outputPath = await dialog.showOpenDialog({
    properties: ['openFile'],
    defaultPath: 'c:/',
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Executables', extensions: ['exe', 'app'] },
    ],
  });
  const store = new Store();
  store.set('outputPath', outputPath.filePaths[0]);
  event.reply('set-browser-path-reply', outputPath.filePaths[0]);
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
    const key = store.get('serperKey');
    event.reply('get-serper-key-reply', key || null);
  } catch (e) {
    event.reply('get-serper-key-reply', null);
  }
});
