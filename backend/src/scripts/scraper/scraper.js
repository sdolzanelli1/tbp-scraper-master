/* eslint-disable no-restricted-syntax */
import { logger } from '../../utils/logger.js';
import { createRun, finalizeRun, insertResult } from './db.js';
import puppeteer from 'puppeteer';
import _ from 'lodash';
import axios from 'axios';
import {
  facebookRegex,
  instagramRegex,
  linkedinRegex,
  phoneRegex,
  twitterRegex,
  emailRegex,
  metaAllRegex,
} from './regex.js';
// puppeteer.use(StealthPlugin());
// puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
let browser = null;
let stopScraping = false;
let currentRunId = null;
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

  if (browser) await browser.close();
  try {
    logger(`Launching puppeteer browser with headless mode: ${headless}`);
    browser = await puppeteer.launch({
      headless,
      ignoreHTTPSErrors: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch (err) {
    console.error('failed to start browser', err);
    throw err;
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

export const validateSerperKey = async (apiKey) => {
  try {
    const res = await axios.post(
      'https://google.serper.dev/search',
      {
        q: 'test',
        hl: 'it',
        gl: 'it',
        num: 1,
      },
      {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    return { valid: true, message: 'API key is valid' };
  } catch (err) {
    const errorMessage = err && err.response && err.response.data && err.response.data.error
      ? err.response.data.error
      : err.message || 'Unknown error';
    return { 
      valid: false, 
      message: `Invalid Serper.dev API key: ${errorMessage}` 
    };
  }
};

export const scrapeLinks = async (query, apiKey) => {
  const links = [];
  try {
    if (!apiKey) {
      logger('Serper.dev key not provided');
      return links;
    }
    apiKey = String(apiKey);
    // log presence of key (masked) for debugging
    try {
      const masked = apiKey.length > 8 ? `${apiKey.slice(0,4)}...${apiKey.slice(-4)}` : '****';
      logger(`Using Serper.dev key: ${masked}`);
    } catch (e) {}

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


export const scrapeResults = async (query, tags, config = {}) => {
  const serperKey = config.serperKey || process.env.SERPERDEV_KEY || '';

  await initBrowser();

  // Validate Serper API key before starting
  const apiKey = String(serperKey).trim();
  if (!apiKey) {
    logger('ERROR: Serper.dev key not provided.');
    if (browser) await browser.close();
    throw new Error('Serper.dev API key is missing');
  }

  const validation = await validateSerperKey(apiKey);
  if (!validation.valid) {
    logger(`ERROR: ${validation.message}`);
    if (browser) await browser.close();
    throw new Error(validation.message);
  }

  logger('Serper.dev API key validated successfully');

  currentRunId = createRun();
  logger(`DB: created scraping run #${currentRunId}`);

  let links = [];

  try {
    if (query.custom && query.custom.length > 0) {
      logger(`START: ${query.custom}`);
      links = await scrapeLinks(query.custom, apiKey);
      for await (const link of links) {
        if (stopScraping) break;
        const res = await scrapeWebpage(link);
        if (res) {
          res.tag = query.custom;
          insertResult(currentRunId, res);
        }
      }
      logger(`END: ${query.custom}`);
    } else {
      tags = tags.slice(tags.indexOf(query.tag), tags.length);
      for await (const tag of tags) {
        if (stopScraping) break;
        logger(`START: ${tag} ${query.location}`);
        links = await scrapeLinks(`${tag} ${query.location}`, apiKey);
        for await (const link of links) {
          if (stopScraping) break;
          const res = await scrapeWebpage(link);
          if (res) {
            res.tag = tag;
            insertResult(currentRunId, res);
          }
        }
        logger(`END: ${tag} ${query.location}`);
      }
    }
  } finally {
    if (currentRunId !== null) {
      finalizeRun(currentRunId);
      logger(`DB: finalized scraping run #${currentRunId}`);
      currentRunId = null;
    }
    if (browser) {
      await browser.close();
    }
    logger(`DONE`);
  }
};

export const stopScrape = async () => {
  logger(`STOPPED`);
  stopScraping = true;
  if (currentRunId !== null) {
    try {
      finalizeRun(currentRunId);
      logger(`DB: finalized scraping run #${currentRunId} on stop`);
    } catch (e) {
      logger(`error finalizing run: ${e.message}`);
    }
    currentRunId = null;
  }
  if (browser) await browser.close();
};

export default scrapeResults;
