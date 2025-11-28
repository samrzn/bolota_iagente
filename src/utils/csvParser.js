import fs from 'node:fs';
import csv from 'csv-parser';
import loggerHelper from '../infra/logger.js';

export default function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      const err = new Error(`CSV file not found at ${filePath}`);
      loggerHelper.error(err.message);
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
