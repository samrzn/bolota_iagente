const fs = require('node:fs');
const csv = require('csv-parser');
const loggerInfo = require('../infra/logger.js');

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      const err = new Error(`CSV file not found at ${filePath}`);
      loggerInfo.error(err.message);
      return reject(err);
    }
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ',' }))
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', (err) => reject(err));
  });
}

module.exports = parseCSV;
