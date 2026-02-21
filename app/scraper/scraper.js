/* eslint-disable no-restricted-syntax */
import { ipcMain } from 'electron';
import { getAssetPath } from '../utils/path';
import { logger } from '../utils/logger';
import { saveFile } from './writeCSV';
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
  if (browser) browser.close();
  try {
    const chromePath = store.get('browserPath');
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

  try {
    page = await browser.newPage();
    await page.goto(link.url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    logger(`URL: ${link.url}`);
    info = await scrapeInfo(page, link);
    return info;
  } catch (err) {
    logger(err);
    try {
      await page.reload();
    } catch (recoveringErr) {
      logger(recoveringErr);
      try {
        await browser.close();
      } catch (finalErr) {
        logger(finalErr);
      }
      if (!stopScraping) {
        browser = initBrowser();
        page = await browser.newPage();
      }
    }
    await page.close();
    return info;
  }
};

export const scrapeLinks = async (query) => {
  const links = [];
  try {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      logger('SerpApi key not found in store or SERPAPI_KEY env var');
      return links;
    }

    const res = await axios.get('https://serpapi.com/search', {
      params: {
        q: query,
        engine: 'google',
        api_key: apiKey,
        num: 10,
      },
      timeout: 15000,
    });

    const results = res.data.organic_results || res.data.orgic || res.data.organic || [];
    for (const r of results) {
      const url = r.link || r.url || '';
      const desc = r.snippet || r.title || '';
      if (url && testURL(url)) {
        links.push({ url, desc });
      }
    }
  } catch (err) {
    logger(`SerpApi error: ${err && err.message ? err.message : err}`);
  }
  return links;
};

export const scrapeResults = async (query, tags) => {
  await initBrowser();
  let links = [];

  if (query.custom.length > 0) {
    const data = [];
    logger(`START: ${query.custom}`);
    links = await scrapeLinks(query.custom);
    for await (const link of links) {
      const res = await scrapeWebpage(link);
      if (res) data.push(res);
    }
    await saveFile(data, `tbp_${_.snakeCase(query.custom)}`);
    logger(`END: ${query.custom}`);
  } else {
    tags = tags.slice(tags.indexOf(query.tag), tags.length);
    for await (const tag of tags) {
      const data = [];
      logger(`START: ${tag} ${query.location}`);
      links = await scrapeLinks(`${tag} ${query.location}`);
      for await (const link of links) {
        const res = await scrapeWebpage(link);
        if (res) data.push(res);
      }
      await saveFile(
        data,
        `tbp_${_.snakeCase(tag)}_${_.snakeCase(query.location)}`
      );
      logger(`END: ${tag} ${query.location}`);
    }
  }
  await browser.close();
  logger(`DONE`);
};

ipcMain.on('scrape-stop', async () => {
  logger(`STOPPED`);
  stopScraping = true;
  if (browser) await browser.close();
});

export default scrapeResults;
