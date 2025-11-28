/**
 * Seed script: reads CSV and writes normalized documents to MongoDB.
 * Usage: NODE_ENV=development npm run seed
 */
require('dotenv').config();
const path = require('node:path');
const parseCSV = require('../utils/csvParser.js');
const connect = require('./connect.js');
const MedicationRepository = require('../repositories/medications/medicationRepository.js');
const loggerInfo = require('../infra/loggerInfo.js');

const csvPath = process.env.CSV_PATH;

async function seed() {
  const mongoUri = process.env.MONGO_URI;
  await connect(mongoUri);

  const rows = await parseCSV(csvPath);
  const repo = new MedicationRepository();

  loggerInfo.info('Clearing medications collection...');
  await repo.deleteAll();

  const docs = rows.map((r) => ({
    code: (r.id || r.code || '').toString(),
    description: (r.descricao || r.description || '').trim(),
    price: Number(r.preco || r.price || 0),
    stock: Number(r.estoque || r.stock || 0)
  }));

  await repo.insertMany(docs);
  loggerInfo.info('Seed completed: %d records', docs.length);
}

try {
  await seed();
  process.exit(0);
} catch (err) {
  loggerInfo.error('Seed failed: %s', err.message);
  process.exit(1);
}
