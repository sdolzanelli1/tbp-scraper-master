/* eslint-disable no-restricted-syntax */
import { ipcMain } from 'electron';
import { getAssetPath } from '../utils/path';
import { logger } from '../utils/logger';
import { createCsvStream } from './writeCSV';
import path from 'path';
const fs = require('fs');
import {
  facebookRegex,
  instagramRegex,
  linkedinRegex,
  phoneRegex,
  twitterRegex,
  emailRegex,
  metaAllRegex,
} from './regex';

const puppeteer = require('puppeteer-core');
// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const _ = require('lodash');
const Store = require('electron-store');
const axios = require('axios');

const store = new Store();
// puppeteer.use(StealthPlugin());
// puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
let browser = null;
let stopScraping = false;
// store a reference to the current csv stream end function so we can
// close the file when scraping is aborted via IPC
let currentCsvEnd = null;
const headless = process.env.NODE_ENV === 'production';

export const formatData = (data) => {
  const filterData = _.uniq(data);
  return filterData.join('\n');
};

export const testURL = (url) => {
  return !/pdf|csv|doc|docx|xls|xlsx/.test(url);
};

export const initBrowser = async () => {
  stopScraping = false;

  require('dotenv').config();

  if (browser) browser.close();
  try {
    // TODO: make this dynamic for different OS and setups
    const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
    browser = await puppeteer.launch({
      headless,
      executablePath: chromePath,
      ignoreHTTPSErrors: true,
    });
  } catch (err) {
    console.error(err);
  }
  return browser;
};

export const closeAllPages = async () => {
  const pages = await browser.pages();
  pages.forEach((page) => {
    page.close();
  });
};

export const scrapeInfo = async (page, link) => {
  let title = '';
  let url = '';
  let description = '';
  let html = '';
  let email = '';
  let phones = '';
  let facebook = '';
  let instagram = '';
  let twitter = '';
  let linkedin = '';
  let meta = '';

  title = await page.title();
  url = await page.url();
  description = link.desc;
  html = await page.evaluate(() => {
    if (document && document.body) return document.body.innerHTML;
    return '';
  });

  email = formatData(html.match(emailRegex));
  phones = formatData(html.match(phoneRegex));
  facebook = formatData(html.match(facebookRegex));
  instagram = formatData(html.match(instagramRegex));
  twitter = formatData(html.match(twitterRegex));
  linkedin = formatData(html.match(linkedinRegex));
  meta = formatData(html.match(metaAllRegex));

  // writeFile(getAssetPath(`out/html_${title.trim(0, 10)}.txt`), html);

  const data = {
    title,
    description,
    url,
    email,
    phones,
    meta,
    facebook,
    instagram,
    twitter,
    linkedin,
  };

  await page.close();
  return data;
};

export const scrapeWebpage = async (link) => {
  let page;
  let info = {};
  const TIMEOUT = 15000; // 15 second timeout for entire operation

  try {
    page = await browser.newPage();
    
    // Set page timeout and navigation timeout
    page.setDefaultNavigationTimeout(TIMEOUT);
    page.setDefaultTimeout(TIMEOUT);
    
    await page.goto(link.url, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    logger(`URL: ${link.url}`);
    info = await scrapeInfo(page, link);
    return info;
  } catch (err) {
    logger(err);
    try {
      // Attempt reload with timeout
      await Promise.race([
        page.reload(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Reload timeout')), 5000)
        ),
      ]);
    } catch (recoveringErr) {
      logger(recoveringErr);
      try {
        // Close browser with timeout
        await Promise.race([
          browser.close(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Browser close timeout')), 5000)
          ),
        ]);
      } catch (finalErr) {
        logger(finalErr);
      }
      if (!stopScraping) {
        browser = await initBrowser();
        page = await browser.newPage();
      }
    }
    try {
      await page.close();
    } catch (closeErr) {
      logger(closeErr);
    }
    return info;
  }
};

export const scrapeLinks = async (query) => {
  const links = [];
  try {
    const apiKey = process.env.SERPERDEV_KEY || store.get('serperKey');
    if (!apiKey) {
      logger('Serper.dev key not found in env var SERPERDEV_KEY or store.serperKey');
      return links;
    }

    const res = await axios.post(
      'https://google.serper.dev/search',
      {
        q: query,
        hl: 'it',
        gl: 'it',
        num: 10,
      },
      {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const data = res && res.data ? res.data : {};
    const results = data.organic || data.orgic || data.organic_results || data.results || [];

    for (const r of results) {
      const url = r.link || r.url || r.source || r.displayed_link || '';
      const desc = r.snippet || r.description || r.title || '';
      if (url && testURL(url)) {
        links.push({ url, desc });
      }
    }
  } catch (err) {
    logger(`Serper.dev error: ${err && err.message ? err.message : err}`);
  }
  return links;
};

export const scrapeResults = async (query, tags) => {
  await initBrowser();
  const store = new Store();
  const outputPath = store.get('outputPath') || '.';
  const csvFile = path.join(outputPath, 'tbp_results.csv');
  // remove any existing file so header is written fresh
  if (fs.existsSync(csvFile)) {
    try {
      fs.unlinkSync(csvFile);
    } catch (err) {
      logger(`Unable to clear previous CSV: ${err.message}`);
    }
  }
  const { write: writeCsvRecord, end: endCsv } = createCsvStream(csvFile);
  // keep global reference so the IPC handler can finish the stream
  currentCsvEnd = endCsv;

  let links = [];

  try {
    if (query.custom.length > 0) {
      logger(`START: ${query.custom}`);
      links = await scrapeLinks(query.custom);
      for await (const link of links) {
        if (stopScraping) break;
        const res = await scrapeWebpage(link);
        if (res) {
          res.tag = query.custom;
          writeCsvRecord(res);
        }
      }
      logger(`END: ${query.custom}`);
    } else {
      tags = tags.slice(tags.indexOf(query.tag), tags.length);
      for await (const tag of tags) {
        if (stopScraping) break;
        logger(`START: ${tag} ${query.location}`);
        links = await scrapeLinks(`${tag} ${query.location}`);
        for await (const link of links) {
          if (stopScraping) break;
          const res = await scrapeWebpage(link);
          if (res) {
            res.tag = tag;
            writeCsvRecord(res);
          }
        }
        logger(`END: ${tag} ${query.location}`);
      }
    }
  } finally {
    // always close the csv stream even if we aborted or errored
    if (currentCsvEnd) {
      await currentCsvEnd();
      currentCsvEnd = null;
    }
    if (browser) {
      await browser.close();
    }
    logger(`DONE`);
  }
};

ipcMain.on('scrape-stop', async () => {
  logger(`STOPPED`);
  stopScraping = true;
  // close any existing CSV stream so file handle is released
  if (currentCsvEnd) {
    try {
      await currentCsvEnd();
    } catch (e) {
      logger(`error closing csv stream: ${e.message}`);
    }
    currentCsvEnd = null;
  }
  if (browser) await browser.close();
});

export default scrapeResults;
