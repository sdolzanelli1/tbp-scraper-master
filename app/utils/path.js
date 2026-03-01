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
  // prefer Chromium shipped with Puppeteer; this avoids relying on a
  // locally installed browser and makes the app more self‑contained.
  // require here to avoid bundling issues in the renderer process
  // (path util is used in main process only).
  // eslint-disable-next-line import/no-extraneous-dependencies
  const puppeteer = require('puppeteer');
  const browserPath = puppeteer.executablePath();
  const store = new Store();
  store.set('browserPath', browserPath);
  return browserPath;
};
