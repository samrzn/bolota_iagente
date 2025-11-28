import 'dotenv/config';
import path from 'node:path';
import parseCSV from '../utils/csvParser.js';
import connect from './connect.js';
import MedicationRepository from '../repositories/medications/medicationRepository.js';
import loggerInfo from '../infra/logger.js';

const csvPath = process.env.CSV_PATH;

async function seed() {
  const mongoUri = process.env.MONGO_URI;
  await connect(mongoUri);

  const rows = await parseCSV(csvPath);
  const repo = new MedicationRepository();

  loggerInfo.info('Clearing medications collection...');
  await repo.deleteAll();

  const docs = rows.map((row) => ({
    code: String(row.id || row.code || ''),
    description: String(row.descricao || row.description || '').trim(),
    price: Number(row.preco || row.price || 0),
    stock: Number(row.estoque || row.stock || 0)
  }));

  await repo.insertMany(docs);

  loggerInfo.info(`Seed completed: ${docs.length} records inserted`);
}

try {
  await seed();
  process.exit(0);
} catch (err) {
  loggerInfo.error(`Seed failed: ${err.message}`);
  process.exit(1);
}
