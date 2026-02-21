import { app } from 'electron';
import path from 'path';
import { logger } from './logger';

const { dialog } = require('electron');
const Store = require('electron-store');

// Path config
export const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'resources')
  : path.join(__dirname, '../../resources');

export const getAssetPath = (paths) => {
  return path.join(RESOURCES_PATH, paths);
};

export const fetchChrome = async () => {
  logger(`PLATFORM: ${process.platform}`);
  let browserPath = '';
  if (process.platform === 'darwin') {
    browserPath = '/Applications/Chromium.app/Contents/MacOS/Chromium';
  } else if (process.platform === 'win32') {
    browserPath = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
  }

  const store = new Store();
  store.set('browserPath', browserPath);
  return browserPath;
};
