// loadCSV.js
const csv = require('csv-parser');
const fs = require('fs');

export const loadTags = (path) => {
  const tags = [];
  fs.createReadStream(path)
    .pipe(csv())
    .on('data', (row) => {
      tags.push(row[Object.keys(row)[0]]);
    });
  return tags;
};

export const loadLocations = (path) => {
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
    });
  return { locations, regions };
};
