// loadCSV.js
const csv = require('csv-parser');
const fs = require('fs');

export const loadTags = (path) => {
  return new Promise((resolve, reject) => {
    const tags = [];
    fs.createReadStream(path)
      .pipe(csv())
      .on('data', (row) => {
        tags.push(row[Object.keys(row)[0]]);
      })
      .on('end', () => {
        resolve(tags);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

export const loadLocations = (path) => {
  return new Promise((resolve, reject) => {
    const locations = [];
    const regions = [];
    fs.createReadStream(path)
      .pipe(csv())
      .on('data', (row) => {
        const { regione } = row;
        const { comune } = row;
        locations.push({
          [regione]: comune,
        });
        if (!regions.includes(regione)) {
          regions.push(regione);
        }
      })
      .on('end', () => {
        resolve({ locations, regions });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};
