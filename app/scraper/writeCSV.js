// writeFile.js
import path from 'path';
import { logger } from '../utils/logger';

const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const { dialog } = require('electron');
const Store = require('electron-store');
const _ = require('lodash');

const csvHeader = [
  { id: 'title', title: 'Title' },
  { id: 'description', title: 'Description' },
  { id: 'url', title: 'Url' },
  { id: 'email', title: 'Emails' },
  { id: 'phones', title: 'Phones' },
  { id: 'facebook', title: 'Facebook' },
  { id: 'instagram', title: 'Instagram' },
  { id: 'twitter', title: 'Twitter' },
  { id: 'linkedin', title: 'LinkedIn' },
  { id: 'meta', title: 'Meta Tags' },
];

export const writeCSV = (path, records) => {
  console.log('Write CSV output');
  const csvWriter = createCsvWriter({
    path,
    header: csvHeader,
  });

  console.log(records);

  csvWriter
    .writeRecords(records)
    .then(() => {
      console.log('CSV file written');
      return true;
    })
    .catch((err) => {
      console.log(err);
    });
};

export const writeFile = (path, content) => {
  fs.writeFile(path, content, function (err) {
    if (err) return console.log(err);
    logger('File write successful');
    return false;
  });
};

export const getCSV = (records) => {
  const csvStringifier = createCsvStringifier({
    header: csvHeader,
    fieldDelimiter: ';',
  });
  const header = csvStringifier.getHeaderString();
  const body = csvStringifier.stringifyRecords(records);
  return `${header}${body}`;
};

export const saveFileDialog = async (records, title) => {
  const csv = getCSV(records);
  const options = {
    title: 'Save file',
    defaultPath: title,
    buttonLabel: 'Save',
    filters: [{ name: 'csv', extensions: ['csv'] }],
  };

  const savepath = await dialog.showSaveDialog(options);
  fs.writeFileSync(savepath.filePath, csv, 'utf-8');
  logger('OUTPUT: csv file written');
};

export const saveFile = async (records, title) => {
  const csv = getCSV(records);
  const store = new Store();
  const outputPath = store.get('outputPath');

  const savepath = path.join(outputPath, _.snakeCase(title));
  fs.writeFileSync(`${savepath}.csv`, csv, 'utf-8');
  logger(`OUTPUT: csv file written ${savepath}.csv`);
};
