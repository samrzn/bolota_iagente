import 'dotenv/config';
import path from 'node:path';
import parseCSV from '../utils/csvParser.js';
import dbConnection from './connect.js';
import MedicationRepository from '../repositories/medications/medicationRepository.js';
import loggerHelper from '../infra/logger.js';

const csvPath =
  process.env.CSV_PATH ?? path.resolve(process.cwd(), 'dados_produtos.csv');
const mongoUri = process.env.MONGO_URI;

function normalizeRow(r = {}) {
  return {
    code: String(r.id ?? r.code ?? '').trim(),
    description: String(r.descricao ?? r.description ?? '').trim(),
    price: Number(r.preco ?? r.price ?? 0),
    stock: Number(r.estoque ?? r.stock ?? 0)
  };
}

try {
  await dbConnection(mongoUri);
  loggerHelper.info('Parsing CSV at %s', csvPath);

  const rows = await parseCSV(csvPath);
  if (!rows || rows.length === 0) {
    loggerHelper.warn('No rows found in CSV: %s', csvPath);
    process.exit(0);
  }

  const repo = new MedicationRepository();
  loggerHelper.info('Clearing medications collection...');
  await repo.deleteAll();

  const docs = rows
    .map(normalizeRow)
    .filter((d) => d.description && !Number.isNaN(d.price));
  if (docs.length === 0) {
    loggerHelper.warn('No valid docs to insert after normalization.');
    process.exit(0);
  }

  await repo.insertMany(docs);
  loggerHelper.info('Seed completed: %d records inserted', docs.length);
  process.exit(0);
} catch (err) {
  loggerHelper.error('Seed failed: %s', err?.message ?? String(err));
  process.exit(1);
}
